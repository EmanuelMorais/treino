const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const data=fs.readFileSync('data.js','utf8'),c=vm.createContext({});vm.runInContext(data+'\nthis.prepared=PREPARED',c);
test('public code has no previous personal load records or profile history',()=>{
 for(const text of [data,fs.readFileSync('app.js','utf8')])for(const phrase of ['17 kg','30 kg','11 kg','17%','Emanuel','Joana','cervical, lombar e na anca'])assert.equal(text.includes(phrase),false,phrase);
});
test('A preserves the six movements and original doses in all 12 weeks',()=>{
 const names=['DB Thrusters','Staggered Stance DB Deadlift','Single-Arm DB Row','Push-Ups','DB Reverse Lunge','Farmers Carry'];
 for(let w=1;w<=12;w++){
  const p=c.prepared.find(p=>p.id===`bf12v2-w${String(w).padStart(2,'0')}-A`);
  assert.deepEqual(Array.from(p.exercises,e=>e.name),names);assert.ok(p.exercises.every(e=>e.originalDose));
 }
});
test('exercise units stay distinct from rest seconds',()=>{
 for(const p of c.prepared.filter(p=>p.course?.session!=='M'&&p.course))for(const e of p.exercises)assert.equal(e.unit,e.originalName.includes('Carry')?'steps':'reps');
});
