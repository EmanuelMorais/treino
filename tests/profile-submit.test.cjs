const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),engine=require('../program-engine.js');
function questionnaire(extra={},options={}){
 const fields={...engine.defaults(),name:'Example',adult:true,consent:true,goals:['weight_loss'],primaryGoal:'weight_loss',...extra},state={profile:{answers:JSON.parse(JSON.stringify(fields))},plans:[],history:[],drafts:{},favorites:[],...(options.initialProposal?{proposal:options.initialProposal}:{})};
 const goals=Object.keys(engine.GOALS).map(value=>({value,checked:fields.goals.includes(value)})),priority={value:fields.primaryGoal},elements=options.invalid?[options.invalid]:[];
 elements.namedItem=name=>name==='primaryGoal'?priority:null;
 const form={elements,querySelectorAll:()=>goals},controls=new Map([['#profile-form',form]]),modals=[];let saved=0;
 const $=selector=>{if(!controls.has(selector))controls.set(selector,{hidden:true,textContent:'',innerHTML:'',focus(){this.focused=true},scrollIntoView(){this.scrolled=true}});return controls.get(selector)};
 class Data{get(name){if(name==='primaryGoal')return priority.value;return fields[name]??null}has(name){return fields[name]===true}getAll(name){return name==='goals'?goals.filter(g=>g.checked).map(g=>g.value):fields[name]||[]}}
 const programs=options.throwGenerate?{...engine,generate(){throw Error('fixture failure')}}:engine;
 const context=vm.createContext({window:{TreinoPrograms:programs,TreinoProposal:require('../src/domain/programme-proposal.js')},setupProfileSteps:()=>({reveal(){}}),activeStorageKey:'test-account',document:{querySelectorAll:()=>[]},accountAccess:true,state,$,FormData:Data,heading:()=>'',esc:x=>String(x),persist(){saved++;return options.canPersist!==false},modal:(title,body)=>modals.push({title,body}),setView(){},newPlanForm(){},closeModal(){},uid:()=> 'test-id',toast(){}});
 vm.runInContext(fs.readFileSync('profile-ui.js','utf8'),context);vm.runInContext(fs.readFileSync('src/ui/programme-proposal.js','utf8'),context);vm.runInContext('renderProfile()',context);
 return {state,fields,form,$,goals,priority,modals,submit(){form.onsubmit({preventDefault(){}})},get saved(){return saved}};
}
test('a valid questionnaire button opens the programme preview',()=>{
 const s=questionnaire();s.submit();assert.equal(s.modals[0].title,'Rever o teu programa');assert.equal(s.state.proposal.sessions.length,36);assert.equal(s.$('#profile-feedback').hidden,true);
});
test('a saved priority outside selected goals is aligned before submission',()=>{
 const s=questionnaire({goals:['weight_loss','mobility'],primaryGoal:'strength'});s.submit();assert.equal(s.modals[0].title,'Rever o teu programa');assert.deepEqual(Array.from(s.state.profile.answers.goals),['weight_loss','strength','mobility']);
});
test('declared restrictions produce an explicit focused review message and preserve the answers',()=>{
 const s=questionnaire({limits:true,avoided:'Exercise to avoid'});s.submit();const feedback=s.$('#profile-feedback');
 assert.equal(feedback.hidden,false);assert.equal(feedback.focused,true);assert.equal(feedback.scrolled,true);assert.match(feedback.innerHTML,/A proposta precisa de revisão/);assert.match(feedback.innerHTML,/Criar ficha própria/);assert.equal(s.state.profile.answers.limits,true);assert.equal(s.state.proposal,undefined);assert.equal(s.modals.length,0);
});
test('an invalid hidden measurement cannot silently suppress the submit action',()=>{
 const details={open:false},invalid={name:'height',min:'1',max:'300',willValidate:true,validity:{valid:false,rangeOverflow:true},closest:()=>details};
 const s=questionnaire({}, {invalid});assert.match(s.$('#content').innerHTML,/novalidate/);s.submit();assert.equal(details.open,true);assert.match(s.$('#profile-feedback').innerHTML,/Altura em centímetros/);assert.match(s.$('#profile-feedback').innerHTML,/entre 1 e 300/);assert.equal(s.state.proposal,undefined);
});
test('missing consent and partial-validation failures provide visible actionable feedback',()=>{
 const s=questionnaire({consent:false});s.submit();assert.equal(s.$('#profile-feedback').hidden,false);assert.match(s.$('#profile-feedback').innerHTML,/gravação privada/);
 const invalid=questionnaire({weight:'-1'});invalid.form.oninput({target:{name:'weight'}});assert.match(invalid.$('#profile-save-status').textContent,/Rascunho não guardado/);invalid.submit();assert.equal(invalid.$('#profile-feedback').hidden,false);
});
test('storage and generation failures never leave the review button without a visible outcome',()=>{
 const storage=questionnaire({}, {canPersist:false});storage.submit();assert.match(storage.$('#profile-feedback').innerHTML,/Não foi possível guardar/);
 const broken=questionnaire({}, {throwGenerate:true});broken.submit();assert.match(broken.$('#profile-feedback').innerHTML,/Não foi possível preparar/);assert.equal(broken.state.profile.answers.name,'Example');
});
test('changed answers invalidate a previous proposal so new restrictions cannot leave an outdated preview available',()=>{
 const s=questionnaire({}, {initialProposal:{profile:{}}});s.fields.limits=true;s.form.onchange({target:{name:'limits'}});assert.equal(s.state.proposal,undefined);s.submit();assert.match(s.$('#profile-feedback').innerHTML,/A proposta precisa de revisão/);
});

test('changing answers archives a personalized proposal without leaving an outdated proposal activatable',()=>{
 const proposal=require('../src/domain/programme-proposal.js').prepare(engine.generate({...engine.defaults(),name:'Example',adult:true,consent:true,goals:['muscle'],primaryGoal:'muscle'}));proposal.personalized=true;
 const s=questionnaire({}, {initialProposal:proposal}),before=JSON.stringify(proposal);s.fields.minutes=45;s.form.onchange({target:{name:'minutes'}});
 assert.equal(s.state.proposal,undefined);assert.equal(JSON.stringify(s.state.previousProposal),before);s.submit();assert.equal(s.state.proposal.profile.minutes,45);assert.equal(JSON.stringify(s.state.previousProposal),before);
});
