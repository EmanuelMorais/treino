const {test}=require('node:test'),assert=require('node:assert/strict');
const engine=require('../program-engine.js'),domain=require('../src/domain/programme-proposal.js'),catalog=require('../src/domain/exercise-catalog.js'),contract=require('../src/domain/document-contract.js'),records=require('../src/domain/workout-records.js');
const copy=x=>JSON.parse(JSON.stringify(x));
const uid=(()=>{let i=0;return()=> 'fictitious-'+(++i)})();
const proposal=extra=>engine.generate({...engine.defaults(),name:'Synthetic',adult:true,consent:true,goals:['muscle'],primaryGoal:'muscle',equipment:['dumbbells','bench'],weeks:8,minutes:45,experience:'regular',...extra});
const empty=()=>({version:1,plans:[],history:[],drafts:{},favorites:[]});
const dose=(extra={})=>({sets:3,target:'10–12',restSeconds:75,video:'',start:0,...extra});
function active(){const p=proposal();return domain.activate({...empty(),proposal:p},p,{uid,now:1}).document;}
function find(doc,week,day=0){return doc.plans.find(p=>p.program?.week===week&&p.program.day===day);}

test('preparing and reopening a proposal preserves edits without rerunning the generator',()=>{
 const p=proposal(),before=JSON.stringify(p),prepared=domain.prepare(p),slot=prepared.sessions[0].exercises[0].proposalSlot;
 const changed=domain.change(p,{type:'dose',day:0,slot,dose:dose()});
 assert.equal(JSON.stringify(p),before);assert.equal(changed.personalized,true);
 for(const s of changed.sessions.filter(s=>s.day===0))assert.equal(s.exercises[0].sets,s.light?1:3);
 assert.equal(domain.prepare(JSON.parse(JSON.stringify(changed))).sessions[0].exercises[0].restSeconds,75);
 assert.equal(contract.valid({...empty(),proposal:changed}),true);
});
test('replacement never carries performed weights or incompatible measures, and order/add/remove apply to the same day only',()=>{
 let p=domain.prepare(proposal()),first=p.sessions[0].exercises[0],other=JSON.stringify(p.sessions.filter(s=>s.day===1).map(s=>s.exercises));
 p=domain.change(p,{type:'replace',day:0,slot:first.proposalSlot,definition:catalog.exercises.find(e=>e.id==='side-plank'),dose:dose({target:'20–30'})});
 const e=p.sessions[0].exercises[0];assert.equal(e.unit,'s');assert.equal(e.loadReference,'bodyweight');assert.equal(e.kg,undefined);assert.equal(e.rows,undefined);assert.equal(e.exerciseKey,'catalog:side-plank');
 p=domain.change(p,{type:'move',day:0,slot:e.proposalSlot,offset:1});assert.equal(p.sessions[0].exercises[1].exerciseKey,e.exerciseKey);
 p=domain.change(p,{type:'add',day:0,newSlot:'added-slot',definition:catalog.exercises.find(e=>e.id==='hammer-curl'),dose:dose()});assert.equal(p.sessions[0].exercises.at(-1).proposalSlot,'added-slot');
 p=domain.change(p,{type:'remove',day:0,slot:'added-slot'});assert.equal(p.sessions[0].exercises.some(e=>e.proposalSlot==='added-slot'),false);
 assert.equal(JSON.stringify(p.sessions.filter(s=>s.day===1).map(s=>s.exercises)),other);
});
test('personal library exercises retain their private identity without invalid occurrence IDs',()=>{
 const p=proposal(),definition={id:'custom:old-exercise',exerciseKey:'custom:old-exercise',name:'Movimento pessoal',unit:'reps',loadReference:'bodyweight',equipment:[],muscles:['Core'],how:'Nota fictícia',personal:true};
 const result=domain.change(p,{type:'add',day:0,newSlot:'private-slot',definition,dose:dose()});
 assert.equal(result.sessions[0].exercises.at(-1).exerciseKey,'custom:old-exercise');assert.equal(contract.valid({...empty(),proposal:result}),true);
});
test('malformed and future proposals cannot bypass validation or activate restrictions',()=>{
 for(const alter of [p=>p.sessions.pop(),p=>p.sessions[0].day=9,p=>{p.sessions[1].week=p.sessions[0].week;p.sessions[1].day=p.sessions[0].day;},p=>p.sessions[0].exercises[0].restSeconds=-1,p=>p.ruleVersion=999,p=>p.notes=null]){
  const p=proposal();alter(p);assert.equal(domain.valid(p),false);assert.throws(()=>domain.prepare(p));
 }
 const blocked=proposal();blocked.profile.limits=true;assert.throws(()=>domain.activate(empty(),blocked,{uid}),/revisão/);
 const blank=proposal();blank.sessions[0].exercises[0].target='';assert.throws(()=>domain.activate(empty(),blank,{uid}),/objetivos/);
 const p=domain.prepare(proposal()),before=JSON.stringify(p);
 assert.throws(()=>domain.change(p,{type:'dose',day:0,slot:p.sessions[0].exercises[0].proposalSlot,dose:dose({sets:0})}));assert.equal(JSON.stringify(p),before);
});
test('activation saves the edited proposal and baselines without deleting old data; complete backup round-trips',()=>{
 const old=active(),oldState=JSON.stringify(old),p=domain.prepare(proposal());
 const edited=domain.change(p,{type:'dose',day:0,slot:p.sessions[0].exercises[0].proposalSlot,dose:dose({target:'9–11'})});
 const result=domain.activate({...old,proposal:edited},edited,{uid,now:2});
 assert.equal(JSON.stringify(old),oldState);assert.equal(result.document.plans.length,old.plans.length*2);
 const plan=result.document.plans.find(p=>p.id===result.selectedPlanId);assert.equal(plan.exercises[0].target,'9–11');
 assert.equal(plan.exercises[0].rows,undefined);assert.ok(result.document.programVersions.at(-1).planBaselines[plan.id]);
 assert.equal(contract.valid(JSON.parse(JSON.stringify(result.document))),true);
});
test('revision preview shows exact changes, keeps custom/legacy fiches by default and excludes saved or busy sessions',()=>{
 const doc=active(),saved=find(doc,2),busy=find(doc,3),custom=find(doc,5),executing=find(doc,6),p=proposal({minutes:35});
 const d={date:'2026-11-10',note:'',rows:{[saved.exercises[0].id]:[{kg:'10',reps:'8',done:true}]}};
 doc.history.push(records.sessionRecord(saved,d,null,{id:'record',now:2,week:2}));
 doc.drafts[busy.id]={date:'2026-11-10',note:'',rows:{[busy.exercises[0].id]:[{kg:'10',reps:'',done:false}]}};
 custom.exercises[0].target='9';
 doc.plans.push({...copy(executing),id:'pending-execution',sessionOnly:true,executionSourceId:executing.id});doc.drafts['pending-execution']={date:'2026-11-10',note:'',rows:{[executing.exercises[0].id]:[{kg:'',reps:'1',done:false}]}};
 const before=JSON.stringify(doc),preview=domain.revisionPreview(doc,p,{fromWeek:2});assert.equal(JSON.stringify(doc),before);
 for(const plan of [saved,busy,custom,executing])assert.ok(preview.kept.some(k=>k.id===plan.id));
 assert.ok(preview.updates.every(u=>doc.plans.find(p=>p.id===u.id).program.week>=2));assert.ok(preview.updates.some(u=>u.before.exercises[0].sets!==u.after.exercises[0].sets));
 const explicit=domain.revisionPreview(doc,p,{fromWeek:2,policy:'replace'});assert.ok(explicit.updates.some(u=>u.id===custom.id));
 assert.ok(explicit.kept.some(u=>u.id===saved.id));assert.ok(explicit.kept.some(u=>u.id===busy.id));
 const legacy=copy(doc);delete legacy.programVersions[0].planBaselines;
 assert.equal(domain.revisionPreview(legacy,p,{fromWeek:2}).updates.length,0);
});
test('applying a revision changes only reviewed unfinished fiches and keeps immutable history, drafts and prior weeks',()=>{
 const doc=active(),plan=find(doc,3);plan.exercises[0].target='7';
 const first=JSON.stringify(find(doc,1)),custom=JSON.stringify(plan),before=JSON.stringify(doc),p=proposal({minutes:35});
 const result=domain.regenerate(doc,p,{fromWeek:2,policy:'keep'},{uid,now:3});
 assert.equal(JSON.stringify(doc),before);assert.equal(JSON.stringify(find(result.document,1)),first);assert.equal(JSON.stringify(find(result.document,3)),custom);
 assert.deepEqual(result.document.history,doc.history);assert.equal(result.document.plans.length,doc.plans.length);
 assert.equal(result.document.programVersions[0].revisions.length,1);assert.equal(result.document.programVersions[0].revisions[0].createdAt,3);
 assert.equal(contract.valid(JSON.parse(JSON.stringify(result.document))),true);
 const again=domain.revisionPreview(result.document,p,{fromWeek:2,policy:'keep'});assert.equal(again.updates.length,0);assert.ok(again.unchanged.length);
});
test('different programme dimensions require a new programme and invalid revisions never partially mutate data',()=>{
 const doc=active(),before=JSON.stringify(doc);
 assert.throws(()=>domain.regenerate(doc,proposal({days:2}),{fromWeek:1},{uid}),/número de dias/);
 assert.throws(()=>domain.regenerate(doc,proposal(),{fromWeek:99},{uid}),/semana/);
 assert.equal(JSON.stringify(doc),before);
 const invalid=copy(doc);invalid.programVersions[0].planBaselines=[];assert.equal(contract.valid(invalid),false);
});

