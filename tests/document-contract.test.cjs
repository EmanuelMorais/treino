const {test}=require('node:test'),assert=require('node:assert/strict'),contract=require('../src/domain/document-contract.js'),catalog=require('../src/domain/exercise-catalog.js'),records=require('../src/domain/workout-records.js'),commands=require('../src/domain/exercise-replacement.js');
function fixture(){
 const exercise=catalog.instantiate(catalog.exercises.find(e=>e.id==='db-row'),'exercise'),plan={id:'plan',name:'Test',note:'',exercises:[exercise]};
 const draft={date:'2026-11-10',note:'',rows:{exercise:[{kg:'10',reps:'8',done:true},{kg:'12',reps:'',done:false}]}};
 const record=records.sessionRecord(plan,draft,null,{id:'history',now:1,week:1});
 return {version:1,plans:[plan],history:[record],drafts:{plan:draft},favorites:[]};
}
test('legacy documents and snapshots with unfinished values satisfy the actual application contract',()=>{
 assert.equal(contract.valid({version:1,plans:[],history:[],drafts:{},favorites:[]}),true);
 const doc=fixture();assert.equal(contract.valid(doc),true);assert.equal(contract.valid(JSON.parse(JSON.stringify(doc))),true);
 const result=commands.replace(doc,{planId:'plan',exerciseId:'exercise',scope:'future_day',includeCurrent:false,definition:catalog.exercises.find(e=>e.id==='db-bent-row'),date:'2026-11-10',uid:(()=>{let i=0;return()=> 'id-'+(++i)})()});
 assert.equal(contract.valid(result.document),true);
});
test('invalid histories and snapshots return false without throwing or partially accepting entered values',()=>{
 for(const change of [doc=>doc.history=[null],doc=>doc.history[0].planSnapshot=null,doc=>doc.history[0].planSnapshot.pending=[null],doc=>doc.history[0].planSnapshot.pending[0].done=true,doc=>doc.history[0].planSnapshot.pending[0].setIndex=0,doc=>doc.history[0].planSnapshot.exercises[0].unit='unknown',doc=>doc.history[0].planSnapshot.exercises=[],doc=>doc.history[0].planSnapshot.exercises[0].name='Outro movimento',doc=>doc.history[0].exercises[0].exerciseKey='catalog:another',doc=>doc.minClientBuild=12]){
  const doc=fixture();change(doc);assert.doesNotThrow(()=>contract.valid(doc));assert.equal(contract.valid(doc),false);
 }
});
test('historical identity comes from the stored prescription when the current plan has already changed',()=>{
 const doc=fixture();delete doc.history[0].exercises[0].exerciseKey;doc.plans[0].exercises[0].id='new-variant';
 const next=records.upgrade(doc);assert.equal(next.history[0].exercises[0].exerciseKey,'catalog:db-row');assert.equal(contract.valid(next),true);
});
test('cycles and unsafe keys are rejected while shared immutable references remain valid',()=>{
 const doc=fixture();doc.extra=doc;assert.equal(contract.valid(doc),false);
 const parsed=JSON.parse('{"version":1,"plans":[],"history":[],"drafts":{},"favorites":[],"__proto__":{}}');assert.equal(contract.valid(parsed),false);
 const shared=fixture();shared.extra=shared.plans[0];assert.equal(contract.valid(shared),true);
});
