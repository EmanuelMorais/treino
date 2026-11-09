const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const clone=x=>JSON.parse(JSON.stringify(x));
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const payload=note=>({version:1,plans:[{id:'plan',prepared:true,note}],drafts:{},history:[],favorites:[]});
function server(){
 const documents=new Map([['owner-a',{revision:1,payload:payload('initial')}],['owner-b',{revision:1,payload:payload('private')}]]),channels=[];
 return {documents,channels,broadcast:true,readGate:null,saveGate:null,reads:[],writes:[],
  notify(id){if(this.broadcast)for(const ch of channels)if(!ch.removed&&ch.id===id)ch.change({new:{user_id:id,revision:documents.get(id).revision}})},
  commit(id,next){const revision=documents.get(id).revision+1;documents.set(id,{revision,payload:clone(next)});this.notify(id);return revision;},
 };
}
async function device(db,id='owner-a',cached={}){
 const timers=new Map(),controls=new Map(),events={},windowEvents={};let counter=0,session={user:{id,email:'test@example.invalid'},access_token:'test-token'},authEvent;
 const $=selector=>{if(!controls.has(selector))controls.set(selector,{dataset:{},value:'',open:false,hidden:false,textContent:'',addEventListener:(name,fn)=>events[selector+':'+name]=fn});return controls.get(selector)};
 const values=new Map([['treino-account-'+id,JSON.stringify(cached.payload||db.documents.get(id).payload)],['treino-account-'+id+'-sync',JSON.stringify({revision:cached.revision||1,dirty:cached.dirty||false})]]);
 const client={auth:{onAuthStateChange:fn=>authEvent=fn,getSession:async()=>({data:{session}}),refreshSession:async()=>({data:{session}})},realtime:{setAuth:async()=>{}},
  channel(){const channel={removed:false,on(type,filter,change){assert.equal(type,'postgres_changes');assert.equal(filter.table,'training_documents');this.id=filter.filter.slice('user_id=eq.'.length);this.change=change;return this},subscribe(status){this.status=status;db.channels.push(this);queueMicrotask(()=>status('SUBSCRIBED'));return this}};return channel},
  removeChannel:async ch=>{ch.removed=true},
  from(table){assert.equal(table,'training_documents');let columns,target;return {select(value){columns=value;return this},eq(key,value){assert.equal(key,'user_id');target=value;return this},maybeSingle(){return this},async setHeader(){assert.equal(target,session.user.id);db.reads.push({id:target,columns});if(db.readError)return db.readError;const result=clone(db.documents.get(target)||null);if(db.readGate)await db.readGate;return {data:columns==='revision'&&result?{revision:result.revision}:result}}}},
  rpc(name,args){assert.equal(name,'save_training_document');return {async setHeader(){assert.equal(args.p_user_id,session.user.id);db.writes.push(clone(args));const current=db.documents.get(args.p_user_id);if(current.revision!==args.p_expected_revision)return {error:{code:'PT409'}};const revision=db.commit(args.p_user_id,args.p_payload);if(db.saveGate)await db.saveGate;return {data:{revision}}}}},
 };
 const window={TREINO_CONFIG:{supabaseUrl:'https://test.supabase.co',supabasePublishableKey:'sb_publishable_test_key_valid_length'},TreinoSupabase:{createClient:()=>client},addEventListener:(name,fn)=>windowEvents[name]=fn};
 const context=vm.createContext({window,document:{addEventListener:(name,fn)=>events[name]=fn,visibilityState:'visible'},navigator:{onLine:true},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},state:payload('guest'),KEY:'guest',activeStorageKey:'guest',$,validState:()=>true,loadAccountState:(next,key,options)=>{context.state=next;context.activeStorageKey=key;loads.push({next:clone(next),options})},fresh:()=>payload('guest'),startApp(){},setAccountAccess(value){access.push(value)},modal:(title)=>modals.push(title),closeModal:()=>{$('#modal').open=false;events['#modal:close']?.()},toast(){},downloadBackup(){},esc:x=>x,setTimeout:(fn,ms)=>{const timer=++counter;timers.set(timer,{fn,ms});return timer},clearTimeout:timer=>timers.delete(timer),console});
 const loads=[],modals=[],access=[];
 vm.runInContext(fs.readFileSync('sync-core.js','utf8'),context);
 vm.runInContext(fs.readFileSync('cloud.js','utf8'),context);
 const run=async ms=>{for(const [key,timer]of [...timers])if(timer.ms===ms&&timers.delete(key))timer.fn();await settle()};
 await settle();await run(200);loads.length=0;
 return {context,$,loads,modals,access,events,windowEvents,timers,run,values,
  edit(note){context.state.plans[0].note=note;window.TreinoCloud.changed()},
  async switchTo(next){session=next?{user:{id:next,email:'test@example.invalid'},access_token:'test-token'}:null;authEvent(next?'SIGNED_IN':'SIGNED_OUT',session);await run(0)},
  async authEvent(event){authEvent(event,session);await run(0)},
 };
}
test('cached account data does not unlock the application before an authenticated server read succeeds',async()=>{
 const db=server();let release;db.readGate=new Promise(resolve=>release=resolve);const pc=await device(db);assert.equal(pc.access.includes(true),false);release();await settle();assert.equal(pc.access.at(-1),true);
});
test('a rejected session keeps the application locked even when cached plans exist',async()=>{
 const db=server();db.readError={status:401,error:{code:'bad_jwt'}};const pc=await device(db);assert.equal(pc.access.includes(true),false);assert.equal(pc.$('#account').textContent,'Renovar acesso');
});
test('edits propagate both ways between two open devices without a click or reload; own echoes do not render',async()=>{
 const db=server(),phone=await device(db),pc=await device(db);
 phone.edit('from iPhone');await phone.run(1300);await pc.run(200);await phone.run(200);
 assert.equal(pc.context.state.plans[0].note,'from iPhone');assert.equal(pc.loads.length,1);assert.equal(pc.loads[0].options.preserveView,true);assert.equal(phone.loads.length,0);
 pc.edit('from PC');await pc.run(1300);await phone.run(200);await pc.run(200);
 assert.equal(phone.context.state.plans[0].note,'from PC');assert.equal(db.documents.get('owner-a').revision,3);
 assert.equal(db.writes.length,2);assert.equal(pc.$('#sync-title').textContent,'Tudo guardado online');
});
test('fallback checks only the revision and retrieves missed updates; unchanged polls never reset the UI',async()=>{
 const db=server(),pc=await device(db);db.broadcast=false;db.reads.length=0;
 await pc.run(30000);await pc.run(200);assert.equal(pc.loads.length,0);assert.deepEqual(db.reads.map(r=>r.columns),['revision']);
 db.commit('owner-a',payload('missed event'));await pc.run(30000);await pc.run(200);
 assert.equal(pc.context.state.plans[0].note,'missed event');
 db.commit('owner-a',payload('while disconnected'));db.channels[0].status('SUBSCRIBED');await pc.run(200);
 assert.equal(pc.context.state.plans[0].note,'while disconnected');
});
test('a newer server version is adopted automatically, archiving pending local edits without a dialog',async()=>{
 const db=server(),pc=await device(db);pc.edit('keep local');db.commit('owner-a',payload('remote'));await pc.run(200);await pc.run(1300);
 assert.equal(pc.context.state.plans[0].note,'remote');assert.equal(db.writes.length,0);assert.equal(pc.$('#sync-bar').dataset.status,'ok');assert.equal(pc.modals.length,0);
 assert.equal(JSON.parse(pc.values.get('treino-account-owner-a-recovery')).payload.plans[0].note,'keep local');
 await pc.context.window.TreinoCloud.syncNow();assert.equal(pc.modals.length,0);
});
test('logging in with a stale dirty cache loads the PC history automatically and preserves a recovery copy',async()=>{
 const db=server(),local=payload('old phone draft'),remote=payload('latest PC');remote.history.push({id:'saved-on-PC'});
 db.commit('owner-a',remote);const phone=await device(db,'owner-a',{payload:local,revision:1,dirty:true});
 assert.equal(phone.context.state.history[0].id,'saved-on-PC');assert.equal(phone.modals.length,0);assert.equal(db.writes.length,0);
 assert.equal(JSON.parse(phone.values.get('treino-account-owner-a-recovery')).payload.plans[0].note,'old phone draft');assert.equal(phone.$('#sync-title').textContent,'Tudo guardado online');
});
test('a stale save rejected by the server automatically reloads the newest version without a manual choice',async()=>{
 const db=server(),phone=await device(db);db.broadcast=false;phone.edit('unsent');db.commit('owner-a',payload('latest PC'));
 await phone.run(1300);await phone.run(200);
 assert.equal(phone.context.state.plans[0].note,'latest PC');assert.equal(phone.modals.length,0);assert.equal(db.documents.get('owner-a').payload.plans[0].note,'latest PC');
 assert.equal(JSON.parse(phone.values.get('treino-account-owner-a-recovery')).payload.plans[0].note,'unsent');
});
test('returning from the mobile page cache automatically retrieves updates',async()=>{
 const db=server(),phone=await device(db);db.broadcast=false;db.commit('owner-a',payload('changed while away'));
 phone.windowEvents.pageshow();await phone.run(200);assert.equal(phone.context.state.plans[0].note,'changed while away');
});
test('password recovery opens the password screen in the same authenticated account',async()=>{
 const db=server(),phone=await device(db);await phone.authEvent('PASSWORD_RECOVERY');assert.equal(phone.modals.at(-1),'Definir palavra-passe');assert.equal(db.writes.length,0);
});
test('local edits made during a remote read are archived before adopting the latest online version',async()=>{
 const db=server(),pc=await device(db);let release;db.readGate=new Promise(resolve=>release=resolve);
 db.commit('owner-a',payload('remote'));await pc.run(200);pc.edit('typed during request');release();await settle();
 assert.equal(pc.context.state.plans[0].note,'remote');assert.equal(pc.loads.length,1);assert.equal(pc.$('#sync-bar').dataset.status,'ok');
 assert.equal(JSON.parse(pc.values.get('treino-account-owner-a-recovery')).payload.plans[0].note,'typed during request');
});
test('events during a save are reconciled after the save completes, without a false conflict',async()=>{
 const db=server(),pc=await device(db);let release;db.saveGate=new Promise(resolve=>release=resolve);
 pc.edit('local');await pc.run(1300);assert.equal(pc.$('#sync-title').textContent,'A guardar online');
 db.commit('owner-a',payload('newer remote'));release();await settle();await pc.run(200);
 assert.equal(pc.context.state.plans[0].note,'newer remote');assert.equal(pc.$('#sync-bar').dataset.status,'ok');
});
test('background pages and open forms catch up when visible or closed; reconnect also pulls',async()=>{
 const db=server(),pc=await device(db);pc.$('#modal').open=true;db.commit('owner-a',payload('while editing form'));await pc.run(200);assert.equal(pc.loads.length,0);
 pc.$('#modal').open=false;pc.events['#modal:close']();await pc.run(200);assert.equal(pc.context.state.plans[0].note,'while editing form');
 pc.context.document.visibilityState='hidden';db.commit('owner-a',payload('background'));await pc.run(200);assert.equal(pc.loads.length,1);
 pc.context.document.visibilityState='visible';pc.events.visibilitychange();await pc.run(200);assert.equal(pc.context.state.plans[0].note,'background');
 pc.context.navigator.onLine=false;db.commit('owner-a',payload('offline'));await pc.run(200);pc.context.navigator.onLine=true;pc.windowEvents.online();await pc.run(200);assert.equal(pc.context.state.plans[0].note,'offline');
});
test('reconnecting with no new revision clears the offline notice without rendering or saving',async()=>{
 const db=server(),pc=await device(db);
 pc.context.navigator.onLine=false;pc.windowEvents.offline();assert.equal(pc.$('#sync-title').textContent,'Sem ligação · cópia local');
 pc.context.navigator.onLine=true;pc.windowEvents.online();await pc.run(200);
 assert.equal(pc.$('#sync-title').textContent,'Tudo guardado online');assert.equal(pc.loads.length,0);assert.equal(db.writes.length,0);
});
test('logout and account changes remove the old subscription and ignore delayed old-account reads and events',async()=>{
 const db=server(),pc=await device(db);let release;db.readGate=new Promise(resolve=>release=resolve);
 db.commit('owner-a',payload('late old account'));await pc.run(200);const old=db.channels[0];
 const switching=pc.switchTo('owner-b');release();await switching;await settle();await pc.run(200);
 assert.equal(old.removed,true);assert.equal(pc.context.state.plans[0].note,'private');
 old.change({new:{user_id:'owner-a',revision:999}});await pc.run(200);assert.equal(pc.context.state.plans[0].note,'private');
 await pc.switchTo(null);assert.ok(db.channels.every(ch=>ch.removed));await pc.run(30000);assert.equal(pc.context.state.plans[0].note,'guest');
});
