const test=require('node:test');const assert=require('node:assert/strict');
const demos=require('../src/ui/movement-demos.js');
const catalog=require('../src/data/exercise-catalog.js');

test('every strength exercise of the catalogue has an animated demonstration',()=>{
 const missing=catalog.exercises.filter(e=>!demos.demoFor(e)).map(e=>e.id);
 // Mobility drills are held positions or rotations the stick figure does not draw yet.
 assert.deepEqual(missing.sort(),['ankle-wall','hip-9090','hip-flexor-hold','hip-mobility','thoracic-rotation']);
 for(const id of Object.keys(demos.BY_ID))assert.ok(catalog.exercises.some(e=>e.id===id),'mapped id exists: '+id);
});
test('the figure is one SVG that animates between two poses and respects reduced motion',()=>{
 const demo=demos.demoFor({id:'db-rdl'});
 assert.equal(demo.key,'hinge');assert.equal(demo.weight,'db');
 const svg=demos.demoSVG(demo);
 assert.match(svg,/^<svg class="demo-figure" viewBox="0 0 200 140" role="img" aria-label="Demonstração animada: peso morto romeno">/);
 assert.ok(svg.includes('repeatCount="indefinite"'),'the motion loops');
 assert.equal((svg.match(/<svg/g)||[]).length,1);
 assert.ok(!demos.demoSVG(demo,{still:true}).includes('<animate'),'a still figure has no animation');
});
test('the weight follows the equipment named by the exercise id',()=>{
 assert.equal(demos.demoFor({id:'bar-rdl'}).weight,'bar');
 assert.equal(demos.demoFor({id:'back-squat'}).weight,'bar-shoulders');
 assert.equal(demos.demoFor({id:'band-row'}).weight,'band');
 assert.equal(demos.demoFor({id:'pushup'}).weight,'none');
 assert.equal(demos.demoFor({id:'goblet'}).weight,'db-chest');
 assert.equal(demos.demoFor({id:'custom-x',pattern:'push'}).key,'press','an unknown exercise falls back to its pattern');
 assert.equal(demos.demoFor({id:'custom-y'}),null);
});
