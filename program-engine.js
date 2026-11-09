/* Reviewed exercise catalogue and deterministic programme rules. No private plans. */
(function(root){
 const VERSION=1;
 const GOALS={weight_loss:'Perder peso',strength:'Ganhar força',muscle:'Ganhar massa muscular',mobility:'Melhorar mobilidade',fitness:'Melhorar condição física'};
 const EQUIPMENT={dumbbells:'Halteres',barbell:'Barra e discos',bench:'Banco',bands:'Elásticos',machines:'Máquinas',pullup:'Barra de elevações',chair:'Cadeira estável',mat:'Tapete'};
 const MUSCLES=['Peito','Ombros','Bíceps','Tríceps','Costas','Core','Glúteos','Quadríceps','Posteriores da coxa','Gémeos'];
 const DAYS=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
 const library=[
  ['squat','Agachamento com peso corporal','squat',[],['Quadríceps','Glúteos'],'Desce até uma amplitude confortável e mantém os pés apoiados.'],
  ['goblet','Agachamento goblet','squat',['dumbbells'],['Quadríceps','Glúteos'],'Segura um haltere junto ao peito e sobe com controlo.'],
  ['legpress','Leg press','squat',['machines'],['Quadríceps','Glúteos'],'Ajusta o banco e usa uma amplitude controlada, sem bloquear os joelhos.'],
  ['lunge','Afundo estático','squat',[],['Quadríceps','Glúteos'],'Pés afastados, desce na vertical; uma série inclui os dois lados.',true],
  ['bridge','Ponte de glúteos','hinge',[],['Glúteos','Posteriores da coxa'],'Empurra o chão e eleva a bacia sem arquear a lombar.'],
  ['db-rdl','Peso morto romeno com halteres','hinge',['dumbbells'],['Glúteos','Posteriores da coxa'],'Leva a bacia atrás com os pesos junto às pernas. Carga indicada por haltere.'],
  ['bar-rdl','Peso morto romeno com barra','hinge',['barbell'],['Glúteos','Posteriores da coxa'],'Leva a bacia atrás mantendo a barra junto às pernas. Regista kg totais da barra.'],
  ['pushup','Flexão de braços','push',[],['Peito','Tríceps'],'Corpo alinhado; usa a variante de joelhos se necessário.'],
  ['knee-pushup','Flexão de braços com joelhos apoiados','push',[],['Peito','Tríceps'],'Mantém tronco e coxas alinhados e controla a descida.'],
  ['floor-press','Supino no chão com halteres','push',['dumbbells'],['Peito','Tríceps'],'Apoia suavemente os braços no chão e empurra sem perder o controlo. Kg por haltere.'],
  ['bench-press','Supino com halteres','push',['dumbbells','bench'],['Peito','Tríceps'],'Pés apoiados, escápulas estáveis. Regista a carga por haltere.'],
  ['machine-press','Chest press na máquina','push',['machines'],['Peito','Tríceps'],'Ajusta o banco para as pegas ficarem à altura do peito.'],
  ['db-row','Remada com um haltere','pull',['dumbbells'],['Costas','Bíceps'],'Inclina o tronco com controlo e puxa o cotovelo para trás. Kg por haltere; os dois lados contam como uma série.',true],
  ['band-row','Remada sentada com elástico','pull',['bands'],['Costas','Bíceps'],'Passa o elástico pela zona média dos pés, verifica a fixação e puxa junto ao tronco.'],
  ['machine-row','Remada na máquina','pull',['machines'],['Costas','Bíceps'],'Mantém o tronco estável e puxa os cotovelos para trás.'],
  ['prone-w','Elevação em W deitado','pull',[],['Costas','Ombros'],'De barriga para baixo, eleva suavemente os braços em W sem forçar a lombar. Este movimento não equivale a uma remada com carga.'],
  ['seated-press','Shoulder press sentado com halteres','shoulders',['dumbbells','bench'],['Ombros','Tríceps'],'Sentado, empurra os halteres sem arquear a lombar. Confirma que existe altura livre; kg por haltere.'],
  ['kneeling-press','Shoulder press com um haltere em meio-ajoelhado','shoulders',['dumbbells'],['Ombros','Tríceps'],'Um joelho no chão e tronco estável; pressiona um lado de cada vez. Confirma a altura livre.',true],
  ['lateral-raise','Elevação lateral com halteres','shoulders',['dumbbells'],['Ombros'],'Sobe os braços até uma altura confortável, sem encolher os ombros. Kg por haltere.'],
  ['curl','Flexão de cotovelos com halteres','arms',['dumbbells'],['Bíceps'],'Mantém os cotovelos junto ao tronco e evita embalar o peso.'],
  ['calf','Elevação de gémeos','calves',[],['Gémeos'],'Sobe e desce os calcanhares com controlo.'],
  ['deadbug','Dead bug','core',[],['Core'],'Move braço e perna opostos mantendo o tronco estável. Uma série inclui ambos os lados.',true],
  ['bird-dog','Bird dog','core',[],['Core'],'Em quatro apoios, estende braço e perna opostos sem rodar o tronco.',true],
  ['cat-cow','Mobilidade em quatro apoios','mobility',[],['Core'],'Alterna suavemente flexão e extensão, sem forçar os limites.'],
  ['hip-mobility','Mobilidade da anca em meio-ajoelhado','mobility',[],['Glúteos'],'Move a bacia suavemente para a frente, mantendo o tronco alinhado. Sem dor.',true],
 ].map(([id,name,pattern,equipment,muscles,how,unilateral=false])=>({id,name,pattern,equipment,muscles,how,unilateral}));
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
 const defaults=()=>({name:'',goals:[],primaryGoal:'',experience:'beginner',days:3,minutes:35,weeks:12,location:'home',equipment:[],preferredDays:[],time:'evening',intervals:'mobility',adult:false,limits:false,lowCeiling:false,walkingSpace:false,consent:false,notes:'',avoided:'',weight:'',height:'',dumbbellMax:'',barbellMax:''});
 function generate(profile){
  const errors=profileErrors(profile);if(errors.length)return {errors};
  if(profile.limits||profile.avoided.trim())return {errors:['As limitações ou exercícios a evitar precisam de revisão antes de gerar. Guarda o questionário e cria ou importa uma ficha ajustada com apoio profissional.'],reviewRequired:true};
  const has=id=>profile.equipment.includes(id),beginner=profile.experience==='beginner',weighted=has('dumbbells')||has('barbell')||has('machines');
  const pick=ids=>library.find(e=>e.id===ids.find(id=>library.find(x=>x.id===id).equipment.every(has)));
  const squat=pick(['legpress','goblet','squat']),hinge=pick(['db-rdl','bar-rdl','bridge']),push=pick(['machine-press','bench-press','floor-press',beginner?'knee-pushup':'pushup']),pull=pick(['machine-row','db-row','band-row','prone-w']);
  const shoulders=profile.lowCeiling?pick(['lateral-raise','prone-w']):pick(['seated-press','kneeling-press','prone-w']);
  const core=library.find(e=>e.id==='deadbug'),alternate=library.find(e=>e.id==='bird-dog'),lunge=library.find(e=>e.id==='lunge'),calf=library.find(e=>e.id==='calf');
  const patterns=profile.days===4?[[push,pull,shoulders,core],[squat,hinge,lunge,calf,alternate],[pull,push,shoulders,alternate],[hinge,squat,lunge,calf,core]]:[[squat,push,pull,hinge,core],[hinge,pull,push,squat,alternate],[squat,pull,push,hinge,shoulders,core]];
  const schedule=profile.preferredDays.length?profile.preferredDays:[...( {1:[2],2:[0,3],3:[0,2,4],4:[0,1,3,4]}[profile.days])];
  if(profile.days<4&&profile.days>1&&schedule.some(d=>schedule.includes((d+1)%7)))return {errors:['Para sessões de corpo inteiro, escolhe dias com intervalo ou usa quatro dias com divisão superior/inferior.']};
  const warnings=[];if(pull.id==='prone-w')warnings.push('Sem material para puxar, o trabalho de costas é limitado. Um elástico ou haltere permite uma progressão de remada mais completa.');
  if(profile.lowCeiling)warnings.push('A proposta evita press acima da cabeça por falta de altura. Revê qualquer variante sentado ou ajoelhado antes de a adicionar manualmente.');
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
   const chosen=patterns[day%patterns.length].filter((e,i,all)=>all.findIndex(x=>x.id===e.id)===i);
   if(profile.primaryGoal==='mobility')chosen.push(library.find(e=>e.id==='hip-mobility'));
   const light=week%4===0&&week!==profile.weeks,exercises=chosen.map(e=>{
    const strength=profile.primaryGoal==='strength'&&weighted&&!beginner,target=e.pattern==='mobility'?'8':strength?'6–10':'8–12';
    const sets=light?1:profile.minutes>=40&&!beginner?3:2;
    return {...copy(e),sets,target,unit:'reps',video:'',start:0,note:e.equipment.includes('dumbbells')?'Regista kg por haltere.':e.equipment.includes('barbell')?'Regista kg totais, incluindo a barra.':'',noLoad:!e.equipment.some(x=>['dumbbells','barbell','machines'].includes(x)),restSeconds:strength?90:60};
   });
   const seconds=e=>e.sets*((e.unilateral?80:40)+e.restSeconds)+35;
   let estimated=()=>240+exercises.reduce((s,e)=>s+seconds(e),0);
   while(estimated()>profile.minutes*60&&exercises.some(e=>e.sets>1)){const most=[...exercises].filter(e=>e.sets>1).sort((a,b)=>seconds(b)-seconds(a))[0];most.sets--;}
   if(estimated()>profile.minutes*60)return {errors:['Não foi possível encaixar uma sessão completa no tempo escolhido. Aumenta os minutos disponíveis.']};
   sessions.push({week,day,weekday:schedule[day],estimatedMinutes:Math.ceil(estimated()/60),light,exercises});
  }
  return {ruleVersion:VERSION,profile:copy(profile),sessions,warnings,notes,weightLoss,createdAt:Date.now(),sources:['https://acsm.org/resistance-training-guidelines-update-2026/','https://www.cdc.gov/healthy-weight-growth/physical-activity/']};
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
 const api={VERSION,GOALS,EQUIPMENT,MUSCLES,DAYS,library,defaults,profileErrors,reconcileGoals,generate,videoId,validExample,validExtras};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.TreinoPrograms=api;
})(typeof window!=='undefined'?window:this);
