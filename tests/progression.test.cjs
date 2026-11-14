const test=require('node:test');const assert=require('node:assert/strict');
const prog=require('../src/domain/progression.js');

const KEY='catalog:bench-press';
const exercise={id:'e1',name:'Supino com halteres',libraryId:'bench-press',exerciseKey:KEY,sets:3,target:'8–10',unit:'reps',loadReference:'per_dumbbell'};
const session=(date,rows)=>({id:'h-'+date,planId:'p',planName:'A',date,savedAt:Date.parse(date),complete:true,note:'',
 exercises:[{id:'r',name:'Supino com halteres',libraryId:'bench-press',exerciseKey:KEY,unit:'reps',loadReference:'per_dumbbell',rows}]});
const row=(kg,reps)=>({kg:String(kg),reps:String(reps),done:true});

test('a clean session at the top of the range raises the load by one plate step',()=>{
 const s=prog.suggest([session('2026-11-10',[row(16,10),row(16,10),row(16,10)])],exercise);
 assert.equal(s.kind,'up');assert.equal(s.from,16);assert.equal(s.kg,18,'two kilos per dumbbell');
 assert.equal(prog.suggestionLabel(s),'Sugestão: 18 kg');
 // A barbell exercise never reads dumbbell history: the kilos mean different things.
 const barbell={...exercise,id:'e9',libraryId:'bar-bench',exerciseKey:'catalog:bar-bench',loadReference:'barbell_total'};
 assert.equal(prog.suggest([session('2026-11-10',[row(40,10),row(40,10),row(40,10)])],barbell),null);
 const barSession={id:'h-bar',planId:'p',planName:'A',date:'2026-11-10',savedAt:1,complete:true,note:'',
  exercises:[{id:'r',name:'Supino com barra',libraryId:'bar-bench',exerciseKey:'catalog:bar-bench',unit:'reps',loadReference:'barbell_total',rows:[row(40,10),row(40,10),row(40,10)]}]};
 assert.equal(prog.suggest([barSession],barbell).kg,44,'four kilos on the bar');
});
test('an unfinished or short session does not raise the load',()=>{
 const short=prog.suggest([session('2026-11-10',[row(16,10),row(16,10)])],exercise);
 assert.equal(short.kind,'hold','two of three sets is not a clean session');
 const low=prog.suggest([session('2026-11-10',[row(16,10),row(16,10),row(16,7)])],exercise);
 assert.equal(low.kind,'down');assert.match(low.reason,/abaixo de 8/);
 const middle=prog.suggest([session('2026-11-10',[row(16,9),row(16,9),row(16,9)])],exercise);
 assert.equal(middle.kind,'hold');assert.match(middle.reason,/até 10/);
});
test('bodyweight exercises ask for repetitions instead of load',()=>{
 const pushup={id:'e2',name:'Flexões',libraryId:'pushup',exerciseKey:'catalog:pushup',sets:2,target:'10–12',unit:'reps',loadReference:'bodyweight'};
 const s=prog.suggest([{id:'h',planId:'p',planName:'A',date:'2026-11-10',savedAt:1,complete:true,note:'',
  exercises:[{id:'r',name:'Flexões',libraryId:'pushup',exerciseKey:'catalog:pushup',unit:'reps',loadReference:'bodyweight',rows:[row(0,12),row(0,12)]}]}],pushup);
 assert.equal(s.kind,'reps');assert.equal(s.reps,14);
});
test('with no history there is nothing to suggest',()=>{
 assert.equal(prog.suggest([],exercise),null);
 assert.equal(prog.suggestionLabel(null),'');
});
test('records keep the heaviest set and the best session volume',()=>{
 const history=[session('2026-11-01',[row(14,12),row(14,10)]),session('2026-11-08',[row(18,6)]),session('2026-11-10',[row(16,10),row(16,10),row(16,10)])];
 const b=prog.best(history,exercise);
 assert.deepEqual(b.heaviest,{kg:18,reps:6,date:'2026-11-08'});
 assert.deepEqual(b.volume,{total:480,date:'2026-11-10'},'3 × 16 × 10 beats the others');
 const points=prog.series(history,exercise);
 assert.deepEqual(points.map(p=>[p.date,p.kg]),[['2026-11-01',14],['2026-11-08',18],['2026-11-10',16]]);
});
test('the rep range is read from the exercise target',()=>{
 assert.deepEqual(prog.range('8–10'),{low:8,high:10});
 assert.deepEqual(prog.range('30'),{low:30,high:30});
 assert.equal(prog.range('até à falha'),null);
});

const contract=require('../src/domain/document-contract.js');
const base=()=>({version:1,plans:[],history:[],drafts:{},favorites:[]});
test('the document accepts exercise notes and the chosen record, within limits',()=>{
 assert.equal(contract.valid({...base(),exerciseNotes:{'catalog:bench-press':'pega neutra'}}),true);
 assert.equal(contract.valid({...base(),exerciseNotes:{'catalog:x':''}}),false,'an empty note is removed, not stored');
 assert.equal(contract.valid({...base(),exerciseNotes:{'catalog:x':'a'.repeat(301)}}),false);
 assert.equal(contract.valid({...base(),exerciseNotes:[]}),false);
 assert.equal(contract.valid({...base(),recordExercise:'catalog:bench-press'}),true);
 assert.equal(contract.valid({...base(),recordExercise:7}),false);
});

const sessions=require('../src/domain/workout-session.js');
test('a short session keeps the first exercises and leaves the sheet alone',()=>{
 const plan={id:'p1',name:'A',note:'',exercises:[1,2,3,4,5].map(n=>({id:'e'+n,name:'Ex '+n,sets:3,target:'8–10',unit:'reps'}))};
 const doc={...base(),plans:[plan]};
 const out=sessions.start(doc,{planId:'p1',uid:()=>'s1',date:'2026-11-14',now:1000,limit:3});
 const session=out.document.plans.find(p=>p.id==='s1');
 assert.equal(session.exercises.length,3);
 assert.deepEqual(session.exercises.map(e=>e.id),['e1','e2','e3']);
 assert.match(session.name,/curto$/);
 assert.equal(out.document.plans.find(p=>p.id==='p1').exercises.length,5,'the sheet is untouched');
 assert.deepEqual(Object.keys(out.document.drafts.s1.rows),['e1','e2','e3'],'only the kept exercises get rows');
 const full=sessions.start({...base(),plans:[plan]},{planId:'p1',uid:()=>'s2',date:'2026-11-14',now:1000});
 assert.equal(full.document.plans.find(p=>p.id==='s2').exercises.length,5,'without a limit nothing is trimmed');
});
