const {test}=require('node:test'),assert=require('node:assert/strict'),catalog=require('../src/domain/exercise-catalog.js'),records=require('../src/domain/workout-records.js');

test('editorial catalogue entries have unique stable variants, execution cues and explicit equipment',()=>{
 assert.ok(catalog.exercises.length>80);
 assert.equal(new Set(catalog.exercises.map(e=>e.id)).size,catalog.exercises.length);
 for(const e of catalog.exercises){
  assert.ok(e.name&&e.aliases.length&&e.how&&e.muscles.length&&e.pattern&&e.direction&&e.provenance);
  assert.equal(e.contentStatus,'editorial');assert.ok(e.equipment.every(key=>catalog.EQUIPMENT[key]));
  assert.ok(records.LOAD_REFERENCES.includes(e.loadReference));assert.ok(['reps','s','steps'].includes(e.unit));
 }
});
test('search finds Portuguese, English and accentless aliases across muscles and names',()=>{
 assert.equal(catalog.search({query:'dumbbell romanian deadlift'})[0].id,'db-rdl');
 assert.ok(catalog.search({query:'biceps'}).some(e=>e.id==='hammer-curl'));
 assert.equal(catalog.search({query:'puxada vertical na maquina'})[0].id,'lat-pulldown');
 assert.equal(catalog.search({query:'nonsense unknown exercise'}).length,0);
});
test('only-dumbbell and no-equipment contexts never assume a bench, rack, chair or wall',()=>{
 for(const [context,permitted]of [['dumbbells',['dumbbells']],['bodyweight',[]],['barbell',['barbell']],['bands',['bands']]]){
  const results=catalog.search({context});assert.ok(results.length);
  assert.ok(results.every(e=>e.equipment.every(key=>permitted.includes(key))));
 }
 assert.ok(!catalog.search({context:'dumbbells'}).some(e=>['bulgarian','bench-press','incline-db-press'].includes(e.id)));
 assert.ok(catalog.search({context:'dumbbells_incline'}).some(e=>e.id==='incline-db-press'));
});
test('profile presets only select exact known inventories and unknown filters never widen the results',()=>{
 assert.equal(catalog.defaultContext(['dumbbells']),'dumbbells');assert.equal(catalog.defaultContext([]),'bodyweight');
 assert.equal(catalog.defaultContext(['machines']),'all');assert.equal(catalog.defaultContext(undefined),'all');
 assert.equal(catalog.search({context:'unknown-context'}).length,0);
});
test('machine selection names the actual machine rather than assuming a full gym',()=>{
 const results=catalog.search({context:'machine:machine_leg_press'});
 assert.deepEqual(results.map(e=>e.id),['legpress']);
 assert.equal(catalog.compatibleWith(results[0],['machines']),false);
 assert.equal(catalog.compatibleWith(results[0],['machine_leg_press']),true);
});
test('coverage exposes missing loaded pulls and never counts flyes or scapular activation as presses/rows',()=>{
 assert.ok(catalog.coverage([]).missing.includes('pull'));
 assert.equal(catalog.coverage(['dumbbells']).missing.length,0);
 assert.equal(catalog.exercises.find(e=>e.id==='prone-w').pattern,'scapular');
 for(const id of ['db-fly','pec-deck','lateral-raise'])assert.equal(catalog.exercises.find(e=>e.id===id).pattern,'accessory');
});
test('space conditions exclude overhead and walking exercises without silently changing variants',()=>{
 const results=catalog.search({context:'dumbbells',conditions:{lowCeiling:true,walkingSpace:false}});
 assert.ok(results.every(e=>!e.overhead&&!e.walking));
 assert.ok(!results.some(e=>e.id==='farmer-carry'));
});
test('favorites, recents, body filters and private exercises are combined without mutation',()=>{
 const favorite='hammer-curl';assert.equal(catalog.search({favorites:[favorite]})[0].id,favorite);
 assert.deepEqual(catalog.search({favorites:[favorite],onlyFavorites:true}).map(e=>e.id),[favorite]);
 assert.ok(catalog.search({muscle:'Peito'}).every(e=>e.muscles.includes('Peito')));
 const plans=[{exercises:[{id:'private',exerciseKey:'legacy:plan:private',name:'Nome pessoal',video:'',unit:'s',note:'Instrução pessoal'}]}],before=JSON.stringify(plans);
 const extra=catalog.personalExercises(plans);assert.equal(catalog.search({query:'nome pessoal',extra})[0].id,'legacy:plan:private');
 assert.equal(JSON.stringify(plans),before);assert.equal(catalog.search({query:'nome pessoal'}).length,0);
 assert.equal(catalog.search({query:'nome pessoal',extra,context:'bodyweight'}).length,0);
 assert.equal(extra[0].equipmentKnown,false);
});
test('instantiation keeps definition identity while creating an independent occurrence and blank personal dose',()=>{
 const definition=catalog.exercises.find(e=>e.id==='db-rdl'),before=JSON.stringify(definition);
 const a=catalog.instantiate(definition,'one'),b=catalog.instantiate(definition,'two');
 assert.notEqual(a.id,b.id);assert.equal(a.exerciseKey,b.exerciseKey);assert.equal(a.loadReference,'per_dumbbell');
 assert.equal(a.target,'');a.equipment.push('anything');assert.equal(JSON.stringify(definition),before);
});
