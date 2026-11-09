const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('renewing a lost session saves the pending local history and draft without replacing them',async()=>{
 const uid='owner-a',session={access_token:'fresh-owner-token',user:{id:uid,email:'test@example.invalid'},expires_at:Math.floor(Date.now()/1000)+3600};
 const pending={version:1,plans:[{id:'plan',prepared:true}],history:[{id:'pending-record'}],drafts:{plan:{note:'unsent draft',rows:{ex:[{kg:'10',reps:'8',done:true}]}}},favorites:[]};
 const values=new Map([['treino-account-'+uid,JSON.stringify(pending)],['treino-account-'+uid+'-sync',JSON.stringify({revision:1,dirty:true})]]);
 const controls=new Map();const $=selector=>{if(!controls.has(selector))controls.set(selector,{dataset:{},value:'',hidden:false,textContent:'',addEventListener(){}});return controls.get(selector)};
 let restored=false,initialRead=true,authEvent,saved,markup='';
 const auth={
  onAuthStateChange:fn=>{authEvent=fn},
  getSession:async()=>{if(initialRead){initialRead=false;return {data:{session}}}return {data:{session:restored?session:null}}},
  refreshSession:async()=>restored?{data:{session}}:{error:{status:400}},
 };
 const client={auth,from:()=>({select(){return this},eq(){return this},maybeSingle(){return this},setHeader:async()=>({data:{revision:1,payload:pending}})}),realtime:{setAuth:async()=>{}},channel:()=>({on(){return this},subscribe(){return this}}),removeChannel:async()=>{},rpc:(name,args)=>({setHeader:(key,value)=>{assert.equal(key,'Authorization');assert.equal(value,'Bearer fresh-owner-token');saved=JSON.parse(JSON.stringify(args));return Promise.resolve({status:200,data:{revision:2}})}})};
 const window={TREINO_CONFIG:{supabaseUrl:'https://test.supabase.co',supabasePublishableKey:'sb_publishable_test_key_valid_length'},TreinoSupabase:{createClient:()=>client},addEventListener(){}};
 const context=vm.createContext({window,document:{addEventListener(){},visibilityState:'visible'},navigator:{onLine:true},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},state:pending,KEY:'guest',activeStorageKey:'guest',$,validState:()=>true,loadAccountState:(next,key)=>{context.state=next;context.activeStorageKey=key},fresh:()=>({version:1,plans:[],history:[],drafts:{}}),startApp(){},setAccountAccess(){},modal(title,html){markup=html},closeModal(){},toast(){},downloadBackup(){},esc:x=>x,setTimeout:(fn,ms)=>{if(ms===0)queueMicrotask(fn);return 1},clearTimeout(){},console});
 vm.runInContext(fs.readFileSync('sync-core.js','utf8'),context);
 vm.runInContext(fs.readFileSync('cloud.js','utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal($('#account').textContent,'Renovar acesso');assert.equal(saved,undefined);
 assert.equal(context.state.history[0].id,'pending-record');assert.equal(context.state.drafts.plan.note,'unsent draft');
 $('#account').onclick();assert.match(markup,/value="test@example.invalid"/);assert.match(markup,/type="password"/);
 restored=true;authEvent('SIGNED_IN',session);await new Promise(resolve=>setImmediate(resolve));
 assert.equal(saved.p_expected_revision,1);assert.equal(saved.p_user_id,uid);
 assert.equal(saved.p_payload.history[0].id,'pending-record');assert.equal(saved.p_payload.drafts.plan.rows.ex[0].reps,'8');
 const meta=JSON.parse(values.get('treino-account-'+uid+'-sync'));assert.equal(meta.revision,2);assert.equal(meta.dirty,false);assert.equal($('#sync-title').textContent,'Tudo guardado online');
});
