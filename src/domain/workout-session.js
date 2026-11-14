/* Explicit execution copies isolate performed work from future prescriptions. */
(function(root){
 const node=typeof module==='object'&&module.exports,records=node?require('./workout-records.js'):root.TreinoRecords;
 const copy=value=>JSON.parse(JSON.stringify(value));
 function hasValues(draft){return !!draft&&(!!draft.editHistoryId||!!draft.note||Object.values(draft.rows||{}).some(rows=>records.hasValues(rows)));}
 function start(document,{planId,uid,date,week,now,limit}){
  const next=copy(document),source=next.plans.find(p=>p.id===planId);if(!source)throw Error('A ficha já não está disponível.');
  if(source.sessionOnly)return {document:next,selectedPlanId:source.id};
  const pending=next.plans.find(p=>p.sessionOnly&&p.executionSourceId===source.id&&next.drafts[p.id]&&!next.drafts[p.id].editHistoryId);
  if(pending){if(hasValues(next.drafts[source.id]))throw Error('Existem duas sessões preenchidas para esta ficha. Guarda a sessão em curso antes de iniciar outra.');return {document:next,selectedPlanId:pending.id};}
  if(next.plans.length>=256)throw Error('Limite de fichas atingido. Exporta e revê o arquivo antes de iniciar outra sessão.');
  const session={...copy(source),id:uid(),sessionOnly:true,executionSourceId:source.id,primary:false,sourceExact:false};
  if(Number.isInteger(limit)&&limit>0&&limit<session.exercises.length){
   if(hasValues(next.drafts[source.id]))throw Error('Esta ficha já tem valores preenchidos. Guarda ou descarta antes de começar um treino curto.');
   session.exercises=session.exercises.slice(0,limit);
   session.name=source.name+' · curto';
   session.duration='';
  }
  const draft=copy(next.drafts[source.id]||{date,note:'',rows:{}});
  if(source.course){const courseWeek=week??source.course.week;if(!Number.isInteger(courseWeek)||courseWeek<1||courseWeek>12)throw Error('Semana do programa inválida.');draft.courseWeek||=courseWeek;}
  for(const e of session.exercises){e.exerciseKey||=records.exerciseKey(e,source.id);e.loadReference||=records.loadReference(e);draft.rows[e.id]||=Array.from({length:e.sets},()=>({kg:'',reps:'',done:false}));}
  if(Number.isFinite(now)&&now>0&&!draft.editHistoryId&&!Number.isFinite(draft.startedAt)){draft.startedAt=now;draft.pausedMs=0;}
  next.plans.push(session);next.drafts[session.id]=draft;delete next.drafts[source.id];next.minClientBuild=records.CLIENT_BUILD;
  return {document:next,selectedPlanId:session.id};
 }
 function prepareEditor(document,options){
  const plan=document.plans.find(p=>p.id===options.planId);if(!plan||plan.sessionOnly)throw Error('Escolhe a ficha original para editar as próximas sessões.');
  if(hasValues(document.drafts[plan.id]))return {...start(document,options),selectedPlanId:plan.id};
  return {document:copy(document),selectedPlanId:plan.id};
 }
 function reorder(document,{planId,exerciseId,offset}){
  if(![-1,1].includes(offset))throw Error('Direção inválida.');
  const next=copy(document),plan=next.plans.find(p=>p.id===planId);if(!plan||plan.sessionOnly)throw Error('Escolhe uma ficha para reordenar.');
  if(hasValues(next.drafts[planId]))throw Error('Retoma ou guarda a sessão preenchida antes de alterar a ordem da ficha.');
  const from=plan.exercises.findIndex(e=>e.id===exerciseId),to=from+offset;if(from<0||to<0||to>=plan.exercises.length)throw Error('Não é possível deslocar esse exercício.');
  [plan.exercises[from],plan.exercises[to]]=[plan.exercises[to],plan.exercises[from]];plan.userModified=true;return {document:next,selectedPlanId:plan.id};
 }
 const api={start,prepareEditor,reorder,hasValues};if(node)module.exports=api;else root.TreinoSessions=api;
})(typeof window!=='undefined'?window:globalThis);
