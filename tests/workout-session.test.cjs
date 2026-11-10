const {test}=require('node:test'),assert=require('node:assert/strict'),sessions=require('../src/domain/workout-session.js'),catalog=require('../src/domain/exercise-catalog.js'),contract=require('../src/domain/document-contract.js'),records=require('../src/domain/workout-records.js');
const uid=(()=>{let i=0;return()=> 'fixture-'+(++i)})();
function fixture(){return {version:1,plans:[{id:'original',name:'Fixture',note:'',exercises:['db-rdl','db-row'].map(id=>({...catalog.instantiate(catalog.exercises.find(e=>e.id===id),id),target:'8–12'}))}],history:[],drafts:{},favorites:[]};}
const options={planId:'original',uid,date:'2026-11-10'};
test('starting isolates execution from future prescriptions and resuming does not create duplicates',()=>{
 const doc=fixture(),before=JSON.stringify(doc),started=sessions.start(doc,options),p=started.document.plans.find(p=>p.id===started.selectedPlanId);
 assert.equal(JSON.stringify(doc),before);assert.equal(p.sessionOnly,true);assert.equal(p.executionSourceId,'original');assert.equal(contract.valid(started.document),true);
 p.exercises[0].sets=4;started.document.drafts[p.id].rows['db-rdl'][0]={kg:'10',reps:'8',done:true};
 assert.equal(started.document.plans[0].exercises[0].sets,2);
 const resumed=sessions.start(started.document,options);assert.equal(resumed.selectedPlanId,p.id);assert.equal(resumed.document.plans.length,2);
});
test('editing an old source draft first preserves all entered values in an execution copy',()=>{
 const doc=fixture();doc.drafts.original={date:'2026-11-10',note:'Pending',rows:{'db-rdl':[{kg:'10',reps:'',done:false}]}};
 const before=JSON.stringify(doc),prepared=sessions.prepareEditor(doc,options);
 assert.equal(JSON.stringify(doc),before);assert.equal(prepared.selectedPlanId,'original');assert.equal(prepared.document.drafts.original,undefined);
 const pending=prepared.document.plans.find(p=>p.sessionOnly);assert.equal(prepared.document.drafts[pending.id].rows['db-rdl'][0].kg,'10');assert.equal(contract.valid(prepared.document),true);
});
test('reordering future fiches leaves execution order, entered values and saved snapshots intact',()=>{
 const started=sessions.start(fixture(),options),plan=started.document.plans.find(p=>p.sessionOnly),draft=started.document.drafts[plan.id];
 draft.rows['db-rdl'][0]={kg:'10',reps:'8',done:true};started.document.history.push(records.sessionRecord(plan,draft,null,{id:'record',now:1,week:1}));
 const before=JSON.stringify({plan,draft,history:started.document.history});const result=sessions.reorder(started.document,{planId:'original',exerciseId:'db-rdl',offset:1});
 assert.equal(result.document.plans[0].exercises[1].id,'db-rdl');assert.equal(JSON.stringify({plan:result.document.plans.find(p=>p.id===plan.id),draft:result.document.drafts[plan.id],history:result.document.history}),before);
});
test('conflicting source drafts and capacity errors never discard existing work',()=>{
 const started=sessions.start(fixture(),options);started.document.drafts.original={date:'2026-11-10',note:'another pending session',rows:{}};
 const before=JSON.stringify(started.document);assert.throws(()=>sessions.start(started.document,options),/duas sessões/);assert.equal(JSON.stringify(started.document),before);
 const full=fixture();for(let i=1;i<256;i++)full.plans.push({...full.plans[0],id:'plan-'+i});assert.throws(()=>sessions.start(full,options),/Limite/);
});

test('a reusable mobility fiche keeps the programme week captured when execution starts',()=>{
 const doc=fixture();doc.plans[0].course={version:1,week:1,phase:0,session:'M'};
 const result=sessions.start(doc,{...options,week:4}),plan=result.document.plans.find(p=>p.sessionOnly),draft=result.document.drafts[plan.id];
 assert.equal(draft.courseWeek,4);draft.rows['db-rdl'][0]={kg:'10',reps:'8',done:true};
 const saved=records.sessionRecord(plan,draft,null,{id:'record',now:1,week:draft.courseWeek});assert.equal(saved.course.week,4);assert.equal(contract.valid({...result.document,history:[saved]}),true);
});
