/* Pure proposal editing and programme revision. No performed values are copied. */
(function(root){
 const node=typeof module==='object'&&module.exports;
 const programs=node?require('../../program-engine.js'):root.TreinoPrograms;
 const catalog=node?require('./exercise-catalog.js'):root.TreinoExerciseCatalog;
 const records=node?require('./workout-records.js'):root.TreinoRecords;
 const replacement=node?require('./exercise-replacement.js'):root.TreinoReplacement;
 const copy=value=>JSON.parse(JSON.stringify(value));
 const id=value=>typeof value==='string'&&/^[\w-]{1,100}$/.test(value)&&!['__proto__','prototype','constructor'].includes(value);
 const text=(value,max)=>typeof value==='string'&&value.length<=max;
 const fields=['name','exerciseKey','libraryId','proposalSlot','unit','loadReference','noLoad','sets','target','restSeconds','video','start','note','how','equipment','muscles','pattern','direction','unilateral','overhead','posture','walking'];
 const compact=e=>Object.fromEntries(fields.filter(key=>e[key]!==undefined).map(key=>[key,copy(e[key])]));
 const planShape=plan=>({name:plan.name,note:plan.note,description:plan.description||'',warmup:plan.warmup||'',exercises:plan.exercises.map(e=>compact({...e,libraryId:e.libraryId||e.id,exerciseKey:records.exerciseKey(e,plan.id)}))});
 function validExercise(e){
  return e&&!['rows','kg','reps','done'].some(key=>Object.hasOwn(e,key))&&id(e.id)&&text(e.name,200)&&e.name.trim()&&Number.isInteger(e.sets)&&e.sets>=1&&e.sets<=30&&text(e.target,60)&&['reps','s','steps'].includes(e.unit)&&
   text(e.video,11)&&(!e.video||programs.videoId(e.video)===e.video)&&Number.isInteger(e.start)&&e.start>=0&&e.start<=86400&&text(e.note,2000)&&
   (e.restSeconds===undefined||Number.isInteger(e.restSeconds)&&e.restSeconds>=0&&e.restSeconds<=600)&&
   (e.proposalSlot===undefined||id(e.proposalSlot))&&Array.isArray(e.equipment)&&e.equipment.every(x=>text(x,100))&&Array.isArray(e.muscles)&&e.muscles.every(x=>text(x,100));
 }
 function valid(proposal){
  try{
   if(!proposal||programs.profileErrors(proposal.profile).length||!programs.athlete.support(proposal.profile.athlete).available||!Number.isInteger(proposal.ruleVersion)||proposal.ruleVersion<1||proposal.ruleVersion>programs.VERSION||!Array.isArray(proposal.sessions)||proposal.sessions.length!==proposal.profile.days*proposal.profile.weeks)return false;
   if(!Array.isArray(proposal.notes)||proposal.notes.length>30||!proposal.notes.every(x=>text(x,2000))||!Array.isArray(proposal.warnings)||proposal.warnings.length>50||!proposal.warnings.every(x=>text(x,2000))||!Array.isArray(proposal.sources)||proposal.sources.length>20||!proposal.sources.every(x=>text(x,2000)))return false;
   if(proposal.generatedSessions!==undefined&&!Array.isArray(proposal.generatedSessions))return false;
   for(const sessions of [proposal.sessions,...(proposal.generatedSessions?[proposal.generatedSessions]:[])]){
   if(sessions.length!==proposal.profile.days*proposal.profile.weeks)return false;
   const seen=new Set();
   for(const s of sessions){
    const key=s.week+':'+s.day;
    if(!Number.isInteger(s.week)||s.week<1||s.week>proposal.profile.weeks||!Number.isInteger(s.day)||s.day<0||s.day>=proposal.profile.days||seen.has(key)||!Number.isInteger(s.weekday)||s.weekday<0||s.weekday>6||typeof s.light!=='boolean'||(s.label!==undefined&&!text(s.label,80))||!Array.isArray(s.exercises)||!s.exercises.length||s.exercises.length>12||!s.exercises.every(validExercise))return false;
    const slots=s.exercises.filter(e=>e.proposalSlot!==undefined).map(e=>e.proposalSlot);if(new Set(slots).size!==slots.length)return false;seen.add(key);
   }
   }
   return true;
  }catch{return false;}
 }
 function prepare(proposal){
  if(!valid(proposal))throw Error('A proposta guardada não é compatível. Conserva uma cópia e volta a gerar a partir do questionário.');
  const next=copy(proposal);
  for(const s of next.sessions)s.exercises.forEach((e,i)=>{e.proposalSlot||='day-'+s.day+'-slot-'+i;e.exerciseKey||='catalog:'+(e.libraryId||e.id);e.loadReference=records.loadReference(e);});
  return next;
 }
 function summary(proposal){
  const p=prepare(proposal),inventory=programs.availableEquipment(p.profile),issues=[];
  for(const s of p.sessions){
   s.estimatedMinutes=replacement.estimate({exercises:s.exercises});
   if(s.estimatedMinutes>p.profile.minutes)issues.push({week:s.week,day:s.day,message:'Ultrapassa os '+p.profile.minutes+' minutos do perfil ('+s.estimatedMinutes+' min estimados).'});
   for(const e of s.exercises){
    if(!e.target.trim())issues.push({week:s.week,day:s.day,message:e.name+': falta definir o objetivo das séries.',blocking:true});
    const definition=catalog.exercises.find(x=>x.id===(e.libraryId||e.id))||e;
    if(!catalog.compatibleWith(definition,inventory,p.profile))issues.push({week:s.week,day:s.day,message:e.name+': confirma material e espaço; não corresponde ao perfil.'});
   }
  }
  const coverage=programs.coverageReport(p.sessions.filter(s=>s.week===1).flatMap(s=>s.exercises).map(e=>catalog.exercises.find(definition=>definition.id===(e.libraryId||e.id))||e));
  const calendar=programs.athlete.week(p.profile.athlete,p.sessions.filter(s=>s.week===1));
  if(calendar.conflicts.length&&!calendar.allowSameDay)issues.push({message:'Os dias de força coincidem com atividades do calendário. Revê os dias ou confirma essa combinação no questionário.',blocking:true});
  if(coverage.missing.length)issues.push({message:'Faltam funções gerais no plano: '+coverage.missing.map(key=>({squat:'pernas',hinge:'anca',push:'empurrar',pull:'puxar',core:'controlo do tronco'})[key]).join(', ')+'. Revê os exercícios antes de treinar.'});
  p.adjustmentWarnings=[...new Set(issues.map(issue=>issue.message))];
  p.coverage=coverage;p.status=coverage.missing.length?'limited':'general';
  return {proposal:p,issues};
 }
 function change(proposal,action){
  const next=prepare(proposal),sessions=next.sessions.filter(s=>s.day===action.day);
  if(!sessions.length)throw Error('Escolhe uma sessão válida.');
  next.generatedSessions||=copy(next.sessions);
  let definition;
  if(['add','replace'].includes(action.type)){
   definition=action.definition;
   if(!definition||(!definition.personal&&!id(definition.id))||definition.personal&&!text(definition.id,200))throw Error('Escolhe um exercício do catálogo ou da tua biblioteca.');
  }
  for(const s of sessions){
   const index=s.exercises.findIndex(e=>e.proposalSlot===action.slot),before=s.exercises[index];
   if(action.type!=='add'&&index<0)throw Error('A proposta mudou. Abre novamente a sessão.');
   if(action.type==='remove'){
    if(s.exercises.length===1)throw Error('Mantém pelo menos um exercício na sessão.');s.exercises.splice(index,1);
   }else if(action.type==='move'){
    if(![-1,1].includes(action.offset))throw Error('Escolhe a direção da alteração.');
    const target=index+action.offset;if(target<0||target>=s.exercises.length)continue;
    [s.exercises[index],s.exercises[target]]=[s.exercises[target],s.exercises[index]];
   }else if(['dose','replace','add'].includes(action.type)){
    const dose=action.dose;
    if(!dose||!Number.isInteger(dose.sets)||dose.sets<1||dose.sets>30||!text(dose.target,60)||!dose.target.trim()||!Number.isInteger(dose.restSeconds)||dose.restSeconds<0||dose.restSeconds>600||!text(dose.video,11)||dose.video&&programs.videoId(dose.video)!==dose.video||!Number.isInteger(dose.start)||dose.start<0||dose.start>86400)throw Error('Revê as séries, objetivo, descanso e vídeo.');
    let exercise=before;
    if(action.type!=='dose'){
     const slot=action.type==='replace'?before.proposalSlot:action.newSlot;exercise=catalog.instantiate(definition,definition.personal?'personal-'+slot:definition.id);exercise.proposalSlot=slot;
     if(!id(exercise.proposalSlot))throw Error('Não foi possível criar a ocorrência do exercício.');
    }
    // A chosen dose applies to normal weeks; scheduled light weeks stay reduced.
    Object.assign(exercise,{sets:s.light?1:dose.sets,target:dose.target,restSeconds:dose.restSeconds,video:dose.video,start:dose.start});
    if(action.type==='replace')s.exercises[index]=exercise;
    if(action.type==='add'){if(s.exercises.length>=12)throw Error('Limite de 12 exercícios por sessão.');s.exercises.push(exercise);}
   }else throw Error('Alteração não suportada.');
  }
  next.personalized=true;
  if(!valid(next))throw Error('Não foi possível validar a alteração; a proposta anterior foi preservada.');
  return summary(next).proposal;
 }
 function ready(proposal){
  const result=summary(proposal);
  if(result.proposal.profile.limits||result.proposal.profile.avoided.trim())throw Error('As limitações declaradas precisam de revisão antes de ativar uma proposta automática.');
  if(result.issues.some(i=>i.blocking))throw Error([...new Set(result.issues.filter(issue=>issue.blocking).map(issue=>issue.message))].join(' '));
  return result;
 }
 function createPlans(proposal,programId,uid){
  return proposal.sessions.map(s=>({id:uid(),name:`Semana ${s.week} · ${String.fromCharCode(65+s.day)} — ${s.label||programs.GOALS[proposal.profile.primaryGoal]}`,note:proposal.notes.join('\n\n'),kind:'Programa pessoal',duration:s.estimatedMinutes+' min estimados',warmup:'4 minutos: marcha leve e ensaio dos movimentos sem carga.',description:programs.DAYS[s.weekday]+(s.light?' · semana de volume reduzido':''),program:{id:programId,week:s.week,day:s.day,weekday:s.weekday,ruleVersion:proposal.ruleVersion},exercises:s.exercises.map(e=>({...copy(e),id:uid(),libraryId:e.libraryId||(catalog.exercises.some(x=>x.id===e.id)?e.id:undefined)}))}));
 }
 const evidence=p=>({ruleVersion:p.ruleVersion,catalogVersion:p.catalogVersion,ruleIds:p.ruleIds||[],sources:p.sources||[],reviewStatus:p.reviewStatus||'editorial_not_independently_reviewed',coverage:p.coverage,warnings:[...new Set([...(p.warnings||[]),...(p.adjustmentWarnings||[])])]});
 function activate(document,proposal,{uid,now=Date.now()}={}){
  const p=ready(proposal).proposal,next=copy(document);
  if((next.programVersions||[]).length>=20||(next.questionnaireVersions||[]).length>=20)throw Error('Limite de 20 programas/questionários atingido. Os dados anteriores mantêm-se.');
  if(next.plans.length+p.sessions.length>256)throw Error('Este programa excede o limite de fichas. Exporta e revê os planos existentes.');
  const programId=uid(),questionnaireId=uid(),plans=createPlans(p,programId,uid),baselines=createPlans({...p,sessions:p.generatedSessions||p.sessions},programId,()=> 'baseline');
  next.questionnaireVersions||=[];next.questionnaireVersions.push({id:questionnaireId,createdAt:now,answers:copy(p.profile)});
  next.programVersions||=[];next.programVersions.push({id:programId,createdAt:now,questionnaireId,...evidence(p),weeks:p.profile.weeks,days:p.profile.days,goal:p.profile.primaryGoal,planIds:plans.map(plan=>plan.id),planBaselines:Object.fromEntries(plans.map((plan,i)=>[plan.id,planShape(baselines[i])]))});
  next.plans.push(...plans);next.activeProgram=programId;next.activeProgramWeek=1;next.courseEnabled=false;delete next.proposal;
  return {document:next,selectedPlanId:plans[0].id};
 }
 function revisionPreview(document,proposal,{fromWeek=1,policy='keep'}={}){
  const p=ready(proposal).proposal,active=document.programVersions?.find(v=>v.id===document.activeProgram);
  if(!active)throw Error('Não há um programa gerado ativo para atualizar. Podes ativar um programa novo.');
  if(active.days!==p.profile.days||active.weeks!==p.profile.weeks)throw Error('Para mudar o número de dias ou semanas, cria um programa novo. As fichas atuais mantêm-se.');
  if(!Number.isInteger(fromWeek)||fromWeek<1||fromWeek>active.weeks||!['keep','replace'].includes(policy))throw Error('Escolhe a semana e o tratamento das fichas personalizadas.');
  const updates=[],kept=[],unchanged=[];
  const templates=createPlans(p,active.id,()=> 'preview'),baselines=createPlans({...p,sessions:p.generatedSessions||p.sessions},active.id,()=> 'baseline');
  const busy=planId=>Object.values(document.drafts[planId]?.rows||{}).some(rows=>records.hasValues(rows));
  for(const plan of document.plans.filter(plan=>plan.program?.id===active.id&&!plan.sessionOnly&&plan.program.week>=fromWeek)){
   const template=templates.find(candidate=>candidate.program.week===plan.program.week&&candidate.program.day===plan.program.day);
   let reason='';
   if(document.history.some(h=>h.planId===plan.id))reason='Já tem uma sessão guardada';
   else if(busy(plan.id)||document.plans.some(session=>session.executionSourceId===plan.id&&busy(session.id)))reason='Tem séries preenchidas numa sessão em curso';
   else if(!template)reason='Sem ficha correspondente na nova proposta';
   const baseline=active.planBaselines?.[plan.id],personalized=!baseline||JSON.stringify(planShape(plan))!==JSON.stringify(baseline);
   if(!reason&&personalized&&policy==='keep')reason=baseline?'Personalizações mantidas':'Sem base original para comparar; ficha atual mantida';
   if(reason){const conflicts=plan.exercises.filter(e=>{const definition=catalog.exercises.find(x=>x.id===e.libraryId)||e;return !Array.isArray(definition.equipment)||!catalog.compatibleWith(definition,programs.availableEquipment(p.profile),p.profile);}).map(e=>e.name);kept.push({id:plan.id,name:plan.name,reason,personalized,conflicts});continue;}
   if(JSON.stringify(planShape(plan))===JSON.stringify(planShape(template))){unchanged.push({id:plan.id,name:plan.name});continue;}
   updates.push({id:plan.id,name:plan.name,personalized,before:planShape(plan),after:planShape(template),template,baselineTemplate:baselines.find(b=>b.program.week===plan.program.week&&b.program.day===plan.program.day)});
  }
  return {programId:active.id,fromWeek,policy,updates,kept,unchanged,proposal:p};
 }
 function regenerate(document,proposal,options,{uid,now=Date.now()}={}){
  const preview=revisionPreview(document,proposal,options),next=copy(document),active=next.programVersions.find(v=>v.id===preview.programId);
  if(!preview.updates.length)throw Error('Não há fichas para alterar com estas opções. As personalizações e registos mantêm-se.');
  if((active.revisions||[]).length>=20)throw Error('Limite de 20 revisões deste programa atingido.');
  active.planBaselines||={};
  for(const update of preview.updates){
   const index=next.plans.findIndex(plan=>plan.id===update.id),replacement=copy(update.template);
   replacement.id=update.id;replacement.exercises.forEach(e=>{e.id=uid()});
   next.plans[index]=replacement;delete next.drafts[update.id];active.planBaselines[update.id]=planShape(update.baselineTemplate);
  }
  if((next.questionnaireVersions||[]).length>=20)throw Error('Limite de 20 questionários guardados atingido. Os dados anteriores mantêm-se.');
  const questionnaireId=uid();next.questionnaireVersions||=[];next.questionnaireVersions.push({id:questionnaireId,createdAt:now,answers:copy(preview.proposal.profile)});
  active.revisions||=[];active.revisions.push({id:uid(),createdAt:now,fromWeek:preview.fromWeek,policy:preview.policy,...evidence(preview.proposal),questionnaireId,updatedPlanIds:preview.updates.map(x=>x.id),keptPlanIds:preview.kept.map(x=>x.id)});
  delete next.proposal;
  return {document:next,updated:preview.updates.length};
 }
 function recoverEdits(previous,current){
  const old=prepare(previous),next=prepare(current);
  if(old.profile.days!==next.profile.days||old.profile.weeks!==next.profile.weeks)throw Error('As propostas têm números de dias ou semanas diferentes. Os ajustes anteriores continuam guardados na cópia completa; precisam de adaptação manual.');
  next.generatedSessions||=copy(next.sessions);
  const changedDays=new Set(old.sessions.filter(s=>{
   const baseline=old.generatedSessions?.find(b=>b.day===s.day&&b.week===s.week);
   return !baseline||JSON.stringify(s.exercises.map(compact))!==JSON.stringify(baseline.exercises.map(compact));
  }).map(s=>s.day));
  for(const session of next.sessions)if(changedDays.has(session.day))session.exercises=copy(old.sessions.find(s=>s.day===session.day&&s.week===session.week).exercises);
  next.personalized=true;
  return summary(next).proposal;
 }
 function validVersions(versions=[]){
  try{return versions.every(v=>{
   if(v.planBaselines!==undefined){
    if(!v.planBaselines||typeof v.planBaselines!=='object'||Array.isArray(v.planBaselines)||Object.keys(v.planBaselines).length>48)return false;
    for(const [key,shape]of Object.entries(v.planBaselines)){
     if(!id(key)||!text(shape?.name,100)||!text(shape?.note,2000)||!text(shape.description,2000)||!text(shape.warmup,2000)||!Array.isArray(shape.exercises)||shape.exercises.length>100||!shape.exercises.every(e=>validExercise({...e,id:'baseline'})))return false;
    }
   }
   return v.revisions===undefined||Array.isArray(v.revisions)&&v.revisions.length<=20&&v.revisions.every(r=>r&&id(r.id)&&Number.isFinite(r.createdAt)&&Number.isInteger(r.fromWeek)&&r.fromWeek>=1&&r.fromWeek<=v.weeks&&['keep','replace'].includes(r.policy)&&id(r.questionnaireId)&&['updatedPlanIds','keptPlanIds'].every(key=>Array.isArray(r[key])&&r[key].length<=48&&r[key].every(id)));
  });}catch{return false;}
 }
 const api={valid,prepare,summary,change,ready,activate,revisionPreview,regenerate,planShape,validVersions,recoverEdits};
 if(node)module.exports=api;else root.TreinoProposal=api;
})(typeof window!=='undefined'?window:globalThis);
