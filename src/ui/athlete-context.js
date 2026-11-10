/* Optional sport fields and user-declared commitments; no automatic sport sessions. */
function setupAthleteContext(form,{initial,onChange}){
 const domain=window.TreinoAthleteContext,c=JSON.parse(JSON.stringify(initial||domain.defaults())),key=activeStorageKey;
 let calendar=c.calendar,editing=null;
 const sections=form.querySelectorAll('.profile-section'),options=(values,value)=>Object.entries(values).map(([id,label])=>`<option value="${esc(id)}" ${id===value?'selected':''}>${esc(label)}</option>`).join('');
 sections[0].querySelector('h2').insertAdjacentHTML('afterend',`<label>Este plano é para<select id="athlete-intent">${options(domain.INTENTS,c.intent)}</select></label><p id="athlete-intent-note" class="auth-note" role="status" hidden>Esta opção permite guardar contexto e organizar o calendário. A geração de preparação especializada ainda não está disponível; o treino deve vir de uma ficha tua ou de um plano revisto pelo teu treinador.</p>`);
 sections[1].insertAdjacentHTML('beforeend',`<section id="athlete-specific" ${c.intent==='general'?'hidden':''}>
  <h3>A tua modalidade</h3><p class="auth-note">Planeamento manual: o treino específico vem de uma ficha tua ou de um plano revisto pelo teu treinador.</p>
  <label>Modalidade principal<select id="athlete-sport"><option value="">Escolhe a modalidade</option>${options(domain.SPORTS,c.sport)}</select></label>
  <label id="athlete-sport-name-label">Qual é a modalidade?<input id="athlete-sport-name" maxlength="80" value="${esc(c.sportName)}"></label>
  <label>Experiência na modalidade<select id="athlete-experience">${options({new:'A começar / a retomar',regular:'Pratico com regularidade',experienced:'Experiente'},c.experience)}</select></label>
  <div id="athlete-event"><h3>Prova / competição</h3><div class="form-grid"><label>Nome da prova · opcional<input id="athlete-event-name" maxlength="120" value="${esc(c.eventName)}"></label><label>Data da prova<input id="athlete-event-date" type="date" value="${esc(c.eventDate)}"></label><label id="athlete-distance-label">Distância da prova · km, opcional<input id="athlete-distance" type="number" min="0" max="2000" step="any" value="${esc(c.distanceKm)}"></label><label>Objetivo da prova · opcional<input id="athlete-event-goal" maxlength="160" placeholder="Ex.: terminar, participar, melhorar o meu tempo" value="${esc(c.eventGoal)}"></label><label id="athlete-time-label">Tempo pretendido · opcional<input id="athlete-target-time" maxlength="12" pattern="[0-9]{1,3}:[0-5][0-9](:[0-5][0-9])?" placeholder="HH:MM ou HH:MM:SS" value="${esc(c.targetTime)}"></label></div><p class="auth-note">A data e o tempo pretendido não produzem automaticamente ritmos, zonas ou uma progressão para cumprir o prazo.</p></div>
  <details><summary>O que tenho feito nas últimas quatro semanas · opcional</summary><div class="form-grid"><label>Sessões habituais por semana<input id="athlete-sessions" type="number" min="0" max="28" step="1" value="${esc(c.sessionsPerWeek)}"></label><label>Minutos habituais por semana<input id="athlete-weekly-minutes" type="number" min="0" max="10080" step="any" value="${esc(c.weeklyMinutes)}"></label><label id="athlete-weekly-km-label">Distância habitual por semana · km<input id="athlete-weekly-km" type="number" min="0" max="5000" step="any" value="${esc(c.weeklyKm)}"></label><label>Sessão mais longa recente · minutos<input id="athlete-longest" type="number" min="0" max="1440" step="any" value="${esc(c.longestMinutes)}"></label></div></details>
 </section>
 <details class="athlete-calendar" id="athlete-calendar" ${c.calendar.length||c.intent!=='general'?'open':''}><summary>Outros treinos, jogos ou saídas</summary><p class="auth-note">Declara as atividades que já fazes fora deste programa. Os dias e minutos de força acima são adicionais. Esta é uma semana habitual, não um registo de atividades realizadas.</p>
 <label class="choice"><input id="athlete-external-plan" type="checkbox" ${c.externalPlan?'checked':''}>Já sigo um plano externo / de treinador</label><label>Notas do plano externo · opcional<textarea id="athlete-external-note" maxlength="1000">${esc(c.externalNote)}</textarea></label>
 <div id="athlete-activities"></div><button class="btn secondary" type="button" id="athlete-add">Adicionar atividade</button>
 <fieldset id="athlete-activity-editor" disabled hidden><legend>Atividade na semana</legend><div class="form-grid"><label>Nome da atividade<input id="activity-name" maxlength="100" required></label><label>Modalidade da atividade<select id="activity-sport">${options(domain.SPORTS,'running')}</select></label><label>Dia da atividade<select id="activity-day">${programs.DAYS.map((day,i)=>`<option value="${i}">${day}</option>`).join('')}</select></label><label>Duração da atividade · minutos<input id="activity-minutes" type="number" min="5" max="600" step="1" required></label><label>Tipo de atividade<select id="activity-kind">${options(domain.KINDS,'technique')}</select></label></div><div class="home-actions"><button class="btn" type="button" id="activity-save">Guardar atividade</button><button class="btn secondary" type="button" id="activity-cancel">Cancelar atividade</button></div></fieldset>
 <p id="athlete-calendar-error" class="auth-message" role="alert" tabindex="-1"></p><label class="choice"><input id="athlete-same-day" type="checkbox" ${c.allowSameDay?'checked':''}>Quero combinar força com outras atividades no mesmo dia e rever essa distribuição na proposta</label>
 </details>`);
 const q=selector=>form.querySelector(selector),current=()=>accountAccess&&activeStorageKey===key&&$('#profile-form')===form;
 function visibility(){
  const specialized=q('#athlete-intent').value!=='general',event=q('#athlete-intent').value==='event',sport=q('#athlete-sport').value,distance=['running','cycling'].includes(sport);
  q('#athlete-specific').hidden=!specialized;q('#athlete-sport').required=specialized;
  q('#athlete-intent-note').hidden=!specialized;
  q('#athlete-sport-name-label').hidden=sport!=='other';q('#athlete-sport-name').required=specialized&&sport==='other';
  q('#athlete-event').hidden=!event;q('#athlete-event-date').required=event;
  q('#athlete-distance-label').hidden=!distance;q('#athlete-weekly-km-label').hidden=!distance;q('#athlete-time-label').hidden=!distance;
  if(specialized)q('#athlete-calendar').open=true;
 }
 q('#athlete-intent').onchange=visibility;q('#athlete-sport').onchange=visibility;visibility();
 function fail(message){const box=q('#athlete-calendar-error');box.textContent=message;box.focus();}
 function render(){
  q('#athlete-activities').innerHTML=calendar.length?calendar.map(item=>`<article class="athlete-activity"><div><strong>${esc(item.name)}</strong><p>${programs.DAYS[item.weekday]} · ${item.minutes} min · ${esc(domain.SPORTS[item.sport])} · ${esc(domain.KINDS[item.kind])}</p></div><div class="home-actions"><button class="mini" type="button" data-activity-edit="${esc(item.id)}" aria-label="Editar atividade ${esc(item.name)}">Editar</button><button class="mini" type="button" data-activity-remove="${esc(item.id)}" aria-label="Remover atividade ${esc(item.name)}">Remover</button></div></article>`).join(''):'<p class="auth-note">Ainda não declaraste outras atividades.</p>';
  q('#athlete-add').disabled=editing!==null;
  form.querySelectorAll('[data-activity-edit]').forEach(button=>{button.disabled=editing!==null;button.onclick=()=>open(calendar.find(item=>item.id===button.dataset.activityEdit));});
  form.querySelectorAll('[data-activity-remove]').forEach(button=>{button.disabled=editing!==null;button.onclick=()=>{if(!current())return;calendar=calendar.filter(item=>item.id!==button.dataset.activityRemove);render();onChange();};});
 }
 function open(item){
  if(!current())return;if(!item&&calendar.length>=21)return fail('Limite de 21 atividades na semana. Revê as existentes.');
  editing=item?.id||'';const editor=q('#athlete-activity-editor');editor.hidden=false;editor.disabled=false;
  q('#activity-name').value=item?.name||'';q('#activity-sport').value=item?.sport||q('#athlete-sport').value||'running';q('#activity-day').value=item?.weekday??0;q('#activity-minutes').value=item?.minutes||'';q('#activity-kind').value=item?.kind||'technique';
  q('#athlete-calendar-error').textContent='';render();q('#activity-name').focus();
 }
 function close(){editing=null;q('#athlete-activity-editor').hidden=true;q('#athlete-activity-editor').disabled=true;q('#athlete-calendar-error').textContent='';render();}
 q('#athlete-add').onclick=()=>open();q('#activity-cancel').onclick=()=>{close();q('#athlete-add').focus();};
 q('#activity-save').onclick=()=>{
  if(!current())return;
  const inputs=Array.from(q('#athlete-activity-editor').querySelectorAll('input,select'));if(inputs.some(input=>!input.checkValidity()))return fail('Indica o nome e uma duração entre 5 e 600 minutos, em número inteiro.');
  const item={id:editing||uid(),name:q('#activity-name').value.trim(),sport:q('#activity-sport').value,weekday:Number(q('#activity-day').value),minutes:Number(q('#activity-minutes').value),kind:q('#activity-kind').value};
  const next=editing?calendar.map(before=>before.id===editing?item:before):[...calendar,item];if(!domain.valid({...domain.defaults(),calendar:next}))return fail('Revê a atividade; os dados anteriores mantêm-se.');
  calendar=next;close();onChange();q('#athlete-add').focus();
 };
 render();
 return {
  read(){return {version:1,intent:q('#athlete-intent').value,sport:q('#athlete-sport').value,sportName:q('#athlete-sport-name').value,experience:q('#athlete-experience').value,eventName:q('#athlete-event-name').value,eventDate:q('#athlete-event-date').value,distanceKm:q('#athlete-distance').value,eventGoal:q('#athlete-event-goal').value,targetTime:q('#athlete-target-time').value,weeklyMinutes:q('#athlete-weekly-minutes').value,weeklyKm:q('#athlete-weekly-km').value,sessionsPerWeek:q('#athlete-sessions').value,longestMinutes:q('#athlete-longest').value,externalPlan:q('#athlete-external-plan').checked,externalNote:q('#athlete-external-note').value,allowSameDay:q('#athlete-same-day').checked,calendar:JSON.parse(JSON.stringify(calendar))};},
  pending(){return editing!==null;},
  reveal(field){if(q('#athlete-specific').contains(field))q('#athlete-specific').hidden=false;if(q('#athlete-event').contains(field))q('#athlete-event').hidden=false;for(const id of ['athlete-sport-name-label','athlete-distance-label','athlete-weekly-km-label','athlete-time-label'])if(q('#'+id).contains(field))q('#'+id).hidden=false;const details=field.closest('details');if(details)details.open=true;},
  pendingField(){return q('#activity-name');}
 };
}
function athleteWeekHTML(context,sessions=[]){
 const domain=window.TreinoAthleteContext,week=domain.week(context,sessions);
 return `<details class="proposal-help athlete-week"><summary>Semana completa · ${week.totalMinutes} min planeados / declarados</summary><p class="auth-note">Força: ${week.strengthSessions} sessões, ${week.strengthMinutes} min estimados. Outras atividades: ${week.externalSessions}, ${week.externalMinutes} min declarados. Não é uma pontuação de carga nem uma recomendação de volume.</p><div class="athlete-week-days">${week.days.map(day=>`<section><h4>${programs.DAYS[day.weekday]}</h4>${day.strength.map(item=>`<p>Força · ${item.estimatedMinutes} min estimados</p>`).join('')}${day.external.map(item=>`<p>${esc(item.name)} · ${item.minutes} min · ${esc(domain.KINDS[item.kind])}</p>`).join('')}${!day.strength.length&&!day.external.length?'<p>Sem atividade declarada</p>':''}</section>`).join('')}</div>${week.conflicts.length?`<p class="overview-rule">Força e outras atividades coincidem: ${week.conflicts.map(day=>programs.DAYS[day]).join(', ')}. Revê a distribuição; o calendário não altera as fichas.</p>`:''}</details>`;
}
function athleteHomeHTML(active,week){
 const context=state.profile?.answers?.athlete;if(!context||context.intent==='general'&&!context.calendar.length)return '';
 const answers=state.questionnaireVersions?.find(item=>item.id===active?.questionnaireId)?.answers,schedule=answers?programs.scheduleDays(answers):[];
 const sessions=active?state.plans.filter(p=>p.program?.id===active.id&&p.program.week===week&&!p.sessionOnly).map(p=>({weekday:p.program.weekday??schedule[p.program.day],estimatedMinutes:window.TreinoReplacement.estimate(p)})).filter(item=>Number.isInteger(item.weekday)):[];
 return `<section class="program-intro"><h2>Modalidade e calendário</h2><p class="athlete-context-title">${esc(window.TreinoAthleteContext.INTENTS[context.intent])}${context.sport?' · '+esc(window.TreinoAthleteContext.SPORTS[context.sport]):''}${context.eventName?' · '+esc(context.eventName):''}${context.eventDate?' · '+esc(context.eventDate):''}</p>${athleteWeekHTML(context,sessions)}<p class="auth-note">Mostra o contexto atual e o programa ativo. Alterar o calendário não altera o programa nem os registos. Fichas manuais sem dia atribuído não entram automaticamente nesta semana.</p><button class="btn secondary" id="home-calendar">Rever calendário</button></section>`;
}
