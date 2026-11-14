/* Programme sequence and session clock. Pure rules; the UI decides what to render. */
(function(root){
 const DEFAULT_SESSIONS=['A','B','C'];
 const sessionsOf=course=>Array.isArray(course?.sessions)&&course.sessions.length?course.sessions.slice():DEFAULT_SESSIONS.slice();
 const optionalOf=course=>Array.isArray(course?.optional)?course.optional:[];
 const requiredOf=course=>sessionsOf(course).filter(s=>!optionalOf(course).includes(s));
 const weeksOf=course=>Array.isArray(course?.weeks)&&course.weeks.length?course.weeks.length:12;
 function planId(course,week,session){return session==='M'?course.prefix+'-mobility':`${course.prefix}-w${String(week).padStart(2,'0')}-${session}`;}
 const rowHasValue=row=>!!row&&(row.done===true||String(row.kg??'')!==''||String(row.reps??'')!=='');
 const draftHasValues=draft=>!!draft&&!draft.editHistoryId&&(!!draft.note||Object.values(draft.rows||{}).some(rows=>Array.isArray(rows)&&rows.some(rowHasValue)));
 const belongs=(course,plan)=>!!plan&&plan.course?.version===course.version&&typeof plan.id==='string'&&plan.id.startsWith(course.prefix+'-')&&plan.course.session!=='M';
 function after(course,week,session){
  const sessions=sessionsOf(course),index=sessions.indexOf(session);
  if(index<0)return {week,session:sessions[0],finished:false};
  if(index<sessions.length-1)return {week,session:sessions[index+1],finished:false};
  if(week<weeksOf(course))return {week:week+1,session:sessions[0],finished:false};
  return {week,session,finished:true};
 }
 // Order: a started session first, then the session after the latest saved one (partial counts), else the first.
 function next(doc,course){
  const plans=Array.isArray(doc?.plans)?doc.plans:[],drafts=doc?.drafts||{};
  const source=id=>plans.find(p=>p.id===id&&!p.sessionOnly);
  const running=plans.find(p=>p.sessionOnly&&drafts[p.id]&&!drafts[p.id].editHistoryId&&belongs(course,source(p.executionSourceId)));
  if(running){const plan=source(running.executionSourceId);return {week:drafts[running.id].courseWeek||plan.course.week,session:plan.course.session,planId:plan.id,resume:true,finished:false};}
  const filled=plans.find(p=>!p.sessionOnly&&belongs(course,p)&&draftHasValues(drafts[p.id]));
  if(filled)return {week:filled.course.week,session:filled.course.session,planId:filled.id,resume:true,finished:false};
  const latest=(Array.isArray(doc?.history)?doc.history:[])
   .filter(h=>h&&h.course?.version===course.version&&h.course.session!=='M'&&typeof h.planId==='string'&&h.planId.startsWith(course.prefix+'-'))
   .sort((a,b)=>String(b.date).localeCompare(String(a.date))||(b.savedAt||0)-(a.savedAt||0))[0];
  const first={week:1,session:sessionsOf(course)[0],finished:false};
  const target=latest?after(course,latest.course.week,latest.course.session):first;
  const id=planId(course,target.week,target.session);
  if(source(id))return {...target,planId:id,resume:false};
  const fallback=plans.find(p=>belongs(course,p));
  return fallback?{week:fallback.course.week,session:fallback.course.session,planId:fallback.id,resume:false,finished:false}:null;
 }
 function counts(doc,course){
  const plans=(Array.isArray(doc?.plans)?doc.plans:[]).filter(p=>!p.sessionOnly&&belongs(course,p));
  const done=new Set((Array.isArray(doc?.history)?doc.history:[]).filter(h=>h&&h.complete===true).map(h=>h.planId));
  return {total:requiredOf(course).length*weeksOf(course),available:plans.length,complete:plans.filter(p=>done.has(p.id)&&!optionalOf(course).includes(p.course.session)).length};
 }
 // An optional session can be skipped: the sequence continues after it.
 function skip(course,step){
  if(!step||step.resume||!optionalOf(course).includes(step.session))return null;
  const target=after(course,step.week,step.session);
  return target.finished?null:{...target,planId:planId(course,target.week,target.session),resume:false};
 }
 // The account's chosen programme, if it has plans; otherwise the newest programme with plans.
 function pick(doc,courses,requested){
  const list=Array.isArray(courses)?courses:[],plans=Array.isArray(doc?.plans)?doc.plans:[];
  const has=course=>plans.some(p=>!p.sessionOnly&&p.course?.version===course.version&&typeof p.id==='string'&&p.id.startsWith(course.prefix+'-'));
  const chosen=list.find(course=>course.version===requested);
  if(chosen&&has(chosen))return chosen;
  return [...list].reverse().find(has)||chosen||list[list.length-1]||null;
 }
 function available(doc,courses){const plans=Array.isArray(doc?.plans)?doc.plans:[];return (Array.isArray(courses)?courses:[]).filter(course=>plans.some(p=>!p.sessionOnly&&p.course?.version===course.version&&typeof p.id==='string'&&p.id.startsWith(course.prefix+'-')));}
 // Session clock: wall-clock timestamps survive locking, reloads and other devices.
 const isTime=value=>Number.isFinite(value)&&value>0;
 function clockElapsed(draft,now){
  if(!draft||!isTime(draft.startedAt))return 0;
  const end=isTime(draft.pausedAt)?draft.pausedAt:now,paused=Number.isFinite(draft.pausedMs)&&draft.pausedMs>0?draft.pausedMs:0;
  return Math.max(0,Math.floor((end-draft.startedAt-paused)/1000));
 }
 function clockStart(draft,now){if(!isTime(draft.startedAt)){draft.startedAt=now;draft.pausedMs=0;delete draft.pausedAt;}return draft;}
 function clockToggle(draft,now){
  if(!isTime(draft.startedAt))return clockStart(draft,now);
  if(isTime(draft.pausedAt)){draft.pausedMs=(Number.isFinite(draft.pausedMs)?draft.pausedMs:0)+Math.max(0,now-draft.pausedAt);delete draft.pausedAt;}
  else draft.pausedAt=now;
  return draft;
 }
 // Back to zero and running, so a clock left going by mistake can be fixed mid-session.
 function clockReset(draft,now){
  if(!draft)return draft;
  if(!isTime(now)){delete draft.startedAt;delete draft.pausedAt;delete draft.pausedMs;return draft;}
  draft.startedAt=now;draft.pausedMs=0;delete draft.pausedAt;
  return draft;
 }
 function clockMinutes(draft,now){const seconds=clockElapsed(draft,now);return seconds?Math.min(240,Math.max(1,Math.round(seconds/60))):0;}
 function validClock(draft){
  if(!draft)return true;
  for(const key of ['startedAt','pausedAt'])if(draft[key]!==undefined&&!isTime(draft[key]))return false;
  if(draft.pausedMs!==undefined&&!(Number.isFinite(draft.pausedMs)&&draft.pausedMs>=0))return false;
  if(draft.pausedAt!==undefined&&draft.startedAt===undefined)return false;
  return true;
 }
 const api={sessionsOf,optionalOf,planId,after,next,skip,pick,available,counts,clockElapsed,clockStart,clockToggle,clockReset,clockMinutes,validClock};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.TreinoCourse=api;
})(typeof window!=='undefined'?window:globalThis);
