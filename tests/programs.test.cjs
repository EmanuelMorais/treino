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
test('two 20-minute bodyweight days produce limited, bounded sessions without inventing equipment',()=>{
 const result=engine.generate(profile({days:2,minutes:20,equipment:[]}));assert.equal(result.errors,undefined);
 assert.equal(result.sessions.length,24);assert.equal(result.status,'limited');assert.deepEqual(result.coverage.missing,['pull']);assert.ok(result.warnings.some(w=>w.includes('costas')));
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
 for(const extra of [{adult:false},{consent:false},{goals:[]},{primaryGoal:'unknown'},{minutes:5},{equipment:['unknown-equipment']},{preferredDays:[0,1,2]}])assert.ok(engine.generate(profile(extra)).errors);
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
const names=result=>result.sessions.filter(s=>s.week===1).map(s=>s.label);
const gym={location:'gym',equipment:['dumbbells','bench','barbell','bands','band_anchor','machines'],machineInventory:['machine_lat','machine_leg_press','machine_leg_curl','machine_leg_extension','machine_row','machine_chest_press','cable_high','cable_low'],experience:'experienced',minutes:60};
test('common splits are generated for the weekly frequencies they support, each day with its own focus',()=>{
 const ppl=engine.generate(profile({...gym,split:'ppl',days:6,goals:['muscle'],primaryGoal:'muscle'}));assert.equal(ppl.errors,undefined);
 assert.equal(ppl.sessions.length,72);assert.match(names(ppl)[0],/^Push/);assert.match(names(ppl)[1],/^Pull/);assert.match(names(ppl)[2],/^Legs/);
 const week=ppl.sessions.filter(s=>s.week===1);
 assert.ok(week[0].exercises.every(e=>!['squat','hinge','pull','vertical_pull'].includes(e.pattern)));
 assert.ok(week[1].exercises.every(e=>!['squat','hinge','push'].includes(e.pattern)));
 assert.ok(week[2].exercises.filter(e=>['squat','hinge'].includes(e.pattern)).length>=2);
 const bro=engine.generate(profile({...gym,split:'bro',days:5,goals:['muscle'],primaryGoal:'muscle'}));assert.equal(bro.errors,undefined);
 assert.deepEqual(names(bro),['Peito','Costas','Pernas','Ombros','Braços e core']);assert.ok(bro.warnings.some(w=>w.includes('uma vez por semana')));
 const upper=engine.generate(profile({...gym,split:'upper_lower',days:4}));assert.deepEqual(names(upper),['Tronco A','Pernas A','Tronco B','Pernas B']);
 assert.equal(engine.generate(profile({...gym,days:5})).split,'hybrid');assert.equal(engine.generate(profile({...gym,days:6})).split,'ppl');
 for(const result of [ppl,bro,upper])assert.ok(result.sessions.every(s=>s.estimatedMinutes<=60&&s.exercises.length>=3&&s.exercises.every(e=>e.how&&e.name)));
});
test('a split that does not fit the chosen days is refused with the supported frequencies',()=>{
 assert.match(engine.generate(profile({...gym,split:'ppl',days:4})).errors.join(' '),/3 ou 6 dias/);
 assert.ok(engine.generate(profile({split:'unknown'})).errors);assert.ok(engine.generate(profile({emphasis:'unknown'})).errors);
 const old=profile();delete old.split;delete old.emphasis;assert.equal(engine.generate(old).errors,undefined);
});
test('the main goal changes repetitions, sets and rest rather than only the label',()=>{
 const dose=(goal,extra={})=>engine.generate(profile({...gym,days:3,goals:[goal],primaryGoal:goal,...extra})).sessions[0].exercises[0];
 const strength=dose('strength'),muscle=dose('muscle'),tone=dose('tone');
 assert.equal(strength.target,'4–6');assert.equal(strength.restSeconds,150);assert.ok(strength.sets>=3);
 assert.equal(muscle.target,'8–12');assert.equal(muscle.restSeconds,90);
 assert.equal(tone.target,'12–15');assert.equal(tone.restSeconds,45);
 assert.equal(dose('strength',{experience:'beginner'}).target,'6–10','beginners do not get heavy low-repetition work');
});
test('lower-body emphasis keeps upper-body work but gives it fewer sets',()=>{
 const result=engine.generate(profile({...gym,experience:'regular',days:3,goals:['tone'],primaryGoal:'tone',emphasis:'lower'}));assert.equal(result.errors,undefined);
 const week=result.sessions.filter(s=>s.week===1).flatMap(s=>s.exercises),lower=week.filter(e=>['squat','hinge'].includes(e.pattern)),upper=week.filter(e=>['push','pull','vertical_pull','shoulders'].includes(e.pattern));
 assert.ok(lower.length&&upper.length);assert.ok(upper.every(e=>e.sets<=2));assert.ok(lower.some(e=>e.sets>=3));
 assert.ok(week.some(e=>e.muscles.includes('Glúteos')&&!['squat','hinge'].includes(e.pattern)||e.pattern==='calves'||e.id.includes('bridge')||e.id.includes('thrust')));
});
test('mobility as the main goal starts every session with mobility work and keeps basic strength',()=>{
 const result=engine.generate(profile({equipment:['dumbbells'],days:2,minutes:30,goals:['mobility'],primaryGoal:'mobility'}));assert.equal(result.errors,undefined);assert.equal(result.split,'mobility');
 for(const s of result.sessions){assert.equal(s.exercises[0].pattern,'mobility');assert.ok(s.exercises.filter(e=>e.pattern==='mobility').length>=2);assert.ok(s.exercises.some(e=>e.pattern!=='mobility'));}
});
