/* View state stays on this device. Session data remains in the private document. */
let workoutView=null;
function showWorkoutView(mode){const p=getPlan();workoutView={key:activeStorageKey,id:p.id,mode};renderPlans();}
function adoptWorkoutCommand(command,mode){
 if(!validState(command.document))throw Error('Não foi possível validar a alteração. Os dados anteriores mantêm-se.');
 const before=state;state=command.document;if(!persist()){state=before;throw Error('Não foi possível guardar. A ficha anterior mantém-se.');}
 selectedPlan=command.selectedPlanId;workoutView={key:activeStorageKey,id:selectedPlan,mode};closeModal();renderPlans();
}
function startWorkoutSession(){
 if(!accountAccess)return;try{adoptWorkoutCommand(window.TreinoSessions.start(state,{planId:getPlan().id,uid,date:today(),week:courseWeek(getPlan()),now:Date.now()}),'session');requestWakeLock();}catch(error){toast(error.message);}
}
function openWorkoutEditor(){
 if(!accountAccess)return;const p=getPlan(),id=p.executionSourceId||p.id;
 try{adoptWorkoutCommand(window.TreinoSessions.prepareEditor(state,{planId:id,uid,date:today(),week:courseWeek(getPlan())}),'edit');}catch(error){toast(error.message);}
}
function renderPlans(){
 if(!accountAccess)return;const p=getPlan();if(!p)return renderHome();selectedPlan=p.id;
 if(!p.sessionOnly&&state.drafts[p.id]?.editHistoryId)return startWorkoutSession();
 if(!workoutView||workoutView.key!==activeStorageKey||workoutView.id!==p.id)workoutView={key:activeStorageKey,id:p.id,mode:p.sessionOnly||state.drafts[p.id]?.editHistoryId?'session':p.exercises.length?'overview':'edit'};
 if(workoutView.mode==='session')return renderWorkoutSession(p);
 if(workoutView.mode==='edit')return renderWorkoutEditor(p);
 renderWorkoutOverview(p);
}
function workoutNavigation(){return '<div class="home-actions workout-nav"><button class="btn secondary" id="workout-home">← Os meus treinos</button><button class="btn secondary" id="other-plans">Arquivo de planos</button></div>';}
function bindWorkoutNavigation(){
 $('#workout-home').onclick=()=>{selectedPlan='';workoutView=null;setView('plans');};$('#other-plans').onclick=otherPlans;
}
function workoutMetadata(p){return `<details class="proposal-help"><summary>Orientações e origem da ficha</summary><p>${esc(p.note)}</p>${p.progression?`<p>${esc(p.progression)}</p>`:''}${p.provenance?`<p>${esc(p.provenance)}</p>`:''}${isCurrentCourse(p)?sourceComparison(p):''}</details>`;}
function renderWorkoutOverview(p){
 const pending=state.plans.find(s=>s.sessionOnly&&s.executionSourceId===p.id&&state.drafts[s.id])||window.TreinoSessions.hasValues(state.drafts[p.id]);
 $('#content').innerHTML=heading(esc(p.name),'Revê o treino e começa quando estiveres pronto.')+workoutNavigation()+`
  <section class="panel workout-overview"><p>${p.exercises.length} exercícios · ${esc(p.duration||'Duração ajustável')}</p>${p.warmup?`<p class="visible-warmup"><b>Aquecimento:</b> ${esc(p.warmup)}</p>`:''}
  <ol class="workout-prescription">${p.exercises.map(e=>`<li><b>${esc(e.name)}</b><span>${e.sets} × ${esc(targetLabel(e))}${Number.isFinite(e.restSeconds)?' · '+e.restSeconds+'s descanso':''}</span></li>`).join('')}</ol>
  <div class="home-actions"><button class="btn" id="start-session">${pending?'Retomar sessão':'Começar sessão'}</button><button class="btn secondary" id="workout-edit">Editar ficha</button></div>${workoutMetadata(p)}</section>
  ${isCurrentCourse(p)?`<details class="panel proposal-help"><summary>Semanas e detalhes do programa</summary>${courseBoard(p)}<div class="plan-tabs">${courseTabs(p)}</div></details>`:''}`;
 bindWorkoutNavigation();$('#start-session').onclick=startWorkoutSession;$('#workout-edit').onclick=openWorkoutEditor;if(isCurrentCourse(p))bindCourse(p);
}
function renderWorkoutEditor(p){
 if(p.sessionOnly)return showWorkoutView('session');
 $('#content').innerHTML=heading('Editar ficha','As alterações aplicam-se às próximas sessões desta ficha. Uma sessão já iniciada conserva os seus exercícios e valores.')+workoutNavigation()+`
  <section class="panel"><label>Nome do treino<input class="plan-name" id="plan-name" maxlength="100" value="${esc(p.name)}"></label>
  <details class="proposal-help"><summary>Notas, cópia e exportação</summary><label>Notas e orientações do plano<textarea id="plan-notes" maxlength="2000">${esc(p.note)}</textarea></label><div class="home-actions"><button class="btn secondary" id="duplicate-plan">Duplicar este treino</button><button class="btn secondary" id="export-plan">Exportar só este plano</button></div></details>
  <div class="proposal-exercises">${p.exercises.map((e,i)=>`<article class="proposal-exercise" data-plan-exercise="${esc(e.id)}"><h3>${esc(e.name)}</h3><p>${e.sets} × ${esc(targetLabel(e))} · ${Number.isFinite(e.restSeconds)?e.restSeconds+'s descanso':'descanso ajustável'}</p><div class="proposal-exercise-actions"><button class="btn secondary" data-edit="${esc(e.id)}">Editar</button><button class="btn secondary" data-plan-swap="${esc(e.id)}">Trocar</button><button class="mini" data-ref="${esc(e.id)}">${e.video?'▶ Ver demonstração':'Pesquisar demonstração ↗'}</button><button class="mini" data-plan-move="${esc(e.id)}" data-offset="-1" aria-label="Subir ${esc(e.name)}" ${i===0?'disabled':''}>↑</button><button class="mini" data-plan-move="${esc(e.id)}" data-offset="1" aria-label="Descer ${esc(e.name)}" ${i===p.exercises.length-1?'disabled':''}>↓</button><button class="mini" data-remove="${esc(e.id)}" aria-label="Retirar ${esc(e.name)}">Retirar</button></div></article>`).join('')||'<p>Pesquisa por nome, zona muscular ou material para adicionar o primeiro exercício.</p>'}</div>
  <div class="home-actions"><button class="btn secondary" id="add-exercise">Adicionar exercício</button><button class="btn" id="workout-done">Concluir edição</button></div><p class="auth-note">Guardado ao alterar. Não há campos de registo de séries neste editor.</p></section>`;
 bindWorkoutNavigation();$('#workout-done').onclick=()=>showWorkoutView('overview');$('#plan-name').oninput=event=>{const name=event.target.value.trim();if(name){p.name=name;persist();}};$('#plan-notes').oninput=event=>{p.note=event.target.value;persist();};$('#add-exercise').onclick=()=>openExercisePicker();
 $('#export-plan').onclick=exportCurrentPlan;$('#duplicate-plan').onclick=()=>{if(state.plans.length>=256)return toast('Limite de 256 treinos atingido.');const next=window.TreinoRecords.portablePlan(p);next.id=uid();next.name=(p.name+' · cópia').slice(0,100);next.exercises.forEach(e=>e.id=uid());state.plans.push(next);selectedPlan=next.id;persist();showWorkoutView('edit');};
 bindExercises();document.querySelectorAll('[data-plan-move]').forEach(button=>button.onclick=()=>{try{adoptWorkoutCommand(window.TreinoSessions.reorder(state,{planId:p.id,exerciseId:button.dataset.planMove,offset:Number(button.dataset.offset)}),'edit');}catch(error){toast(error.message);}});
 document.querySelectorAll('[data-plan-swap]').forEach(button=>button.onclick=()=>swapPlanExercise(p.exercises.find(e=>e.id===button.dataset.planSwap)));
}
function swapPlanExercise(before){
 const plan=getPlan(),key=activeStorageKey;
 openExercisePicker({replacing:before,onChoose:definition=>{
  if(!accountAccess||key!==activeStorageKey||getPlan()?.id!==plan.id)return;
  const replacement=window.TreinoExerciseCatalog.instantiate(definition,uid());
  replacement.sets=before.sets;replacement.restSeconds=before.restSeconds;
  replacement.target=before.unit===replacement.unit&&!/%|1rm/i.test(before.target)?before.target:'';
  exerciseForm(replacement,'',{replaceId:before.id});
 }});
}
function sessionClockHTML(p,d){
 if(d.editHistoryId)return '';
 const started=Number.isFinite(d.startedAt),paused=Number.isFinite(d.pausedAt),core=Number.isInteger(p.coreMinutes)&&p.coreMinutes>0?p.coreMinutes:0;
 return `<div class="session-clock" id="session-clock" data-core="${core}" role="timer" aria-label="Tempo de sessão"><span class="eyebrow">${paused?'Sessão em pausa':'Tempo de sessão'}</span><b id="session-clock-time">${formatTime(window.TreinoCourse.clockElapsed(d,Date.now()))}</b><span class="session-rest" id="session-rest" hidden>Descanso <b id="session-rest-time"></b><button class="mini" id="session-rest-skip">Saltar</button></span>${core?`<span class="session-clock-core" id="session-clock-core" hidden>Núcleo feito (${core} min) · os extras são opcionais</span>`:''}<button class="mini" id="session-clock-toggle">${!started?'Iniciar cronómetro':paused?'Retomar':'Pausar'}</button><div class="session-bar" aria-hidden="true"><span id="session-bar-fill"></span></div><span class="session-bar-label" id="session-bar-label"></span></div>`;
}
function bindSessionClock(p,d){
 const button=$('#session-clock-toggle');if(!button)return;
 $('#session-rest-skip').onclick=()=>{restRunning=false;restRemaining=0;updateTimer();};
 button.onclick=()=>{window.TreinoCourse.clockToggle(d,Date.now());if(Number.isFinite(d.pausedAt))releaseWakeLock();else requestWakeLock();persist();renderPlans();};
 if(Number.isFinite(d.startedAt)&&!Number.isFinite(d.pausedAt))requestWakeLock();updateSessionClock();
}
function renderWorkoutSession(p){
 const d=getDraft(p);if(typeof d.guided!=='boolean')d.guided=true;
 const steps=programSteps(p);d.step=Math.max(0,Math.min(Number.isInteger(d.step)?d.step:0,Math.max(0,steps.length-1)));const current=steps[d.step];
 $('#content').innerHTML=heading(esc(p.name),d.editHistoryId?'Corrigir o registo guardado. A ficha do plano mantém-se.':'Preenche as repetições e marca ✓ em cada série. O descanso começa sozinho.')+workoutNavigation()+sessionClockHTML(p,d)+`
  <div class="guide-toolbar"><span>${d.guided?'Passo a passo':'Todos os exercícios'}</span><button class="btn secondary" id="toggle-guide">${d.guided?'Ver todos os exercícios':'Seguir passo a passo'}</button></div>
  ${canUndoReplacement(p)?'<button class="btn secondary" id="undo-replacement">Desfazer última troca</button>':''}
  <div class="plan-layout session-layout"><section class="panel"><div class="draft-badge">● Guardado ao preencher</div>
  ${d.guided&&current?`<div class="step-label">Exercício ${current.index+1} de ${p.exercises.length}${current.label?' · '+esc(current.label):''}</div>`:''}
  <div id="exercises">${d.guided&&current?exerciseHTML(p.exercises[current.index],current.index,d,current.row):p.exercises.map((e,i)=>exerciseHTML(e,i,d)).join('')}</div>
  ${d.guided&&current?`<div class="guide-controls"><button class="btn secondary" id="step-prev" ${d.step===0?'disabled':''}>← Anterior</button><span>${d.step+1} / ${steps.length}</span>${d.step===steps.length-1?`<button class="btn" id="step-finish">${d.editHistoryId?'Guardar':'Terminar treino ✓'}</button>`:'<button class="btn" id="step-next">Seguinte →</button>'}</div>`:''}
  <details class="proposal-help"><summary>Ajustes desta sessão</summary><div class="home-actions"><button class="btn secondary" id="add-exercise">Adicionar exercício</button>${!d.editHistoryId?'<button class="btn secondary" id="workout-edit">Editar ficha para próximas sessões</button><button class="btn secondary" id="discard-execution">Descartar ajustes desta sessão</button>':''}</div></details>
  <details class="proposal-help"><summary>Data, notas e duração</summary><div class="session-meta"><label>Data do treino<input type="date" id="session-date" value="${esc(d.date)}" required></label><label>Notas da sessão<input id="session-note" maxlength="2000" value="${esc(d.note)}"></label><label>Duração real · minutos<input id="session-duration" type="number" min="1" max="240" value="${esc(d.duration||'')}" placeholder="${Number.isFinite(d.startedAt)?'Vazio = tempo medido':'Opcional'}"></label></div>${d.watch?`<p class="auth-note">Apple Watch: ${esc(d.watch.minutes)} min${Number.isInteger(d.watch.kcal)?' · '+esc(d.watch.kcal)+' kcal ativas':''}</p>`:''}</details>
  <button class="btn full" id="finish">${d.editHistoryId?'Guardar alterações ao registo':'Guardar sessão no histórico'}</button>${d.editHistoryId?'<button class="btn secondary full" id="cancel-edit">Cancelar edição; manter o registo anterior</button>':''}
  </section><aside><div class="timer-panel"><span class="eyebrow">Tempo de descanso</span><div id="timer" class="timer" role="timer" aria-label="Tempo restante"></div><div class="timer-choices">${[60,90,120].map(n=>`<button data-rest="${n}">${n}s</button>`).join('')}</div><div class="timer-bottom"><button class="btn lime" id="timer-toggle">Iniciar</button><button class="btn secondary" id="timer-reset" aria-label="Reiniciar temporizador">↺</button></div></div><div class="side-summary"><h3>Nesta sessão</h3><div id="session-progress"></div><button class="btn secondary" id="session-balance">Equilíbrio por músculo ↗</button><details><summary>Ver ordem dos exercícios</summary><ol class="exercise-order">${p.exercises.map((e,i)=>`<li><button data-go-ex="${i}">${esc(e.name)}</button></li>`).join('')}</ol></details></div></aside></div>`;
 bindWorkoutNavigation();bindSessionClock(p,d);$('#toggle-guide').onclick=()=>{d.guided=!d.guided;persist();renderPlans();};if($('#workout-edit'))$('#workout-edit').onclick=openWorkoutEditor;if($('#undo-replacement'))$('#undo-replacement').onclick=undoReplacement;if($('#discard-execution'))$('#discard-execution').onclick=discardExecution;
 $('#session-date').onchange=e=>{if(e.target.value){d.date=e.target.value;d.datePinned=true;persist();}};$('#session-note').oninput=e=>{d.note=e.target.value;persist();};$('#session-duration').oninput=e=>{if(e.target.checkValidity()){d.duration=e.target.value;persist();}};$('#finish').onclick=finishSession;$('#add-exercise').onclick=()=>openExercisePicker();
 if($('#cancel-edit'))$('#cancel-edit').onclick=()=>{delete state.drafts[p.id];if(p.sessionOnly)state.plans=state.plans.filter(plan=>plan.id!==p.id);persist();setView('history');};
 if($('#step-prev'))$('#step-prev').onclick=()=>{d.step--;persist();renderPlans();};if($('#step-finish'))$('#step-finish').onclick=finishSession;if($('#step-next'))$('#step-next').onclick=()=>{d.step++;persist();renderPlans();};document.querySelectorAll('[data-go-ex]').forEach(button=>button.onclick=()=>{d.guided=true;d.step=steps.findIndex(step=>step.index===Number(button.dataset.goEx));persist();renderPlans();});
 if($('#session-balance'))$('#session-balance').onclick=courseBalance;
 bindExercises();document.querySelectorAll('[data-variant]').forEach(button=>button.onclick=()=>changeVariant(p.exercises.find(e=>e.id===button.dataset.variant)));document.querySelectorAll('[data-copy-last]').forEach(button=>button.onclick=()=>{const e=p.exercises.find(e=>e.id===button.dataset.copyLast),last=previousExercise(e,d.date);if(last){d.rows[e.id].forEach((row,i)=>{if(!row.kg)row.kg=last.rows[Math.min(i,last.rows.length-1)].kg;});persist();renderPlans();}});
 bindTimer();document.querySelectorAll('[data-use-rest]').forEach(button=>button.onclick=()=>{restDuration=Number(button.dataset.useRest);restRemaining=restDuration;restRunning=false;updateTimer();$('#timer').scrollIntoView({block:'nearest'});});updateProgress();
}
