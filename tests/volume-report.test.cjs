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
const records=require('../src/domain/workout-records.js');
const session=(date,id,exercises)=>({id,planId:'p',planName:'Treino',date,note:'',savedAt:1,exercises,planSnapshot:{exercises:exercises.map(e=>({id:e.id,muscles:e.snapshotMuscles}))}});
const done=n=>Array.from({length:n},()=>({done:true}));

test('performed volume counts only the sets saved as done, with muscles from the record or its snapshot',()=>{
 const history=[session('2026-11-10','h1',[{id:'e1',name:'Supino',rows:done(3),snapshotMuscles:['Peito','Tríceps']}]),
  session('2026-11-12','h2',[{id:'e2',name:'Remada',rows:done(4),libraryId:'db-row'}])];
 const report=volume.performedVolume(history,{goal:'muscle'});
 assert.equal(report.kind,'performed');assert.equal(report.sessions,2);assert.equal(report.days,2);
 assert.equal(find(report,'Peito').effective,3);assert.equal(find(report,'Costas').effective,4);
 assert.equal(find(report,'Tríceps').effective,1.5);assert.equal(report.totalSets,7);
 assert.equal(report.first,'2026-11-10');assert.equal(report.last,'2026-11-12');
});
test('the window keeps only sessions inside the dates asked for',()=>{
 const history=[session('2026-10-01','h1',[{id:'e1',name:'Supino',rows:done(3),snapshotMuscles:['Peito']}]),
  session('2026-11-12','h2',[{id:'e1',name:'Supino',rows:done(2),snapshotMuscles:['Peito']}])];
 assert.equal(find(volume.performedVolume(history,{from:'2026-11-01'}),'Peito').effective,2);
 assert.equal(volume.performedVolume(history,{from:'2026-11-01'}).sessions,1);
 assert.equal(find(volume.performedVolume(history,{}),'Peito').effective,5,'no window means everything');
 assert.equal(volume.performedVolume([],{from:'2026-11-01'}).rows.length,0);
});
test('a set added during the session shows up in the performed chart once the session is saved',()=>{
 const plan={id:'p1',name:'T',note:'',exercises:[{id:'e1',name:'Supino',video:'',sets:2,target:'8',unit:'reps',start:0,note:'',muscles:['Peito','Tríceps'],exerciseKey:'catalog:bench-press',loadReference:'per_dumbbell'}]};
 const draft={date:'2026-11-12',note:'',rows:{e1:[{kg:'20',reps:'8',done:true},{kg:'20',reps:'8',done:true}]}};
 const before=records.sessionRecord(plan,draft,null,{id:'h1',now:1,week:1});
 assert.equal(find(volume.performedVolume([before],{}),'Peito').effective,2);
 draft.rows.e1.push({kg:'20',reps:'7',done:true});
 const after=records.sessionRecord(plan,draft,null,{id:'h1',now:2,week:1});
 assert.equal(find(volume.performedVolume([after],{}),'Peito').effective,3,'the extra set counts');
 draft.rows.e1.push({kg:'20',reps:'',done:false});
 assert.equal(find(volume.performedVolume([records.sessionRecord(plan,draft,null,{id:'h1',now:3,week:1})],{}),'Peito').effective,3,'an unticked set does not');
});
test('an emphasis moves the other region to the maintenance band instead of calling it a gap',()=>{
 const week=[plan('a',[e('Hip thrust',8,['Glúteos']),e('Supino',12,['Peito'])])];
 const balanced=volume.weeklyVolume(week,{goal:'muscle'}),upper=volume.weeklyVolume(week,{goal:'muscle',emphasis:'upper'});
 assert.equal(find(balanced,'Glúteos').status,'low');assert.equal(find(balanced,'Glúteos').kind,'alvo');
 assert.equal(find(upper,'Glúteos').status,'ok');assert.equal(find(upper,'Glúteos').kind,'manutenção');
 assert.deepEqual([find(upper,'Glúteos').low,find(upper,'Glúteos').high],[6,14]);
 assert.equal(find(upper,'Peito').kind,'alvo','the emphasised region keeps the full target');
 assert.equal(find(volume.weeklyVolume(week,{goal:'muscle',emphasis:'lower'}),'Peito').kind,'manutenção');
});
const contract=require('../src/domain/document-contract.js');
test('the document accepts a saved balance target and rejects invalid values',()=>{
 const base={version:1,plans:[],drafts:{},history:[],favorites:[]};
 assert.equal(contract.valid({...base,balance:{goal:'muscle',emphasis:'upper'}}),true);
 assert.equal(contract.valid({...base,balance:{goal:'strength'}}),true);
 assert.equal(contract.valid({...base,balance:{}}),true);
 for(const bad of [{goal:'inventado'},{emphasis:'inventado'},{goal:'muscle',extra:1},null,[],'muscle'])
  assert.equal(contract.valid({...base,balance:bad}),false,JSON.stringify(bad));
});
