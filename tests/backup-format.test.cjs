const {test}=require('node:test'),assert=require('node:assert/strict'),format=require('../src/data/backup-format.js'),catalog=require('../src/domain/exercise-catalog.js');
const plan=()=>({id:'source',name:'Shared',note:'',program:{id:'private-program'},sessionOnly:true,executionSourceId:'private-source',exercises:[catalog.instantiate(catalog.exercises[0],'exercise')]});
test('portable v2 files omit private links and are distinct from the format silently accepted by legacy readers',()=>{
 const source=plan();source.exercises[0].exampleIds=['private'];const encoded=format.planEnvelope(source);
 assert.equal(encoded.format,'treino-plan-v2');assert.equal(encoded.version,2);assert.equal(encoded.minClientBuild,10);
 assert.equal(encoded.plan.sessionOnly,undefined);assert.equal(encoded.plan.program,undefined);assert.equal(encoded.plan.exercises[0].exampleIds,undefined);
 assert.equal(format.decode(encoded).kind,'plan');assert.equal(source.sessionOnly,true);
});
test('legacy portable files remain readable while unknown/newer formats are rejected before import',()=>{
 const source=plan();delete source.sessionOnly;delete source.executionSourceId;
 assert.equal(format.decode({format:'treino-plan',version:1,plan:source}).kind,'plan');
 assert.throws(()=>format.decode({format:'treino-plan-v2',version:3,plan:source}),/não é suportada/);
 assert.throws(()=>format.decode({...format.planEnvelope(source),minClientBuild:11}),/mais recente/);
 assert.throws(()=>format.decode({format:'treino-plan',version:1,plan:{...source,exercises:[null]}}),/inválidos/);
});
