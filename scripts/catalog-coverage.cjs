const catalog=require('../src/domain/exercise-catalog.js');
const contexts={
 no_equipment:[],dumbbells:['dumbbells'],dumbbells_bench:['dumbbells','bench'],
 barbell_without_rack:['barbell'],bands_without_anchor:['bands'],
 bands_with_anchor:['bands','band_anchor'],only_leg_press:['machine_leg_press']
};
console.log(JSON.stringify({catalogVersion:catalog.VERSION,total:catalog.exercises.length,scope:'Editorial catalogue for manual selection; counts do not certify a training programme.',contexts:Object.fromEntries(Object.entries(contexts).map(([name,equipment])=>[name,catalog.coverage(equipment)]))},null,2));
