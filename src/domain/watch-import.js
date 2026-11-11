/* Apple Watch summaries arrive through an iPhone Shortcut as URL parameters.
 * Nothing is fetched: the page only parses, matches and stores what the person confirms. */
(function(root){
 const LIMITS={minutes:[1,600],kcal:[0,5000],hr:[30,250]};
 const MAX_AGE_MS=3*24*60*60*1000;
 const localDate=time=>{const d=new Date(time);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 // Shortcuts may emit "2026-11-11T19:02:13+00:00", "2026-11-11T19:02:13Z" or "2026-11-11 19:02:13 +0000".
 // A literal "+" in the URL arrives as a space, so an unsigned offset is read as positive.
 function parseTime(value){
  if(typeof value!=='string'||value.length>40)return NaN;
  const match=value.trim().match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)\s*(Z|[+-]?\d{2}:?\d{2})?$/i);
  if(!match)return NaN;
  let zone=match[3]||'';
  if(zone&&zone.toUpperCase()!=='Z'){const sign=/^[+-]/.test(zone)?zone[0]:'+',digits=zone.replace(/[^\d]/g,'');zone=sign+digits.slice(0,2)+':'+digits.slice(2);}
  return Date.parse(match[1]+'T'+match[2]+(zone.toUpperCase()==='Z'?'Z':zone));
 }
 function number(value,[min,max]){
  if(value===null||value===undefined||String(value).trim()==='')return undefined;
  const parsed=Number(String(value).trim().replace(',','.').replace(/[^\d.]/g,''));
  return Number.isFinite(parsed)&&parsed>=min&&parsed<=max?Math.round(parsed):NaN;
 }
 // Accepts "#watch?start=…&end=…&kcal=…&hr=…" (or the query string alone).
 function parse(fragment,now=Date.now()){
  const raw=String(fragment||'');const at=raw.indexOf('watch?');if(at<0)return null;
  const params=new URLSearchParams(raw.slice(at+6));
  const start=parseTime(params.get('start')),end=parseTime(params.get('end'));
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return {error:'O Atalho não enviou o início e o fim do treino num formato válido.'};
  if(end>now+5*60*1000||now-end>MAX_AGE_MS)return {error:'Este treino do Apple Watch não é recente. Abre o Atalho logo depois de terminares o treino.'};
  const minutes=number(String(Math.round((end-start)/60000)),LIMITS.minutes),kcal=number(params.get('kcal'),LIMITS.kcal),hr=number(params.get('hr'),LIMITS.hr);
  if(Number.isNaN(minutes))return {error:'A duração do treino do Apple Watch está fora do intervalo aceite.'};
  if(Number.isNaN(kcal)||Number.isNaN(hr))return {error:'As calorias ou a frequência cardíaca recebidas não são válidas.'};
  const watch={start:new Date(start).toISOString(),end:new Date(end).toISOString(),minutes};
  if(kcal!==undefined)watch.kcal=kcal;if(hr!==undefined)watch.hr=hr;
  return {watch,date:localDate(start)};
 }
 // Candidates: a session in progress on that day first, then saved sessions of that day, closest to the end time.
 function candidates(doc,{watch,date}){
  const plans=Array.isArray(doc?.plans)?doc.plans:[],drafts=doc?.drafts||{},end=Date.parse(watch.end),list=[];
  for(const plan of plans){const draft=drafts[plan.id];if(plan.sessionOnly&&draft&&!draft.editHistoryId&&draft.date===date)list.push({kind:'draft',id:plan.id,label:'Sessão em curso · '+plan.name,distance:0});}
  for(const h of Array.isArray(doc?.history)?doc.history:[])if(h&&h.date===date)list.push({kind:'history',id:h.id,label:h.planName,distance:Number.isFinite(h.savedAt)?Math.abs(h.savedAt-end):Number.MAX_SAFE_INTEGER,existing:!!h.watch});
  return list.sort((a,b)=>(a.kind==='draft'?0:1)-(b.kind==='draft'?0:1)||a.distance-b.distance);
 }
 // Mutates the chosen draft or record in a copy of the document.
 function apply(doc,{kind,id},watch){
  const next=JSON.parse(JSON.stringify(doc)),value=JSON.parse(JSON.stringify(watch));
  const target=kind==='draft'?next.drafts?.[id]:next.history?.find(h=>h.id===id);
  if(!target)throw Error('A sessão escolhida já não existe.');
  target.watch=value;if(value.minutes<=240)target.duration=String(value.minutes);
  return next;
 }
 function valid(watch){
  if(watch===undefined)return true;
  if(!watch||typeof watch!=='object'||Array.isArray(watch))return false;
  const keys=Object.keys(watch);if(keys.some(key=>!['start','end','minutes','kcal','hr'].includes(key)))return false;
  if(typeof watch.start!=='string'||typeof watch.end!=='string'||watch.start.length>40||watch.end.length>40||!Number.isFinite(Date.parse(watch.start))||!Number.isFinite(Date.parse(watch.end)))return false;
  const inRange=(key,required)=>watch[key]===undefined?!required:Number.isInteger(watch[key])&&watch[key]>=LIMITS[key][0]&&watch[key]<=LIMITS[key][1];
  return inRange('minutes',true)&&inRange('kcal',false)&&inRange('hr',false);
 }
 const api={parse,candidates,apply,valid,parseTime};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.TreinoWatch=api;
})(typeof window!=='undefined'?window:globalThis);