test('confirmed edits made before activation remain personalizations during later regeneration',()=>{
 const p=domain.prepare(proposal()),edited=domain.change(p,{type:'dose',day:0,slot:p.sessions[0].exercises[0].proposalSlot,dose:dose({target:'9–11'})});
 const doc=domain.activate({...empty(),proposal:edited},edited,{uid}).document;
 const review=domain.revisionPreview(doc,proposal({minutes:35}),{fromWeek:2});
 const futureA=doc.plans.filter(p=>p.program.day===0&&p.program.week>=2);
 assert.ok(futureA.every(p=>review.kept.some(k=>k.id===p.id&&k.personalized)));
 assert.ok(futureA.every(p=>domain.revisionPreview(doc,proposal({minutes:35}),{fromWeek:2,policy:'replace'}).updates.some(k=>k.id===p.id)));
 assert.equal(contract.valid({...empty(),proposal:edited}),true);
});

test('recovering proposal edits after questionnaire changes keeps new answers and exposes incompatible space/material',()=>{
 const old=domain.prepare(proposal()),edited=domain.change(old,{type:'dose',day:1,slot:old.sessions.find(s=>s.day===1).exercises[0].proposalSlot,dose:dose({target:'7–9'})});
 const fresh=proposal({equipment:[],lowCeiling:true}),before=JSON.stringify(fresh),recovered=domain.recoverEdits(edited,fresh);
 assert.equal(JSON.stringify(fresh),before);assert.deepEqual(recovered.profile.equipment,[]);assert.equal(recovered.profile.lowCeiling,true);
 assert.equal(recovered.sessions.find(s=>s.day===1).exercises[0].target,'7–9');
 assert.ok(domain.summary(recovered).issues.some(i=>i.message.includes('não corresponde ao perfil')));
 assert.deepEqual(recovered.sessions.filter(s=>s.day===0).map(s=>s.exercises),domain.prepare(fresh).sessions.filter(s=>s.day===0).map(s=>s.exercises));
 assert.equal(contract.valid({...empty(),proposal:recovered,previousProposal:edited}),true);
 assert.throws(()=>domain.recoverEdits(edited,proposal({days:2})),/diferentes/);
});
test('proposal dose updates whitelist prescription fields and cannot import performed sets',()=>{
 const p=domain.prepare(proposal()),slot=p.sessions[0].exercises[0].proposalSlot;
 const next=domain.change(p,{type:'dose',day:0,slot,dose:dose({rows:[{kg:'99',done:true}],kg:'99'})});
 assert.equal(next.sessions[0].exercises[0].rows,undefined);assert.equal(next.sessions[0].exercises[0].kg,undefined);
 const malformed=proposal();malformed.sessions[0].exercises[0].rows=[];assert.equal(domain.valid(malformed),false);
});

test('legacy proposals remain readable and legacy W raises cannot masquerade as loaded pulling',()=>{
 const legacy=proposal({equipment:[]});legacy.ruleVersion=1;delete legacy.ruleIds;delete legacy.catalogVersion;
 for(const session of legacy.sessions){const e=catalog.instantiate(catalog.exercises.find(e=>e.id==='prone-w'),'prone-w');e.pattern='pull';e.target='8–12';e.restSeconds=60;session.exercises.push(e);}
 assert.equal(domain.valid(legacy),true);assert.equal(contract.valid({...empty(),proposal:legacy}),true);
 assert.ok(domain.summary(legacy).proposal.coverage.missing.includes('pull'));
});
