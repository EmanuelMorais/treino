const {test}=require('node:test'),assert=require('node:assert/strict'),commands=require('../src/domain/exercise-replacement.js'),catalog=require('../src/domain/exercise-catalog.js');
const definition=catalog.exercises.find(e=>e.id==='db-bent-row');
function setup(filled=false){
 const e=catalog.instantiate(catalog.exercises.find(e=>e.id==='db-row'),'old');e.sets=3;e.target='8–12';
 const plan={id:'week1',name:'Semana 1',note:'',program:{id:'program',day:0,week:1},exercises:[e]};
 const document={version:1,plans:[plan,{...structuredClone(plan),id:'week2',name:'Semana 2',program:{id:'program',day:0,week:2}},{...structuredClone(plan),id:'other-day',name:'Outro dia',program:{id:'program',day:1,week:2}}],history:[],drafts:{week1:{date:'2026-11-09',note:'',rows:{old:[{kg:filled?'10':'',reps:filled?'8':'',done:filled},{kg:'',reps:'',done:false},{kg:'',reps:'',done:false}]}}},favorites:[]};
 let n=0;const options={planId:'week1',exerciseId:'old',scope:'today',definition,date:'2026-11-09',uid:()=> 'new-'+(++n)};
 return {document,options};
}
test('today-only replacement forks execution and leaves the source and future prescriptions untouched',()=>{
 const {document,options}=setup(),before=JSON.stringify(document);const result=commands.replace(document,options);
 assert.equal(JSON.stringify(document),before);assert.equal(result.document.plans.length,4);
 assert.equal(result.document.plans[0].exercises[0].libraryId,'db-row');
 const execution=result.document.plans.find(p=>p.id===result.selectedPlanId);
 assert.equal(execution.sessionOnly,true);assert.equal(execution.executionSourceId,'week1');assert.equal(execution.exercises[0].libraryId,'db-bent-row');
 assert.equal(result.document.drafts.week1,undefined);
});
test('mid-session replacement preserves every entered set under the old movement and creates blank remaining work',()=>{
 const {document,options}=setup(true),result=commands.replace(document,options),plan=result.document.plans.find(p=>p.sessionOnly),draft=result.document.drafts[plan.id];
 assert.equal(plan.exercises.length,2);assert.equal(plan.exercises[0].libraryId,'db-row');assert.equal(plan.exercises[0].beforeReplacement,true);
 assert.deepEqual(draft.rows.old,[{kg:'10',reps:'8',done:true}]);assert.equal(plan.exercises[1].sets,2);
 assert.ok(draft.rows[plan.exercises[1].id].every(r=>r.kg===''&&r.reps===''&&!r.done));
});
test('same-day future scope changes only eligible weeks and preserves history, other days and busy drafts',()=>{
 const {document,options}=setup(true);document.history.push({id:'saved',planId:'other-day',exercises:[]});
 const result=commands.replace(document,{...options,scope:'future_day'});
 assert.equal(result.affected.length,2);assert.equal(result.document.plans.find(p=>p.id==='week2').exercises[0].libraryId,'db-bent-row');
 assert.equal(result.document.plans.find(p=>p.id==='other-day').exercises[0].libraryId,'db-row');assert.deepEqual(result.document.history,document.history);
 const busy=setup();busy.document.drafts.week2=structuredClone(busy.document.drafts.week1);busy.document.drafts.week2.rows.old[0].kg='15';
 const skipped=commands.replace(busy.document,{...busy.options,scope:'future_day'});assert.ok(skipped.skipped.includes('week2'));assert.equal(skipped.document.plans.find(p=>p.id==='week2').exercises[0].libraryId,'db-row');
});
test('future-only edits keep the current session intact, including when all sets already have values',()=>{
 const {document,options}=setup(true);document.drafts.week1.rows.old.forEach(r=>Object.assign(r,{kg:'10',reps:'8',done:true}));
 const result=commands.replace(document,{...options,scope:'future_day',includeCurrent:false});
 assert.equal(result.document.plans.find(p=>p.sessionOnly).exercises[0].libraryId,'db-row');
 assert.equal(result.document.plans.find(p=>p.id==='week1').exercises[0].libraryId,'db-bent-row');
 assert.throws(()=>commands.replace(document,options),/Todas as séries/);
});
test('invalid scopes, duplicate open executions and incompatible historical edits never mutate the source',()=>{
 const {document,options}=setup(),before=JSON.stringify(document);
 assert.throws(()=>commands.replace(document,{...options,scope:'invalid'}));assert.equal(JSON.stringify(document),before);
 const result=commands.replace(document,options);assert.throws(()=>commands.replace(result.document,options),/sessão ajustada/);
 document.drafts.week1.editHistoryId='old-record';assert.throws(()=>commands.replace(document,options),/correção do registo/);
});
test('suggestions preserve function and equipment rather than equating flyes and presses',()=>{
 const original=catalog.exercises.find(e=>e.id==='bench-press'),suggestions=commands.suggestions(original,['dumbbells','bench']);
 assert.ok(suggestions.length);assert.ok(suggestions.every(e=>e.pattern==='push'&&e.direction==='horizontal'));
 assert.ok(!suggestions.some(e=>['db-fly','pec-deck','standing-db-press'].includes(e.id)));
});
test('legacy courses require family, slot and variant/unit agreement to link future weeks',()=>{
 const {document,options}=setup();document.plans=document.plans.slice(0,2);
 for(const [i,p]of document.plans.entries()){
  p.id='club-w0'+(i+1)+'-A';delete p.program;p.course={version:2,week:i+1,session:'A',phase:1};
  p.exercises[0].exerciseKey='legacy:'+p.id+':old';
 }
 document.drafts[document.plans[0].id]=document.drafts.week1;delete document.drafts.week1;
 const result=commands.replace(document,{...options,planId:document.plans[0].id,scope:'future_day',dosePolicy:'preserve'});
 assert.equal(result.affected.length,2);assert.ok(result.document.plans.filter(p=>!p.sessionOnly).every(p=>p.exercises[0].libraryId==='db-bent-row'));
 document.plans[1].exercises[0].name='Outra variante';assert.equal(commands.preview(document,{...options,planId:document.plans[0].id,scope:'future_day'}).affected.length,1);
});
test('explicit dose policy preserves week-specific goals or uses the new target, never carries percentages or changes units silently',()=>{
 const {document,options}=setup();document.plans[1].exercises[0].target='6–8';
 const kept=commands.replace(document,{...options,scope:'future_day',dosePolicy:'preserve'});
 assert.equal(kept.document.plans[0].exercises[0].target,'8–12');assert.equal(kept.document.plans[1].exercises[0].target,'6–8');
 const changed=commands.replace(document,{...options,scope:'future_day',dosePolicy:'custom',target:'10–12'});
 assert.equal(changed.document.plans[1].exercises[0].target,'10–12');
 document.plans[0].exercises[0].target='70% 1RM';assert.throws(()=>commands.replace(document,{...options,dosePolicy:'preserve'}),/percentagens/);
 assert.throws(()=>commands.replace(document,{...options,dosePolicy:'custom',target:''}),/Define o objetivo/);
 const seconds=catalog.exercises.find(e=>e.id==='plank');assert.throws(()=>commands.replace(document,{...options,definition:seconds,dosePolicy:'preserve'}),/medida/);
});
