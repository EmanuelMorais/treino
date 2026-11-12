/* Weekly set count per muscle group, used to check a week against its goal.
 * A set counts 1 for the exercise's first (main) muscle and 0.5 for each other one. */
(function(root){
 const MAJOR=['Peito','Costas','Ombros','Quadríceps','Posteriores da coxa','Glúteos'];
 const SMALL=['Bíceps','Tríceps','Gémeos','Core','Adutores','Flexores da anca','Pescoço'];
 const ORDER=[...MAJOR,...SMALL];
 // Weekly effective sets per muscle that the app treats as balanced for each goal.
 const TARGETS={muscle:{major:[10,20],small:[4,16]},strength:{major:[6,14],small:[3,12]},tone:{major:[6,14],small:[3,12]},
  fitness:{major:[6,14],small:[3,12]},weight_loss:{major:[6,14],small:[3,12]},mobility:{major:[4,12],small:[2,10]}};
 // Plans written before the catalogue carried muscle tags are classified by name. First match wins.
 const BY_NAME=[
  [/pesco[çc]o|\bneck\b/i,['Pescoço']],
  [/g[ée]meos|\bcalf\b|calves|panturr/i,['Gémeos']],
  [/leg ?curl|curl de perna|femoral|flex[ãa]o de joelho/i,['Posteriores da coxa']],
  [/prancha|plank|dead ?bug|bird ?dog|pallof|abdominal|crunch|\bcore\b|halo|roda abdominal|ab ?wheel|calcanhar/i,['Core']],
  [/carry|farmer|suitcase|transporte/i,['Core','Costas']],
  [/face ?pull|reverse ?fly|abertura posterior|pull-?apart|prone|eleva[çc][ãa]o em y|posterior/i,['Ombros','Costas']],
  [/eleva[çc][ãa]o lateral|lateral raise/i,['Ombros']],
  [/tr[íi]ceps|skull|kickback|mergulho|\bdip/i,['Tríceps']],
  [/curl|b[íi]ceps/i,['Bíceps']],
  [/hip ?thrust|ponte|bridge|gl[úu]teo|abdu[çc]/i,['Glúteos']],
  [/\brdl\b|romanian|peso morto|deadlift|good ?morning|dobradi[çc]a|hinge/i,['Posteriores da coxa','Glúteos']],
  [/pullover|puxada|pulldown|pull-?up|chin-?up|remada|\brow\b|barra fixa/i,['Costas','Bíceps']],
  [/supino|bench|flex[õo]es|push-?up|press de peito|chest|crucifixo|\bfly\b|peck/i,['Peito','Tríceps']],
  [/press|ombro|shoulder|overhead|militar/i,['Ombros','Tríceps']],
  [/agachamento|squat|afundo|lunge|split|b[úu]lgaro|bulgarian|step-?up|leg ?press|extens[ãa]o de perna|leg ?extension|passada/i,['Quadríceps','Glúteos']]
 ];
 const catalogue=()=>typeof module==='object'&&module.exports?require('../data/exercise-catalog.js'):root.TreinoCatalogData;
 function definition(exercise){
  const data=catalogue();if(!data)return null;
  const key=typeof exercise.exerciseKey==='string'&&exercise.exerciseKey.startsWith('catalog:')?exercise.exerciseKey.slice(8).split(':')[0]:null;
  return data.exercises.find(e=>e.id===exercise.libraryId)||data.exercises.find(e=>e.id===key)||null;
 }
 // Returns the muscles worked and where that answer came from, so the report can say when it is an estimate.
 function musclesOf(exercise){
  const own=Array.isArray(exercise.muscles)?exercise.muscles.filter(m=>typeof m==='string'&&m):[];
  if(own.length)return {muscles:own,source:'catalog'};
  const found=definition(exercise);
  if(found?.muscles?.length)return {muscles:[...found.muscles],source:'library'};
  const name=typeof exercise.name==='string'?exercise.name:'';
  const rule=BY_NAME.find(([pattern])=>pattern.test(name));
  return rule?{muscles:[...rule[1]],source:'name'}:{muscles:[],source:null};
 }
 const isMobility=exercise=>(exercise.pattern||definition(exercise)?.pattern)==='mobility';
 const band=(muscle,goal)=>(TARGETS[goal]||TARGETS.muscle)[MAJOR.includes(muscle)?'major':'small'];
 const round=value=>Math.round(value*10)/10;
 /* plans: the sessions of one week (mobility sessions excluded by the caller or by pattern). */
 function weeklyVolume(plans,{goal='muscle'}={}){
  const totals=new Map(),unknown=[],estimatedNames=[];let sets=0;
  for(const plan of Array.isArray(plans)?plans:[]){
   for(const exercise of Array.isArray(plan?.exercises)?plan.exercises:[]){
    const count=Number(exercise.sets);
    if(!Number.isFinite(count)||count<=0||isMobility(exercise))continue;
    sets+=count;
    const {muscles,source}=musclesOf(exercise);
    if(!muscles.length){unknown.push(exercise.name||'Exercício sem nome');continue;}
    if(source==='name')estimatedNames.push(exercise.name||'Exercício sem nome');
    muscles.forEach((muscle,index)=>{
     const entry=totals.get(muscle)||{muscle,effective:0,direct:0,sessions:new Set()};
     entry.effective+=index===0?count:count*0.5;
     if(index===0){entry.direct+=count;entry.sessions.add(plan.id||plan.name||'');}
     totals.set(muscle,entry);
    });
   }
  }
  const rows=[...totals.values()].map(entry=>{
   const [low,high]=band(entry.muscle,goal),effective=round(entry.effective);
   return {muscle:entry.muscle,effective,direct:round(entry.direct),sessions:entry.sessions.size,low,high,
    major:MAJOR.includes(entry.muscle),status:effective<low?'low':effective>high?'high':'ok'};
  }).sort((a,b)=>b.effective-a.effective||ORDER.indexOf(a.muscle)-ORDER.indexOf(b.muscle));
  const missing=MAJOR.filter(muscle=>!totals.has(muscle));
  const estimated=[...new Set(estimatedNames)];
  return {rows,missing,unknown:[...new Set(unknown)],estimated,totalSets:round(sets),goal,
   peak:rows.reduce((max,row)=>Math.max(max,row.effective,row.high),0)};
 }
 const api={MAJOR,SMALL,ORDER,TARGETS,musclesOf,weeklyVolume};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.TreinoVolume=api;
})(typeof window!=='undefined'?window:globalThis);
