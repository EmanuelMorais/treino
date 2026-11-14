// Personal records and the load curve, per exercise, from saved sessions only.
function recordExercises(){
 const seen=new Map();
 for(const session of state.history)for(const logged of session.exercises||[]){
  const key=logged.exerciseKey||logged.name;
  if(!seen.has(key))seen.set(key,{key,name:logged.name,sample:logged,sessions:0,last:session.date});
  const entry=seen.get(key);entry.sessions++;
  if(session.date>entry.last){entry.last=session.date;entry.name=logged.name;}
 }
 return [...seen.values()].sort((a,b)=>b.sessions-a.sessions||a.name.localeCompare(b.name,'pt'));
}

// A plain line of the heaviest set per session; dates are spaced evenly, not by time,
// because what matters here is the sequence of sessions.
function loadChartHTML(points){
 if(points.length<2)return '<p class="auth-note">Faz este exercício pelo menos duas vezes para veres a curva.</p>';
 const kgs=points.map(p=>p.kg),min=Math.min(...kgs),max=Math.max(...kgs),span=max-min||1;
 const W=300,H=96,pad=6;
 const x=i=>pad+i*(W-pad*2)/(points.length-1);
 const y=kg=>H-pad-((kg-min)/span)*(H-pad*2);
 const line=points.map((p,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ');
 const dots=points.map((p,i)=>`<circle cx="${x(i).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="3"><title>${esc(dateLabel(p.date))} · ${p.kg} kg × ${p.reps||'—'}</title></circle>`).join('');
 return `<div class="load-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Carga mais pesada por sessão, de ${min} a ${max} quilos"><path d="${line}"/>${dots}</svg>
  <div class="load-chart-scale"><span>${min} kg</span><span>${max} kg</span></div>
  <p class="auth-note">${points.length} sessões · da mais antiga à mais recente</p></div>`;
}

function recordsSectionHTML(){
 const list=recordExercises();
 if(!list.length)return '';
 const chosen=list.find(e=>e.key===state.recordExercise)||list[0];
 const best=window.TreinoProgression.best(state.history,chosen.sample);
 const points=window.TreinoProgression.series(state.history,chosen.sample);
 return `<section class="panel records-panel"><div class="balance-top"><h2>Recordes por exercício</h2></div>
  <label class="program-select">Exercício<select id="record-exercise">${list.map(e=>`<option value="${esc(e.key)}"${e.key===chosen.key?' selected':''}>${esc(e.name)} · ${e.sessions}×</option>`).join('')}</select></label>
  <div class="stats records-stats"><div class="stat"><strong>${best.heaviest?esc(best.heaviest.kg)+' kg':'—'}</strong><span>${best.heaviest?'Série mais pesada · '+esc(best.heaviest.reps)+' reps · '+dateLabel(best.heaviest.date):'Sem carga registada'}</span></div>
  <div class="stat"><strong>${best.volume?new Intl.NumberFormat('pt-PT').format(best.volume.total)+' kg':'—'}</strong><span>${best.volume?'Melhor volume de uma sessão · '+dateLabel(best.volume.date):'Sem volume registado'}</span></div>
  <div class="stat"><strong>${chosen.sessions}</strong><span>Sessões com este exercício</span></div></div>
  ${loadChartHTML(points)}</section>`;
}

function bindRecords(){
 const select=$('#record-exercise');if(!select)return;
 select.onchange=()=>{state.recordExercise=select.value;persist();renderHistory();};
}
