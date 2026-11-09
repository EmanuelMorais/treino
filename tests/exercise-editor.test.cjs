const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),records=require('../src/domain/workout-records.js'),engine=require('../program-engine.js');
function editor(rows){
 const exercise={id:'exercise',name:'Remada',video:'',sets:2,unit:'reps',target:'8',start:0,note:'',loadReference:'per_dumbbell',exerciseKey:'catalog:db-row'},plan={id:'plan',exercises:[exercise]},draft={rows:{exercise:rows}},controls=new Map();let saved=0;
 const $=id=>{if(!controls.has(id))controls.set(id,{value:'',textContent:'',focus(){}});return controls.get(id)};
 const ctx=vm.createContext({window:{TreinoRecords:records},getPlan:()=>plan,getDraft:()=>draft,$,modal(){},esc:String,parseVideo:raw=>raw?engine.videoId(raw):'',persist(){saved++},closeModal(){},renderPlans(){},toast(){},blankRow:()=>({kg:'',reps:'',done:false})});
 vm.runInContext(fs.readFileSync('src/ui/exercise-editor.js','utf8'),ctx);ctx.exercise=exercise;vm.runInContext('exerciseForm(exercise)',ctx);
 for(const[id,value]of Object.entries({'#e-name':'Remada','#e-video':'','#e-sets':'2','#e-unit':'reps','#e-load-reference':'per_dumbbell','#e-target':'8','#e-start':'0','#e-note':''}))$(id).value=value;
 return {$,exercise,draft,submit(){ $('#exercise-form').onsubmit({preventDefault(){}})},get saved(){return saved}};
}
test('actual editor handler reports unit changes visibly without mutating a filled draft',()=>{
 const rows=[{kg:'10',reps:'8',done:true}],s=editor(rows);s.$('#e-unit').value='s';s.submit();
 assert.match(s.$('#exercise-error').textContent,/séries preenchidas/);assert.equal(s.saved,0);assert.equal(s.exercise.unit,'reps');assert.equal(rows[0].reps,'8');
});
test('adding a personal demo leaves extra session sets and the planned dose unchanged',()=>{
 const rows=Array.from({length:3},()=>({kg:'10',reps:'8',done:true})),s=editor(rows);s.$('#e-video').value='https://youtu.be/ACyCx_s15ME';s.submit();
 assert.equal(s.saved,1);assert.equal(s.exercise.video,'ACyCx_s15ME');assert.equal(s.exercise.sets,2);assert.equal(s.draft.rows.exercise.length,3);assert.equal(s.draft.rows.exercise[2].done,true);
});
test('choosing a personal video replaces an old linked example without deleting the example itself',()=>{
 const s=editor([]);s.exercise.exampleIds=['old-example'];s.exercise.primaryExample='old-example';s.exercise.videoLabel='Old example';
 s.$('#e-video').value='https://youtu.be/ACyCx_s15ME';s.submit();
 assert.equal(s.saved,1);assert.equal(s.exercise.primaryExample,undefined);assert.equal(s.exercise.videoLabel,undefined);assert.equal(s.exercise.exampleIds.length,0);
});
test('editor rejects invalid dose and unsafe video URLs with an actionable message',()=>{
 const s=editor([]);s.$('#e-video').value='javascript:alert(1)';s.submit();assert.match(s.$('#exercise-error').textContent,/URL válido/);assert.equal(s.saved,0);
 s.$('#e-video').value='';s.$('#e-sets').value='0';s.submit();assert.match(s.$('#exercise-error').textContent,/Revê/);assert.equal(s.saved,0);
});
