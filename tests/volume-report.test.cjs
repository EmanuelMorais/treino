const {test}=require('node:test'),assert=require('node:assert/strict');
const volume=require('../src/domain/volume-report.js'),engine=require('../program-engine.js');
const plan=(id,exercises)=>({id,name:id,exercises});
const e=(name,sets,muscles,extra={})=>({name,sets,...(muscles?{muscles}:{}),...extra});
const find=(report,muscle)=>report.rows.find(r=>r.muscle===muscle);

test('a set counts once for the main muscle and half for the others',()=>{
 const report=volume.weeklyVolume([plan('a',[e('Supino',4,['Peito','Tríceps'])])],{goal:'muscle'});
 assert.equal(find(report,'Peito').effective,4);assert.equal(find(report,'Peito').direct,4);
 assert.equal(find(report,'Tríceps').effective,2);assert.equal(find(report,'Tríceps').direct,0);
 assert.equal(report.totalSets,4);
});
test('sessions count the days where the muscle is the main one, and rows are sorted by volume',()=>{
 const report=volume.weeklyVolume([plan('a',[e('Supino',3,['Peito','Tríceps'])]),plan('b',[e('Flexões',3,['Peito','Tríceps'])]),plan('c',[e('Remada',4,['Costas','Bíceps'])])],{goal:'muscle'});
 assert.equal(find(report,'Peito').sessions,2);assert.equal(find(report,'Costas').sessions,1);
 assert.deepEqual(report.rows.map(r=>r.muscle),['Peito','Costas','Tríceps','Bíceps']);
});
test('status compares effective sets with the band for the goal, and the band depends on the goal',()=>{
 const sets=n=>volume.weeklyVolume([plan('a',[e('Supino',n,['Peito'])])],{goal:'muscle'});
 assert.equal(find(sets(4),'Peito').status,'low');assert.equal(find(sets(12),'Peito').status,'ok');assert.equal(find(sets(26),'Peito').status,'high');
 const strength=volume.weeklyVolume([plan('a',[e('Supino',8,['Peito'])])],{goal:'strength'});
 assert.equal(find(strength,'Peito').status,'ok');assert.equal(find(sets(8),'Peito').status,'low','the same volume is low for muscle growth');
 assert.deepEqual([find(strength,'Peito').low,find(strength,'Peito').high],[6,14]);
});
test('major muscles with no work at all are reported as missing',()=>{
 const report=volume.weeklyVolume([plan('a',[e('Supino',3,['Peito','Tríceps'])])],{goal:'muscle'});
 assert.deepEqual(report.missing,['Costas','Ombros','Quadríceps','Posteriores da coxa','Glúteos']);
});
test('mobility work is left out of the count',()=>{
 const report=volume.weeklyVolume([plan('a',[e('Gato-camelo',3,['Core'],{pattern:'mobility'}),e('Prancha',2,['Core'])])],{goal:'muscle'});
 assert.equal(find(report,'Core').effective,2);assert.equal(report.totalSets,2);
});
test('an exercise without muscles falls back to the catalogue by libraryId or exercise key',()=>{
 const report=volume.weeklyVolume([plan('a',[e('Qualquer nome',3,null,{libraryId:'bench-press'}),e('Outro',2,null,{exerciseKey:'catalog:bar-row'})])],{goal:'muscle'});
 assert.equal(find(report,'Peito').effective,3);assert.equal(find(report,'Costas').effective,2);
 assert.deepEqual(report.estimated,[],'the catalogue is not an estimate');
});
test('plans written before the catalogue are classified by name and flagged as an estimate',()=>{
 const legacy=[plan('a',[e('DB Bench Press · banco plano',3),e('Single-Arm DB Row',3),e('Seated DB Shoulder Press · press de ombros sentado',2),
  e('Dumbbell Romanian Deadlift (RDL)',3),e('Bulgarian Split Squat',3),e('Lean-In Dumbbell Lateral Raise',2),e('Seated DB Bicep Curl',2),e('Farmers Carry',2)])];
 const report=volume.weeklyVolume(legacy,{goal:'muscle'});
 assert.equal(report.estimated.length,8,'every legacy exercise is named');assert.deepEqual(report.unknown,[]);
 assert.equal(find(report,'Peito').effective,3);assert.equal(find(report,'Costas').direct,3);
 assert.equal(find(report,'Posteriores da coxa').direct,3,'an RDL counts hamstrings as the main muscle');
 assert.equal(find(report,'Quadríceps').direct,3);assert.equal(find(report,'Ombros').direct,4,'press and lateral raise');
 assert.equal(find(report,'Bíceps').direct,2);
});
test('a name that matches no rule is listed instead of being silently dropped',()=>{
 const report=volume.weeklyVolume([plan('a',[e('Movimento inventado',3)])],{goal:'muscle'});
 assert.deepEqual(report.unknown,['Movimento inventado']);assert.equal(report.rows.length,0);assert.equal(report.totalSets,3);
});
test('the hamstring rule is not swallowed by the biceps curl rule',()=>{
 const report=volume.weeklyVolume([plan('a',[e('Leg curl deitado',3),e('Curl de bíceps',3)])],{goal:'muscle'});
 assert.equal(find(report,'Posteriores da coxa').direct,3);assert.equal(find(report,'Bíceps').direct,3);
});
test('a generated week reports every major muscle it trains',()=>{
 const result=engine.generate({...engine.defaults(),name:'x',adult:true,consent:true,equipment:['dumbbells','bench','barbell','bands','band_anchor'],
  experience:'regular',minutes:60,days:4,split:'upper_lower',goals:['muscle'],primaryGoal:'muscle'});
 assert.equal(result.errors,undefined);
 const report=volume.weeklyVolume(result.sessions.filter(s=>s.week===1),{goal:'muscle'});
 assert.deepEqual(report.estimated,[]);assert.deepEqual(report.unknown,[]);
 assert.ok(report.rows.length>=6);assert.ok(report.missing.length<=1,'missing: '+report.missing.join(', '));
});
