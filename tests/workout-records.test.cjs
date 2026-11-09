const {test}=require('node:test'),assert=require('node:assert/strict'),records=require('../src/domain/workout-records.js');
const exercise=(extra={})=>({id:'occurrence-1',libraryId:'db-row',name:'Remada',unit:'reps',sets:2,note:'Regista kg por haltere.',...extra});
const row={kg:'10',reps:'8',done:true};
const document=()=>({version:1,plans:[{id:'plan-1',exercises:[exercise()]}],history:[{id:'session-1',planId:'plan-1',date:'2026-11-09',savedAt:10,exercises:[{id:'occurrence-1',name:'Remada',unit:'reps',loadUnit:'Regista kg por haltere.',rows:[{...row}]}]}]});

test('additive identity upgrade preserves old prescriptions, performed values and the source document',()=>{
 const old=document(),before=JSON.stringify(old),next=records.upgrade(old);
 assert.equal(JSON.stringify(old),before);assert.equal(next.version,1);
 assert.equal(next.plans[0].exercises[0].exerciseKey,'catalog:db-row');
 assert.equal(next.history[0].exercises[0].exerciseKey,'catalog:db-row');
 assert.deepEqual(next.history[0].exercises[0].rows,[row]);
 assert.deepEqual(records.upgrade(next),next);
 assert.deepEqual(JSON.parse(JSON.stringify(next)),next);
});
test('new occurrences and display names share compatible history, including the same day',()=>{
 const next=records.upgrade(document()),e={...next.plans[0].exercises[0],id:'new-week',name:'Outro nome de apresentação'};
 assert.deepEqual(records.previous(next.history,e,'2026-11-09').rows,[row]);
 assert.equal(records.previous(next.history,e,'2026-11-09','session-1'),null);
 assert.equal(records.previous(next.history,e,'2026-11-08'),null);
});
test('incompatible units, load references and variants never inherit performed weights',()=>{
 const next=records.upgrade(document()),e=next.plans[0].exercises[0];
 for(const change of [{unit:'s'},{loadReference:'barbell_total'},{exerciseKey:'catalog:machine-row'}])assert.equal(records.previous(next.history,{...e,...change},'2026-11-09'),null);
});
test('ambiguous old records are not joined by matching names or guessed across changed variants',()=>{
 const old=document();old.history[0].exercises[0].id='unrelated';const next=records.upgrade(old);
 assert.notEqual(next.history[0].exercises[0].exerciseKey,next.plans[0].exercises[0].exerciseKey);
 assert.equal(records.previous(next.history,next.plans[0].exercises[0],'2026-11-09'),null);
 const adapted=exercise({adapted:true});assert.notEqual(records.exerciseKey(adapted,'plan'), 'catalog:db-row');
});
test('filled and completed rows cannot be relabelled, converted or truncated by editing',()=>{
 const before=exercise({loadReference:'per_dumbbell'});
 for(const after of [{...before,unit:'s'},{...before,name:'Outro movimento'},{...before,loadReference:'barbell_total'}])assert.ok(records.editIssue(before,after,[row]));
 assert.ok(records.editIssue(before,{...before,sets:1},[{kg:'',reps:'',done:false},row]));
 assert.equal(records.editIssue(before,{...before,sets:3,note:'Nota pessoal'},[row]),'');
 assert.equal(records.editIssue(before,{...before,unit:'s'},[{kg:'',reps:'',done:false}]),'');
});
test('snapshots preserve structured identity and load reference after later plan edits',()=>{
 const e=records.upgrade(document()).plans[0].exercises[0],rows=[{...row},{kg:'',reps:'',done:false}];
 const saved=records.snapshot(e,rows);e.name='Renamed';e.unit='s';rows[0].kg='100';
 assert.equal(saved.name,'Remada');assert.equal(saved.unit,'reps');assert.equal(saved.loadReference,'per_dumbbell');assert.equal(saved.rows[0].kg,'10');assert.equal(saved.rows[0].setIndex,0);
});
test('optional additive metadata rejects malformed imports without rejecting legacy documents',()=>{
 assert.equal(records.validMetadata(document()),true);
 for(const change of [{exerciseKey:{}},{loadReference:'mystery'},{libraryId:'../../private'}]){
  const doc=document();Object.assign(doc.plans[0].exercises[0],change);assert.equal(records.validMetadata(doc),false);
 }
});
test('free text never invents a load reference or joins records after an ambiguous reference change',()=>{
 assert.equal(records.loadReference({note:'Não usar kg por haltere nesta variante.'}),'unspecified');
 assert.equal(records.loadReference({note:'Regista kg totais, incluindo a barra.'}),'barbell_total');
 assert.equal(records.compatible({id:'x',name:'X',unit:'reps',note:'unidade por confirmar'},{id:'x',name:'X',unit:'reps',loadUnit:'outra referência'}),false);
});
