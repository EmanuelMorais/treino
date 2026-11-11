const test=require('node:test'),assert=require('node:assert/strict');
const watch=require('../src/domain/watch-import.js'),contract=require('../src/domain/document-contract.js'),records=require('../src/domain/workout-records.js');
const now=Date.parse('2026-11-11T20:00:00Z');
const exercise={id:'e1',name:'Remada',video:'',sets:1,target:'8',unit:'reps',start:0,note:''};
const doc=()=>({version:1,favorites:[],plans:[{id:'p1',name:'Tronco 1',note:'',exercises:[exercise]},{id:'run-1',name:'Pernas 1',note:'',sessionOnly:true,executionSourceId:'p1',exercises:[exercise]}],
 drafts:{'run-1':{date:'2026-11-11',note:'',rows:{e1:[{kg:'',reps:'',done:false}]}}},
 history:[{id:'h1',planId:'p1',planName:'Tronco 1',date:'2026-11-11',note:'',savedAt:Date.parse('2026-11-11T19:45:00Z'),exercises:[{id:'e1',name:'Remada',unit:'reps',rows:[{kg:'20',reps:'10',done:true}]}]},
  {id:'h0',planId:'p1',planName:'Tronco 1',date:'2026-11-10',note:'',savedAt:1,exercises:[{id:'e1',name:'Remada',unit:'reps',rows:[{kg:'20',reps:'10',done:true}]}]}]});

test('a Shortcut URL is parsed into minutes, calories and heart rate; time formats from iOS are accepted',()=>{
 const parsed=watch.parse('#watch?start=2026-11-11T19:02:00%2B00:00&end=2026-11-11T19:44:30%2B00:00&kcal=312,6&hr=128',now);
 assert.equal(parsed.watch.minutes,43);assert.equal(parsed.watch.kcal,313);assert.equal(parsed.watch.hr,128);assert.equal(parsed.date,'2026-11-11');
 assert.equal(watch.parse('#watch?start=2026-11-11 19:02:00 +0000&end=2026-11-11 19:32:00 +0000',now).watch.minutes,30);
 assert.equal(watch.parse('#watch?start=2026-11-11T19:02:00Z&end=2026-11-11T19:32:00Z&kcal=',now).watch.kcal,undefined);
});
test('missing, reversed, stale, future or absurd values are refused with a message',()=>{
 for(const hash of ['#watch?start=ontem&end=hoje','#watch?start=2026-11-11T19:30:00Z&end=2026-11-11T19:00:00Z','#watch?start=2026-11-01T19:00:00Z&end=2026-11-01T19:30:00Z','#watch?start=2026-11-12T19:00:00Z&end=2026-11-12T19:30:00Z','#watch?start=2026-11-11T19:00:00Z&end=2026-11-11T19:30:00Z&hr=900','#watch?start=2026-11-11T19:00:00Z&end=2026-11-11T19:00:20Z'])
  assert.ok(watch.parse(hash,now).error,hash);
 assert.equal(watch.parse('#access_token=abc',now),null);
});
test('a session in progress is offered first, then saved sessions of the same day closest to the end time',()=>{
 const parsed=watch.parse('#watch?start=2026-11-11T19:00:00Z&end=2026-11-11T19:40:00Z',now);
 assert.deepEqual(watch.candidates(doc(),parsed).map(c=>c.kind+':'+c.id),['draft:run-1','history:h1']);
});
test('applying stores the summary and replaces the duration without touching sets; the result stays valid',()=>{
 const parsed=watch.parse('#watch?start=2026-11-11T19:00:00Z&end=2026-11-11T19:40:00Z&kcal=280',now),before=doc();
 const saved=watch.apply(before,{kind:'history',id:'h1'},parsed.watch);
 assert.equal(saved.history[0].duration,'40');assert.equal(saved.history[0].watch.kcal,280);assert.deepEqual(saved.history[0].exercises,before.history[0].exercises);
 assert.equal(before.history[0].watch,undefined,'the original document is not mutated');assert.equal(contract.valid(saved),true);
 const running=watch.apply(before,{kind:'draft',id:'run-1'},parsed.watch);assert.equal(running.drafts['run-1'].duration,'40');assert.equal(contract.valid(running),true);
 assert.throws(()=>watch.apply(before,{kind:'history',id:'gone'},parsed.watch),/já não existe/);
});
test('the summary on a session in progress is kept when the session is saved',()=>{
 const parsed=watch.parse('#watch?start=2026-11-11T19:00:00Z&end=2026-11-11T19:40:00Z',now),d=watch.apply(doc(),{kind:'draft',id:'run-1'},parsed.watch);
 const draft=d.drafts['run-1'];draft.rows.e1[0]={kg:'20',reps:'10',done:true};
 const record=records.sessionRecord(d.plans[1],draft,null,{id:'h2',now:5,week:1});
 assert.deepEqual(record.watch,parsed.watch);assert.equal(record.duration,'40');
});
test('malformed stored summaries make the document invalid',()=>{
 for(const value of [null,{start:'x',end:'y',minutes:10},{start:'2026-11-11T19:00:00Z',end:'2026-11-11T19:40:00Z',minutes:0},{start:'2026-11-11T19:00:00Z',end:'2026-11-11T19:40:00Z',minutes:40,extra:1},{start:'2026-11-11T19:00:00Z',end:'2026-11-11T19:40:00Z',minutes:40,kcal:-1}]){
  const d=doc();d.history[0].watch=value;assert.equal(contract.valid(d),false,JSON.stringify(value));
 }
});
