const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const programs=require('../program-engine.js'),domain=require('../src/domain/programme-proposal.js'),contract=require('../src/domain/document-contract.js');
function fixture({canPersist=true}={}){
 const proposal=programs.generate({...programs.defaults(),name:'Fixture',adult:true,consent:true,goals:['muscle'],primaryGoal:'muscle',equipment:['dumbbells','bench'],weeks:4,minutes:45});
 const state={version:1,plans:[],history:[],drafts:{},favorites:[],proposal},controls=new Map(),messages=[];let i=0;
 const $=selector=>{if(!controls.has(selector))controls.set(selector,{textContent:'',focus(){},checked:true});return controls.get(selector);};
 const ctx=vm.createContext({window:{TreinoProposal:domain},programs,accountAccess:true,activeStorageKey:'account-a',state,$,validState:contract.valid,document:{querySelectorAll:()=>[]},modal(){},closeModal(){},setView(){},selectedPlan:'',persist:()=>canPersist,uid:()=> 'fixture-'+(++i),toast:message=>messages.push(message),esc:String});
 vm.runInContext(fs.readFileSync('src/ui/programme-proposal.js','utf8'),ctx);vm.runInContext('previewProposal()',ctx);
 return {ctx,$,messages,activate:()=>$('#activate-proposal').onclick()};
}
test('a stale activation callback cannot create a duplicate programme',()=>{
 const f=fixture(),callback=f.$('#activate-proposal').onclick;callback();assert.equal(f.ctx.state.programVersions.length,1);const after=JSON.stringify(f.ctx.state);callback();assert.equal(JSON.stringify(f.ctx.state),after);assert.match(f.messages.at(-1),/proposta mudou/);
});
test('switching accounts invalidates a preview before any activation or write',()=>{
 const f=fixture(),before=JSON.stringify(f.ctx.state);f.ctx.activeStorageKey='account-b';f.activate();assert.equal(JSON.stringify(f.ctx.state),before);assert.match(f.messages.at(-1),/conta ou proposta mudou/);
});
test('failed local storage keeps the original proposal and programme state available',()=>{
 const f=fixture({canPersist:false}),before=JSON.stringify(f.ctx.state);f.activate();assert.equal(JSON.stringify(f.ctx.state),before);assert.match(f.$('#proposal-error').textContent,/Não foi possível guardar/);
});
test('new proposal edits invalidate old preview callbacks instead of activating a stale draft',()=>{
 const f=fixture();f.ctx.state.proposal.sessions[0].exercises[0].target='9';const before=JSON.stringify(f.ctx.state);f.activate();assert.equal(JSON.stringify(f.ctx.state),before);assert.match(f.messages.at(-1),/proposta mudou/);
});
