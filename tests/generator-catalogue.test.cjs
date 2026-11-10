const {test}=require('node:test'),assert=require('node:assert/strict');
const engine=require('../program-engine.js'),data=require('../src/data/exercise-catalog.js');
const profile=extra=>({...engine.defaults(),name:'Perfil fictício',adult:true,consent:true,goals:['muscle'],primaryGoal:'muscle',...extra});
const movements=result=>result.sessions.flatMap(s=>s.exercises);

test('generator and manual editor share variant definitions without a circular module dependency',()=>{
 assert.equal(engine.library,data.exercises);assert.equal(engine.library.length,93);
 const generated=engine.generate(profile({equipment:['dumbbells'],experience:'regular'}));
 assert.ok(movements(generated).some(e=>['staggered-rdl','db-front-squat','db-deadlift'].includes(e.id)));
 for(const e of movements(generated)){
  const original=data.exercises.find(x=>x.id===e.id);assert.equal(e.exerciseKey,'catalog:'+original.id);
  assert.equal(e.loadReference,original.loadReference);assert.equal(e.unit,original.unit);
 }
});
test('named machines are opt-in and generic machines never unlock an entire gym',()=>{
 const p=profile({location:'gym',equipment:['machines'],machineInventory:['machine_chest_press','machine_leg_press']});
 const result=engine.generate(p);assert.equal(result.errors,undefined);
 assert.ok(movements(result).some(e=>e.id==='machine-press'));assert.ok(movements(result).some(e=>e.id==='legpress'));
 assert.ok(movements(result).every(e=>e.equipment.every(key=>p.machineInventory.includes(key))));
 assert.deepEqual(result.coverage.missing,['pull']);assert.equal(result.status,'limited');
 const legacy=profile({equipment:['machines']});delete legacy.machineInventory;
 const limited=engine.generate(legacy);assert.ok(movements(limited).every(e=>e.equipment.length===0));assert.ok(limited.warnings.some(w=>w.includes('não foram identificadas')));
});
test('rack, incline bench and elastic anchors are real requirements, not inferred accessories',()=>{
 for(const equipment of [['barbell'],['bands'],['dumbbells']]){
  const result=engine.generate(profile({equipment,experience:'experienced'}));assert.equal(result.errors,undefined);
  assert.ok(movements(result).every(e=>e.equipment.every(key=>equipment.includes(key))));
 }
 const anchored=engine.generate(profile({equipment:['bands','band_anchor'],experience:'regular'}));assert.ok(movements(anchored).some(e=>e.id==='band-chest-press'));
 const incline=engine.generate(profile({equipment:['dumbbells','incline_bench']}));assert.ok(movements(incline).some(e=>e.id==='incline-db-press'));
 assert.ok(engine.availableEquipment(incline.profile).includes('bench'));
});
test('confirmed seated/kneeling clearance includes a press while excluding standing overhead variants',()=>{
 const result=engine.generate(profile({equipment:['dumbbells','bench'],overheadClearance:'lowered'}));
 assert.ok(movements(result).some(e=>e.id==='seated-press'));
 assert.ok(movements(result).filter(e=>e.overhead).every(e=>['seated','kneeling'].includes(e.posture)));
 for(const changes of [{overheadClearance:'none'},{lowCeiling:true}]){
  assert.ok(movements(engine.generate(profile({equipment:['dumbbells','bench'],...changes}))).every(e=>!e.overhead));
 }
});
test('weekly variants stay stable while doses may change; seconds never become repetitions or kg',()=>{
 const p=profile({equipment:['dumbbells'],weeks:12,experience:'regular'}),before=JSON.stringify(p),result=engine.generate(p);
 assert.equal(JSON.stringify(p),before);assert.ok(result.sessions.some(s=>s.light));
 for(let day=0;day<3;day++){
  const sessions=result.sessions.filter(s=>s.day===day),ids=sessions[0].exercises.map(e=>e.exerciseKey);
  for(const s of sessions)assert.deepEqual(s.exercises.map(e=>e.exerciseKey),ids);
 }
 const timed=movements(result).filter(e=>e.unit==='s');assert.ok(timed.length);
 assert.ok(timed.every(e=>e.target==='20–30'&&e.noLoad&&e.loadReference==='bodyweight'));
 assert.ok(result.ruleIds.length&&result.ruleVersion===2);
});
test('malformed inventory/space fields are rejected, and old answers remain readable',()=>{
 for(const extra of [{machineInventory:['machines']},{machineInventory:['machine_row','machine_row']},{machineInventory:null},{overheadClearance:'unknown'}])assert.ok(engine.generate(profile(extra)).errors);
 const old=profile();delete old.machineInventory;delete old.overheadClearance;
 assert.equal(engine.generate(old).errors,undefined);assert.deepEqual(engine.profileErrors(old),[]);
});
test('all general goals and time budgets preserve material, experience gates and the complete weekly core functions or an explicit gap',()=>{
 const contexts=[[],['dumbbells'],['barbell'],['bands'],['dumbbells','bench','bands'],['machine_leg_press','machine_chest_press','machine_row']];
 for(const equipment of contexts)for(const days of [1,2,3,4])for(const minutes of [20,30,45,60])for(const goal of Object.keys(engine.GOALS)){
  const p=profile({equipment,days,minutes,goals:[goal],primaryGoal:goal}),result=engine.generate(p);
  if(result.errors){assert.equal(minutes,20);assert.match(result.errors.join(' '),/Aumenta os minutos/);assert.equal(result.sessions,undefined);continue;}
  assert.equal(result.sessions.length,days*12);
  assert.ok(result.sessions.every(s=>s.estimatedMinutes<=minutes&&s.exercises.length>=3));
  for(const e of movements(result)){
   assert.ok(e.equipment.every(key=>equipment.includes(key)));assert.notEqual(e.level,'experienced');
   assert.ok(e.sets>=1&&e.sets<=3);assert.ok(e.video===''&&e.name);if(e.id==='prone-w')assert.equal(e.pattern,'scapular');
  }
  assert.equal(result.status,result.coverage.missing.length?'limited':'general');
  if(result.status==='limited')assert.ok(result.warnings.some(w=>w.includes('Proposta limitada')));
 }
});

test('profile picker inventory includes only declared machines/accessories and confirmed overhead positions',()=>{
 const catalog=require('../src/domain/exercise-catalog.js'),p=profile({equipment:['dumbbells','machines'],machineInventory:['machine_chest_press'],overheadClearance:'lowered'});
 const result=catalog.search({context:'profile',inventory:engine.availableEquipment(p),conditions:p});
 assert.ok(result.some(e=>e.id==='machine-press'));assert.ok(result.some(e=>e.id==='kneeling-press'));
 assert.ok(result.every(e=>e.equipment.every(key=>['dumbbells','machine_chest_press'].includes(key))));
 assert.ok(result.every(e=>!e.overhead||['seated','kneeling'].includes(e.posture)));
 assert.deepEqual(catalog.search({context:'profile'}),[]);
 assert.ok(catalog.search({context:'all'}).some(e=>e.id==='legpress'),'Full catalogue must remain an explicit option');
});
