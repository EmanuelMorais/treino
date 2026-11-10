/* Declared sport context and weekly commitments, not a sport prescription engine. */
(function(root){
 const INTENTS={general:'Condição física geral',complement:'Complementar o meu desporto',event:'Preparar uma prova / competição'};
 const SPORTS={running:'Corrida',cycling:'Ciclismo',padel:'Padel',other:'Outra modalidade'};
 const KINDS={easy:'Leve / recuperação',hard:'Intenso',long:'Longo',match:'Jogo / competição',technique:'Técnica / habitual'};
 const defaults=()=>({version:1,intent:'general',sport:'',sportName:'',experience:'new',eventName:'',eventDate:'',distanceKm:'',eventGoal:'',targetTime:'',weeklyMinutes:'',weeklyKm:'',sessionsPerWeek:'',longestMinutes:'',externalPlan:false,externalNote:'',allowSameDay:false,calendar:[]});
 const text=(value,max)=>typeof value==='string'&&value.length<=max;
 const number=(value,max)=>text(value,12)&&(value===''||Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=max);
 const date=value=>value===''||/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
 function valid(context){
  if(context===undefined)return true;
  if(!context||context.version!==1||!Object.hasOwn(INTENTS,context.intent)||!(context.sport===''||Object.hasOwn(SPORTS,context.sport))||!['new','regular','experienced'].includes(context.experience))return false;
  if(!text(context.sportName,80)||!text(context.eventName,120)||!text(context.eventGoal,160)||!text(context.externalNote,1000)||!text(context.eventDate,10)||!date(context.eventDate)||!text(context.targetTime,12)||(context.targetTime&&!/^\d{1,3}:[0-5]\d(?::[0-5]\d)?$/.test(context.targetTime)))return false;
  if(!number(context.distanceKm,2000)||!number(context.weeklyMinutes,10080)||!number(context.weeklyKm,5000)||!number(context.sessionsPerWeek,28)||context.sessionsPerWeek!==''&&!Number.isInteger(Number(context.sessionsPerWeek))||!number(context.longestMinutes,1440))return false;
  if(!['externalPlan','allowSameDay'].every(key=>typeof context[key]==='boolean')||!Array.isArray(context.calendar)||context.calendar.length>21)return false;
  const ids=new Set();
  for(const item of context.calendar){
   if(!item||!text(item.id,100)||!/^[\w-]+$/.test(item.id)||['__proto__','constructor','prototype'].includes(item.id)||ids.has(item.id)||!Object.hasOwn(SPORTS,item.sport)||!Object.hasOwn(KINDS,item.kind)||!text(item.name,100)||!item.name.trim()||!Number.isInteger(item.weekday)||item.weekday<0||item.weekday>6||!Number.isInteger(item.minutes)||item.minutes<5||item.minutes>600)return false;
   ids.add(item.id);
  }
  return true;
 }
 function errors(context,{complete=false}={}){
  if(!valid(context))return ['Revê os dados da modalidade e do calendário.'];
  if(!context||!complete)return [];
  const errors=[];
  if(context.intent!=='general'&&!context.sport)errors.push('Escolhe a modalidade principal.');
  if(context.sport==='other'&&!context.sportName.trim())errors.push('Indica a modalidade.');
  if(context.intent==='event'&&!context.eventDate)errors.push('Indica a data da prova / competição.');
  return errors;
 }
 function support(context){
  if(!valid(context))return {available:false,message:'Os dados da modalidade são inválidos.'};
  if(!context||context.intent==='general')return {available:true};
  return {available:false,message:'A geração especializada para '+(SPORTS[context.sport]||'esta modalidade')+' ainda não está disponível. O contexto e o calendário podem ser guardados; usa uma ficha própria ou um plano revisto pelo teu treinador. Um programa geral não é um plano de '+(context.intent==='event'?'prova.':'preparação específica.')};
 }
 function week(context,sessions=[]){
  if(!valid(context))throw Error('Calendário inválido.');
  const c=context||defaults(),days=Array.from({length:7},(_,weekday)=>({weekday,external:c.calendar.filter(item=>item.weekday===weekday).map(item=>({...item})),strength:sessions.filter(item=>item.weekday===weekday).map(item=>({...item}))}));
  const externalMinutes=c.calendar.reduce((sum,item)=>sum+item.minutes,0),strengthMinutes=sessions.reduce((sum,item)=>sum+(Number(item.estimatedMinutes)||0),0);
  return {days,externalMinutes,strengthMinutes,totalMinutes:externalMinutes+strengthMinutes,externalSessions:c.calendar.length,strengthSessions:sessions.length,conflicts:days.filter(day=>day.external.length&&day.strength.length).map(day=>day.weekday),allowSameDay:c.allowSameDay};
 }
 const api={INTENTS,SPORTS,KINDS,defaults,valid,errors,support,week};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.TreinoAthleteContext=api;
})(typeof window!=='undefined'?window:globalThis);
