/* Deterministic general programme rules. Editorial catalogue; no private plans. */
(function(root){
 const VERSION=2;
 const evidence=typeof module==='object'&&module.exports?require('./src/data/program-rules.js'):root.TreinoRuleEvidence;
 const GOALS={weight_loss:'Perder peso',strength:'Ganhar força',muscle:'Ganhar massa muscular',mobility:'Melhorar mobilidade',fitness:'Melhorar condição física'};
 const catalogue=typeof module==='object'&&module.exports?require('./src/data/exercise-catalog.js'):root.TreinoCatalogData;
 const EQUIPMENT={...catalogue.EQUIPMENT,machines:'Máquinas / polias',mat:'Tapete'};
 const MACHINE_EQUIPMENT=Object.fromEntries(Object.entries(EQUIPMENT).filter(([key])=>/^(machine_|cable_)/.test(key)));
 const QUESTIONNAIRE_EQUIPMENT=Object.fromEntries(Object.entries(EQUIPMENT).filter(([key])=>!MACHINE_EQUIPMENT[key]));
 const MUSCLES=['Peito','Ombros','Bíceps','Tríceps','Costas','Core','Glúteos','Quadríceps','Posteriores da coxa','Gémeos'];
 const DAYS=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
 const library=catalogue.exercises;
 const copy=x=>JSON.parse(JSON.stringify(x));
 function reconcileGoals(goals,primaryGoal,changedField=''){
  const selected=[...new Set((Array.isArray(goals)?goals:[]).filter(g=>Object.hasOwn(GOALS,g)))];
  let primary=Object.hasOwn(GOALS,primaryGoal)?primaryGoal:'';
  if(changedField==='goals'&&!selected.includes(primary))primary=selected[0]||'';
  else if(primary&&!selected.includes(primary))selected.push(primary);
  if(!primary&&selected.length)primary=selected[0];
  return {goals:selected,primaryGoal:primary};
 }
 function profileErrors(p,complete=true){
  if(!p||typeof p!=='object'||Array.isArray(p))return ['Questionário inválido.'];
  const errors=[];
  if(typeof p.name!=='string'||p.name.length>80)errors.push('Indica um nome até 80 caracteres.');
  if(complete&&!p.name?.trim())errors.push('Indica o teu nome de apresentação.');
  if(!Array.isArray(p.goals)||p.goals.some(g=>!GOALS[g])||new Set(p.goals).size!==p.goals.length)errors.push('Objetivos inválidos.');
  if(complete&&(!p.goals?.length||!p.goals.includes(p.primaryGoal)))errors.push('Escolhe objetivos e uma prioridade entre eles.');
  if(!['beginner','regular','experienced'].includes(p.experience))errors.push('Indica a experiência.');
  if(![1,2,3,4].includes(p.days)||!Number.isInteger(p.minutes)||p.minutes<20||p.minutes>60||![4,8,12].includes(p.weeks))errors.push('Escolhe 1–4 dias, 20–60 minutos e 4, 8 ou 12 semanas.');
  if(!['home','gym','outdoors','mixed'].includes(p.location))errors.push('Indica onde vais treinar.');
  if(!Array.isArray(p.equipment)||p.equipment.some(e=>!EQUIPMENT[e])||new Set(p.equipment).size!==p.equipment.length)errors.push('Material inválido.');
  if(p.machineInventory!==undefined&&(!Array.isArray(p.machineInventory)||p.machineInventory.some(key=>!MACHINE_EQUIPMENT[key])||new Set(p.machineInventory).size!==p.machineInventory.length))errors.push('Identifica apenas as máquinas disponíveis.');
  if(p.overheadClearance!==undefined&&!['standing','lowered','none'].includes(p.overheadClearance))errors.push('Confirma o espaço acima da cabeça.');
  if(!Array.isArray(p.preferredDays)||p.preferredDays.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(p.preferredDays).size!==p.preferredDays.length)errors.push('Dias inválidos.');
  if(complete&&p.preferredDays?.length&&p.preferredDays.length!==p.days)errors.push('O número de dias escolhidos deve corresponder aos dias por semana.');
  if(!['morning','afternoon','evening','flexible'].includes(p.time)||!['rest','mobility','walk'].includes(p.intervals))errors.push('Disponibilidade inválida.');
  for(const k of ['adult','limits','lowCeiling','walkingSpace','consent'])if(typeof p[k]!=='boolean')errors.push('Respostas em falta.');
  for(const k of ['notes','avoided'])if(typeof p[k]!=='string'||p[k].length>1500)errors.push('Notas demasiado longas.');
  for(const k of ['weight','height','dumbbellMax','barbellMax'])if(typeof p[k]!=='string'||p[k].length>10||(p[k]!==''&&(!Number.isFinite(Number(p[k]))||Number(p[k])<=0||Number(p[k])>1000)))errors.push('Medições inválidas.');
  if(complete&&!p.adult)errors.push('O gerador desta versão destina-se a adultos.');
  if(complete&&!p.consent)errors.push('Confirma a gravação privada das respostas para continuar.');
  return [...new Set(errors)];
 }
 const defaults=()=>({name:'',goals:[],primaryGoal:'',experience:'beginner',days:3,minutes:35,weeks:12,location:'home',equipment:[],machineInventory:[],overheadClearance:'standing',preferredDays:[],time:'evening',intervals:'mobility',adult:false,limits:false,lowCeiling:false,walkingSpace:false,consent:false,notes:'',avoided:'',weight:'',height:'',dumbbellMax:'',barbellMax:''});
 function availableEquipment(profile){
  const inventory=[...(profile.equipment||[]).filter(key=>key!=='machines'),...(profile.machineInventory||[])];
  if(inventory.includes('incline_bench'))inventory.push('bench');
  return [...new Set(inventory)];
 }
 function coverageReport(exercises){
  const required=['squat','hinge','push','pull','core'];
  const present=[...new Set(exercises.map(e=>e.pattern==='vertical_pull'?'pull':e.pattern))];
  return {required,present,missing:required.filter(pattern=>!present.includes(pattern))};
 }
 function generate(profile){
  const errors=profileErrors(profile);if(errors.length)return {errors};
  if(profile.limits||profile.avoided.trim())return {errors:['As limitações ou exercícios a evitar precisam de revisão antes de gerar. Guarda o questionário e cria ou importa uma ficha ajustada com apoio profissional.'],reviewRequired:true};
  const beginner=profile.experience==='beginner',inventory=availableEquipment(profile);
  const weighted=inventory.some(key=>key==='dumbbells'||key==='barbell'||/^machine_|^cable_/.test(key));
  const clearance=profile.lowCeiling?'none':profile.overheadClearance||'standing';
  const eligible=library.filter(e=>e.equipment.every(key=>inventory.includes(key))&&
   (profile.experience==='experienced'||e.level!=='experienced')&&
   !(e.overhead&&(clearance==='none'||clearance==='lowered'&&!['seated','kneeling'].includes(e.posture)))&&
   (!e.walking||profile.walkingSpace));
  const pick=ids=>ids.map(id=>eligible.find(e=>e.id===id)).find(Boolean);
  // Editorial preferences per day, kept stable across weeks. Not random selection.
  const squat=[pick(['legpress','goblet','back-squat','squat']),pick(beginner?['legpress','goblet','sit-stand','squat']:['db-reverse-lunge','db-split-squat','front-squat','reverse-lunge','squat']),pick(['db-front-squat','legpress','goblet','back-squat','squat'])];
  const hinge=[pick(['db-rdl','bar-rdl','bridge']),pick(beginner?['db-bridge','bar-rdl','bridge']:['staggered-rdl','bar-hip-thrust','bar-rdl','single-bridge','bridge']),pick(['db-deadlift','bar-rdl','db-bridge','bridge'])];
  const push=[pick(['machine-press','bench-press','bar-bench','floor-press','band-chest-press',beginner?'knee-pushup':'pushup']),pick(['incline-db-press','machine-press','floor-press','bar-bench','band-chest-press',beginner?'knee-pushup':'pushup'])];
  const pull=[pick(['machine-row','chest-supported-row','db-row','bar-row','cable-row','band-row','band-anchor-row']),pick(['lat-pulldown','band-lat','cable-row','db-bent-row','bar-row','machine-row','band-row']),pick(['chest-supported-row','machine-row','db-row','bar-row','band-anchor-row','band-row'])];
  const shoulders=pick(['seated-press','kneeling-press','machine-overhead','standing-db-press','bar-press','band-overhead','lateral-raise','band-pullapart','prone-w']);
  const cores=[pick(['deadbug']),pick(['side-plank-knees','bird-dog']),pick(['plank'])];
  const lunge=pick(['db-split-squat','lunge']),calf=pick(['machine-calf','db-calf','calf']);
  const accessory=pick(['hammer-curl','bar-curl','band-curl','curl']);
  const triceps=pick(['cable-triceps','band-triceps','lying-db-triceps']);
  const patterns=profile.days===4?[[push[0],pull[0],shoulders,accessory,cores[0]],[squat[0],hinge[0],lunge,calf,cores[1]],[pull[1]||pull[0],push[1],shoulders,triceps||accessory,cores[2]],[hinge[1],squat[2],lunge,calf,cores[0]]]:
   [[squat[0],push[0],pull[0],hinge[0],cores[0],...(profile.days===1?[shoulders]:[])],[hinge[1],pull[1]||pull[0],push[1],squat[1],shoulders,cores[1]],[squat[2],pull[2],push[0],hinge[2],shoulders,cores[2]]];
  const schedule=profile.preferredDays.length?profile.preferredDays:[...( {1:[2],2:[0,3],3:[0,2,4],4:[0,1,3,4]}[profile.days])];
  if(profile.days<4&&profile.days>1&&schedule.some(d=>schedule.includes((d+1)%7)))return {errors:['Para sessões de corpo inteiro, escolhe dias com intervalo ou usa quatro dias com divisão superior/inferior.']};
  const used=patterns.slice(0,profile.days),coverage=coverageReport(used.flat().filter(Boolean));
  const warnings=[];
  if(coverage.missing.length)warnings.push('Proposta limitada: sem material para puxar com resistência, o trabalho de costas é insuficiente para um programa equilibrado. Uma elevação em W não substitui uma remada. Revê o material ou adapta a ficha.');
  if(profile.equipment.includes('machines')&&!(profile.machineInventory||[]).length&&!profile.equipment.some(key=>MACHINE_EQUIPMENT[key]))warnings.push('As máquinas não foram identificadas. A seleção usa apenas o restante material declarado; escolhe as máquinas concretas no questionário.');
  if(clearance==='none')warnings.push('A proposta evita press acima da cabeça por falta de altura. Só adicionar sentado ou ajoelhado depois de confirmar a altura livre.');
  if(clearance==='lowered')warnings.push('Press acima da cabeça limitado a variantes sentadas/ajoelhadas cuja altura confirmaste. Não foram selecionados press em pé.');
  if(profile.primaryGoal==='strength'&&!weighted)warnings.push('A progressão usa repetições e controlo. Para aumentar a força com cargas externas, será necessário material adicional.');
  if(profile.days===1)warnings.push('Um dia é um ponto de partida; duas sessões semanais permitem distribuir melhor o trabalho dos grupos musculares.');
  if(profile.notes.trim())warnings.push('As observações livres foram guardadas para tua revisão. Nesta versão não alteram automaticamente a seleção dos exercícios.');
  const weightLoss=profile.goals.includes('weight_loss');
  const notes=[`Prioridade: ${GOALS[profile.primaryGoal]}. ${profile.days} sessões por semana, até ${profile.minutes} minutos.`,'Aquecimento: 4 minutos de marcha leve e ensaio sem carga dos movimentos da sessão.','Termina as séries com cerca de 2–3 repetições possíveis com boa técnica. Se conseguires o topo da faixa em todas as séries, com controlo e boa recuperação em duas sessões, usa o menor aumento de carga disponível. Caso contrário mantém. Não há aumentos obrigatórios por calendário.',weightLoss?'Perder peso: o plano combina treino de força e atividade regular. Caminhadas opcionais nos intervalos, começando com 10–15 minutos a um ritmo em que consigas conversar. A evolução do peso também depende da alimentação; não há promessa de perda localizada nem cálculo automático de calorias.':'Nos intervalos, mantém a atividade e recuperação que toleras.'];
  if(profile.intervals==='mobility')notes.push('Intervalos · mobilidade opcional de 5–8 minutos: uma série de 6–8 movimentos suaves em quatro apoios e uma série de 6–8 movimentos de anca em meio-ajoelhado por lado. Usa amplitude confortável, sem dor. Este bloco é separado do tempo da sessão de força.');
  if(profile.intervals==='walk')notes.push('Intervalos · caminhada opcional de 10–15 minutos a um ritmo em que consigas conversar, num local com espaço. Estes minutos são separados da sessão de força.');
  if(profile.dumbbellMax||profile.barbellMax)notes.push('Respeita a carga máxima do material que declaraste. Quando não houver mais discos disponíveis, trabalha dentro da faixa de repetições e do controlo do movimento; não há obrigação de aumentar peso.');
  const sessions=[];
  for(let week=1;week<=profile.weeks;week++)for(let day=0;day<profile.days;day++){
   const chosen=patterns[day%patterns.length].filter(Boolean).filter((e,i,all)=>all.findIndex(x=>x.id===e.id)===i);
   if(profile.primaryGoal==='mobility')chosen.push(library.find(e=>e.id==='hip-mobility'));
   const light=week%4===0&&week!==profile.weeks,exercises=chosen.map(e=>{
    const strength=profile.primaryGoal==='strength'&&weighted&&!beginner,target=e.unit==='s'?'20–30':e.unit==='steps'?'30':e.pattern==='mobility'?'6–8':strength?'6–10':'8–12';
    const sets=light?1:profile.minutes>=40&&!beginner?3:2;
    return {...copy(e),exerciseKey:'catalog:'+e.id,sets,target,video:'',start:0,note:e.loadReference==='per_dumbbell'?'Regista kg por haltere.':e.loadReference==='barbell_total'?'Regista kg totais, incluindo a barra.':e.loadReference==='machine_stack'?'Regista a carga indicada nesta máquina; não compares kg entre máquinas.':'',noLoad:['bodyweight','unspecified'].includes(e.loadReference),restSeconds:strength?90:60,prescriptionRule:'general-dose-v2'};
   });
   const seconds=e=>e.sets*((e.unit==='s'?30:e.unit==='steps'?45:40)*(e.unilateral?2:1)+e.restSeconds)+35;
   let estimated=()=>240+exercises.reduce((s,e)=>s+seconds(e),0);
   while(estimated()>profile.minutes*60&&exercises.some(e=>e.sets>1)){const most=[...exercises].filter(e=>e.sets>1).sort((a,b)=>seconds(b)-seconds(a))[0];most.sets--;}
   if(estimated()>profile.minutes*60)return {errors:['Não foi possível encaixar uma sessão completa no tempo escolhido. Aumenta os minutos disponíveis.']};
   sessions.push({week,day,weekday:schedule[day],estimatedMinutes:Math.ceil(estimated()/60),light,exercises});
  }
  return {ruleVersion:VERSION,catalogVersion:catalogue.VERSION,coverage,status:coverage.missing.length?'limited':'general',ruleIds:evidence.rules.map(rule=>rule.id),reviewStatus:evidence.reviewStatus,profile:copy(profile),sessions,warnings,notes,weightLoss,createdAt:Date.now(),sources:evidence.sources.map(source=>source.url)};
 }
 function videoId(raw){try{const text=String(raw).trim();if(/^[\w-]{11}$/.test(text))return text;const u=new URL(text);if(!['https:','http:'].includes(u.protocol))return null;const host=u.hostname.replace(/^www\./,'');if(host==='youtu.be')return /^[\w-]{11}$/.test(u.pathname.slice(1))?u.pathname.slice(1):null;if(!['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(host))return null;const id=u.searchParams.get('v')||u.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})/)?.[1];return /^[\w-]{11}$/.test(id||'')?id:null;}catch{return null;}}
 function validExample(e){return !!e&&typeof e.id==='string'&&/^[\w-]{1,100}$/.test(e.id)&&typeof e.name==='string'&&e.name.length>0&&e.name.length<=200&&videoId(e.video)===e.video&&Array.isArray(e.muscles)&&e.muscles.length>0&&e.muscles.every(m=>MUSCLES.includes(m))&&Array.isArray(e.equipment)&&e.equipment.every(x=>EQUIPMENT[x])&&Number.isInteger(e.start)&&e.start>=0&&e.start<=86400&&(e.end===null||(Number.isInteger(e.end)&&e.end>e.start&&e.end<=86400))&&typeof e.note==='string'&&e.note.length<=1500;}
 function validExtras(d){
  if(d.profile&&profileErrors(d.profile.answers,false).length)return false;
  if(d.exerciseExamples&&(!Array.isArray(d.exerciseExamples)||d.exerciseExamples.length>300||!d.exerciseExamples.every(validExample)))return false;
  if(d.programVersions&&(!Array.isArray(d.programVersions)||d.programVersions.length>20||!d.programVersions.every(p=>p&&typeof p.id==='string'&&[4,8,12].includes(p.weeks)&&[1,2,3,4].includes(p.days)&&Array.isArray(p.planIds)&&p.planIds.length<=48)))return false;
  if(d.questionnaireVersions&&(!Array.isArray(d.questionnaireVersions)||d.questionnaireVersions.length>20||!d.questionnaireVersions.every(p=>p&&!profileErrors(p.answers).length)))return false;
  if(d.proposal&&(profileErrors(d.proposal.profile).length||!Array.isArray(d.proposal.sessions)||d.proposal.sessions.length>48||!d.proposal.sessions.every(s=>s&&Number.isInteger(s.week)&&s.week>=1&&s.week<=12&&Array.isArray(s.exercises)&&s.exercises.length<=12&&s.exercises.every(e=>e&&Number.isInteger(e.sets)&&e.sets>=1&&e.sets<=30))))return false;
  if(d.checkIns&&(!Array.isArray(d.checkIns)||d.checkIns.length>104||!d.checkIns.every(c=>c&&typeof c.id==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(c.date)&&['easy','right','hard'].includes(c.effort)&&typeof c.note==='string'&&c.note.length<=1500)))return false;
  if(d.activeProgramWeek!==undefined&&(!Number.isInteger(d.activeProgramWeek)||d.activeProgramWeek<1||d.activeProgramWeek>12))return false;
  return true;
 }
 const api={VERSION,GOALS,EQUIPMENT,QUESTIONNAIRE_EQUIPMENT,MACHINE_EQUIPMENT,MUSCLES,DAYS,library,evidence,availableEquipment,coverageReport,defaults,profileErrors,reconcileGoals,generate,videoId,validExample,validExtras};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.TreinoPrograms=api;
})(typeof window!=='undefined'?window:this);
