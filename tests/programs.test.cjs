const {test}=require('node:test'),assert=require('node:assert/strict'),engine=require('../program-engine.js');
const profile=extra=>({...engine.defaults(),name:'Example',adult:true,consent:true,goals:['strength'],primaryGoal:'strength',...extra});
test('choosing a priority includes it among objectives without dropping other selected goals',()=>{
 const selected=['weight_loss','mobility'];const result=engine.reconcileGoals(selected,'strength','primaryGoal');assert.deepEqual(result,{goals:['weight_loss','mobility','strength'],primaryGoal:'strength'});assert.deepEqual(selected,['weight_loss','mobility']);
});
test('unchecking the current priority selects a remaining objective or leaves an explicit empty choice',()=>{
 assert.deepEqual(engine.reconcileGoals(['weight_loss','mobility'],'strength','goals'),{goals:['weight_loss','mobility'],primaryGoal:'weight_loss'});
 assert.deepEqual(engine.reconcileGoals([],'strength','goals'),{goals:[],primaryGoal:''});
});
test('existing inconsistent questionnaire priorities are reconciled for display without mutating stored answers',()=>{
 const original=profile({goals:['weight_loss','mobility'],primaryGoal:'strength'}),before=JSON.stringify(original);
 const next={...original,...engine.reconcileGoals(original.goals,original.primaryGoal)};assert.deepEqual(engine.profileErrors(next),[]);assert.equal(JSON.stringify(original),before);
});
test('three home sessions fit 30–45 minutes and use only declared equipment',()=>{
 const p=profile({days:3,minutes:35,equipment:['dumbbells','bench','bands'],goals:['strength','muscle','weight_loss'],primaryGoal:'muscle'}),result=engine.generate(p);
 assert.equal(result.errors,undefined);assert.equal(result.sessions.length,36);assert.equal(result.weightLoss,true);
 for(const s of result.sessions){assert.ok(s.estimatedMinutes<=35);for(const e of s.exercises)assert.ok(e.equipment.every(x=>p.equipment.includes(x)));}
 assert.ok(result.notes.some(n=>n.includes('Perder peso')));
});
test('two 20-minute bodyweight days produce complete, bounded sessions without inventing equipment',()=>{
 const result=engine.generate(profile({days:2,minutes:20,equipment:[]}));assert.equal(result.errors,undefined);
 assert.equal(result.sessions.length,24);assert.ok(result.warnings.some(w=>w.includes('costas')));
 for(const s of result.sessions){assert.ok(s.estimatedMinutes<=20);assert.ok(s.exercises.every(e=>!e.equipment.length));}
});
test('four gym days alternate upper and lower sessions without assuming undeclared racks',()=>{
 const result=engine.generate(profile({days:4,minutes:45,location:'gym',equipment:['machines','dumbbells','bench'],experience:'regular'}));assert.equal(result.errors,undefined);
 assert.equal(result.sessions.length,48);assert.equal(result.sessions[0].exercises[0].pattern,'push');assert.equal(result.sessions[1].exercises[0].pattern,'squat');
 assert.ok(result.sessions.every(s=>s.estimatedMinutes<=45));
});
test('weight loss is selectable as the primary goal without requiring weight or inventing calories',()=>{
 const result=engine.generate(profile({goals:['weight_loss'],primaryGoal:'weight_loss',weight:'',height:''}));assert.equal(result.errors,undefined);assert.equal(result.weightLoss,true);assert.ok(result.notes.some(n=>n.includes('caminhadas')||n.includes('Caminhadas')));
});
test('limits, exclusions and incomplete questionnaires cannot bypass proposal review',()=>{
 assert.equal(engine.generate(profile({limits:true})).reviewRequired,true);
 assert.equal(engine.generate(profile({avoided:'Squat'})).reviewRequired,true);
 for(const extra of [{adult:false},{consent:false},{goals:[]},{primaryGoal:'unknown'},{minutes:5},{equipment:['rack']},{preferredDays:[0,1,2]}])assert.ok(engine.generate(profile(extra)).errors);
});
test('no overhead clearance excludes overhead pressing and progression is not forced by week',()=>{
 const result=engine.generate(profile({equipment:['dumbbells','bench'],lowCeiling:true}));assert.equal(result.errors,undefined);
 assert.ok(result.sessions.every(s=>s.exercises.every(e=>!['seated-press','kneeling-press'].includes(e.id))));
 assert.ok(result.notes.some(n=>n.includes('Não há aumentos obrigatórios')));
});
test('video examples validate YouTube hosts, muscle tags and clip bounds',()=>{
 const e={id:'example',name:'Press',video:'ACyCx_s15ME',start:20,end:45,muscles:['Ombros','Tríceps'],equipment:['dumbbells'],note:'Sentado'};
 assert.equal(engine.validExample(e),true);assert.equal(engine.videoId('https://youtu.be/ACyCx_s15ME?t=20'),'ACyCx_s15ME');
 for(const url of ['javascript:alert(1)','https://youtube.com.evil.invalid/watch?v=ACyCx_s15ME','https://evil.invalid/ACyCx_s15ME'])assert.equal(engine.videoId(url),null);
 assert.equal(engine.validExample({...e,end:10}),false);assert.equal(engine.validExample({...e,muscles:['unknown']}),false);
});
test('private state validation rejects a modified generated prescription',()=>{
 const proposal=engine.generate(profile());assert.equal(engine.validExtras({proposal}),true);proposal.sessions[0].exercises[0].sets=999;assert.equal(engine.validExtras({proposal}),false);
});
test('activation ingredients do not mutate the profile or publish another persons programme',()=>{
 const p=profile({minutes:30,equipment:['barbell'],barbellMax:'30'}),before=JSON.stringify(p);const result=engine.generate(p);assert.equal(result.errors,undefined);assert.equal(JSON.stringify(p),before);
 assert.ok(result.sessions.every(s=>s.exercises.every(e=>!e.equipment.includes('bench'))));assert.ok(result.sessions.every(s=>s.estimatedMinutes<=30));
});
