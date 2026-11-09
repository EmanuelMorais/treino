const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('app.js','utf8'),sharing=source.slice(source.indexOf('function exportCurrentPlan(){'));
test('single-plan export excludes session records and course tracking',async()=>{
 let captured;
 const plan={id:'original-plan',name:'A plan',note:'Instructions',prepared:true,course:{week:1},exercises:[{id:'ex',name:'Row',sets:2,target:'10',unit:'reps',start:0,video:'',note:''}]};
 const context=vm.createContext({getPlan:()=>plan,Blob,URL:{createObjectURL:blob=>{captured=blob;return 'blob:test'},revokeObjectURL(){}},document:{createElement:()=>({click(){}})},today:()=> '2026-11-09',setTimeout:()=>0,toast(){}});
 vm.runInContext(sharing+'\nexportCurrentPlan()',context);
 const result=JSON.parse(await captured.text());assert.equal(result.format,'treino-plan');assert.equal(result.plan.course,undefined);assert.equal(result.history,undefined);assert.equal(result.drafts,undefined);assert.equal(result.plan.exercises.length,1);
});
test('importing one plan adds a copy and preserves existing records',()=>{
 const state={plans:[{id:'existing'}],history:[{id:'saved-session'}]};let callback;
 const context=vm.createContext({state,validState:()=>true,uid:(()=>{let n=0;return()=> 'new-'+(++n)})(),modal(){},esc:x=>x,$:()=>({set onclick(fn){callback=fn}}),persist(){},closeModal(){},setView(){},toast(){},selectedPlan:''});
 vm.runInContext(sharing+`\nimportSinglePlan({id:'source',name:'Shared',course:{week:1},exercises:[{id:'old',name:'Exercise'}]})`,context);callback();
 assert.equal(state.plans.length,2);assert.equal(state.history[0].id,'saved-session');assert.notEqual(state.plans[1].id,'source');assert.equal(state.plans[1].course,undefined);assert.notEqual(state.plans[1].exercises[0].id,'old');
});
