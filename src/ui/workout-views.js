/* View state stays on this device. Session data remains in the private document. */
let workoutView=null;
function showWorkoutView(mode){const p=getPlan();workoutView={key:activeStorageKey,id:p.id,mode};renderPlans();}
function adoptWorkoutCommand(command,mode){
 if(!validState(command.document))throw Error('Não foi possível validar a alteração. Os dados anteriores mantêm-se.');
 const before=state;state=command.document;if(!persist()){state=before;throw Error('Não foi possível guardar. A ficha anterior mantém-se.');}
 selectedPlan=command.selectedPlanId;workoutView={key:activeStorageKey,id:selectedPlan,mode};closeModal();renderPlans();
}
function startWorkoutSession(limit){
 if(!accountAccess)return;try{adoptWorkoutCommand(window.TreinoSessions.start(state,{planId:getPlan().id,uid,date:today(),week:courseWeek(getPlan()),now:Date.now(),limit:Number.isInteger(limit)?limit:undefined}),'session');requestWakeLock();}catch(error){toast(error.message);}
}
const SHORT_SESSION=3;
function bindReviewSheets(p){
 bindExerciseSheet();
 document.querySelectorAll('.review-exercise').forEach((node,i)=>{const e=p.exercises[i];if(!e)return;node.querySelectorAll('[data-own-video]').forEach(b=>b.onclick=()=>exerciseForm(e));});
}
function warmupText(p){
 if(p.warmup)return p.warmup;
 const first=p.exercises.find(e=>!e.noLoad&&e.unit==='reps');
 if(!first)return 'Três a cinco minutos a mexer as ancas, os ombros e a coluna antes da primeira série.';
 return `Duas séries leves de ${first.name} antes da primeira série a sério, para subir a carga aos poucos.`;
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
function workoutNavigation(){return '<div class="home-actions workout-nav"><button class="btn secondary" id="workout-home">← Voltar</button><button class="btn secondary" id="other-plans">Arquivo de planos</button></div>';}
function bindWorkoutNavigation(){
 $('#workout-home').onclick=()=>{selectedPlan='';workoutView=null;setView('plans');};$('#other-plans').onclick=otherPlans;
}
function workoutMetadata(p){return `<details class="proposal-help"><summary>Orientações e origem da ficha</summary><p>${esc(p.note)}</p>${p.progression?`<p>${esc(p.progression)}</p>`:''}${p.provenance?`<p>${esc(p.provenance)}</p>`:''}${isCurrentCourse(p)?sourceComparison(p):''}</details>`;}
function renderWorkoutOverview(p){
 setScreen('plan');
 const pending=state.plans.find(s=>s.sessionOnly&&s.executionSourceId===p.id&&state.drafts[s.id])||window.TreinoSessions.hasValues(state.drafts[p.id]);
 $('#content').innerHTML=heading(esc(p.name),'Abre cada exercício para ver o movimento. Começa quando quiseres.')+workoutNavigation()+`
  <section class="panel workout-overview"><p>${p.exercises.length} exercícios · ${esc(p.duration||'Duração ajustável')}</p>${p.warmup?`<p class="visible-warmup"><b>Aquecimento:</b> ${esc(p.warmup)}</p>`:''}
  <ol class="workout-prescription review-list">${p.exercises.map((e,i)=>`<li><details class="review-exercise"><summary><span class="review-index">${i+1}</span><span class="review-copy"><b>${esc(e.name)}</b><span>${e.sets} × ${esc(targetLabel(e))}${Number.isFinite(e.restSeconds)?' · '+e.restSeconds+' s descanso':''}</span>${exerciseMuscles(e).length?`<small>${exerciseMuscles(e).map(esc).join(' · ')}</small>`:''}</span>${icon('chevron')}</summary><div class="review-sheet">${exerciseSheetHTML(e,{heading:false,muscles:false})}</div></details></li>`).join('')}</ol>
  <div class="home-actions"><button class="btn" id="start-session">${pending?'Retomar sessão':'Começar sessão'}</button>${!pending&&p.exercises.length>SHORT_SESSION?`<button class="btn secondary" id="start-short">Treino curto · ${SHORT_SESSION} exercícios</button>`:''}<button class="btn secondary" id="workout-edit">Editar ficha</button></div>${workoutMetadata(p)}</section>
  ${isCurrentCourse(p)?'<button class="btn secondary full" id="open-programme">Ver as 12 semanas do programa</button>':''}`;
 bindWorkoutNavigation();$('#start-session').onclick=()=>startWorkoutSession();if($('#start-short'))$('#start-short').onclick=()=>startWorkoutSession(SHORT_SESSION);$('#workout-edit').onclick=openWorkoutEditor;bindReviewSheets(p);
 if($('#open-programme'))$('#open-programme').onclick=()=>setView('program');
}
function renderWorkoutEditor(p){
 if(p.sessionOnly)return showWorkoutView('session');
 setScreen('plan');
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
function sessionTopHTML(p,d){
 // One fixed strip: where to go back, how long you have been at it, and how to stop.
 const paused=Number.isFinite(d.pausedAt),core=Number.isInteger(p.coreMinutes)&&p.coreMinutes>0?p.coreMinutes:0;
 const clock=d.editHistoryId?'<span>A corrigir um registo guardado</span>':`<span class="session-clock" id="session-clock" data-core="${core}" role="timer" aria-label="Tempo de sessão"><b id="session-clock-time">${formatTime(window.TreinoCourse.clockElapsed(d,Date.now()))}</b><i id="session-clock-note">${paused?' · em pausa':''}</i></span><span id="session-bar-label"></span>`;
 return `<header class="session-top"><button class="icon-btn" id="workout-home" aria-label="Voltar aos treinos; a sessão fica guardada">${icon('back')}</button>
 <div class="session-top-copy"><strong>${esc(p.shortTitle||p.name)}</strong><div class="session-top-meta">${clock}</div></div>
 <button class="btn lime session-finish" id="finish">${d.editHistoryId?'Guardar':'Terminar'}</button></header>
 <div class="session-progress" aria-hidden="true"><span id="session-bar-fill"></span></div>
 ${core&&!d.editHistoryId?`<p class="session-core" id="session-clock-core" hidden>Núcleo feito (${core} min) · os extras são opcionais</p>`:''}`;
}
function bindSessionClock(p,d){
 const button=$('#session-pause');if(!button)return;
 button.onclick=()=>{window.TreinoCourse.clockToggle(d,Date.now());if(Number.isFinite(d.pausedAt))releaseWakeLock();else requestWakeLock();persist();updateSessionClock();};
 if($('#session-restart'))$('#session-restart').onclick=()=>{window.TreinoCourse.clockReset(d,Date.now());requestWakeLock();persist();updateSessionClock();toast('Cronómetro a contar de novo desde zero');};
 if(Number.isFinite(d.startedAt)&&!Number.isFinite(d.pausedAt))requestWakeLock();updateSessionClock();
}
function renderWorkoutSession(p){
 setScreen('session');
 const d=getDraft(p),paused=Number.isFinite(d.pausedAt),started=Number.isFinite(d.startedAt);
 $('#content').innerHTML=sessionTopHTML(p,d)+`
  ${!d.editHistoryId&&warmupText(p)?`<section class="warmup-card"><div><b>Aquecimento</b><p>${esc(warmupText(p))}</p></div><button class="btn secondary" id="warmup-start">Contar 3 min</button></section>`:''}
  <div id="exercises" class="session-list">${p.exercises.map((e,i)=>exerciseHTML(e,i,d)).join('')}</div>
  <details class="session-more"><summary>Ajustes desta sessão</summary><div class="session-more-body">
  <div class="home-actions"><button class="btn secondary" id="add-exercise">Adicionar exercício</button><button class="btn secondary" id="session-balance">Ver séries por músculo</button>${!d.editHistoryId?`<button class="btn secondary" id="session-pause">${!started?'Iniciar cronómetro':paused?'Retomar cronómetro':'Pausar cronómetro'}</button><button class="btn secondary" id="session-restart"${started?'':' hidden'}>Reiniciar cronómetro</button><button class="btn secondary" id="workout-edit">Editar ficha para próximas sessões</button><button class="btn secondary" id="discard-execution">Descartar ajustes desta sessão</button>`:''}${canUndoReplacement(p)?'<button class="btn secondary" id="undo-replacement">Desfazer última troca</button>':''}</div>
  <div class="session-meta"><label>Data do treino<input type="date" id="session-date" value="${esc(d.date)}" required></label><label>Notas da sessão<input id="session-note" maxlength="2000" value="${esc(d.note)}"></label><label>Duração real · minutos<input id="session-duration" type="number" min="1" max="240" value="${esc(d.duration||'')}" placeholder="${started?'Vazio = tempo medido':'Opcional'}"></label></div>
  ${d.watch?`<p class="auth-note">Apple Watch: ${esc(d.watch.minutes)} min${Number.isInteger(d.watch.kcal)?' · '+esc(d.watch.kcal)+' kcal ativas':''}</p>`:''}
  <p class="auth-note">Guardado ao preencher. Podes sair e voltar sem perder nada.</p></div></details>
  <button class="btn full" id="finish-bottom">${d.editHistoryId?'Guardar alterações ao registo':'Guardar sessão no histórico'}</button>${d.editHistoryId?'<button class="btn secondary full" id="cancel-edit">Cancelar edição; manter o registo anterior</button>':''}`;
 $('#workout-home').onclick=()=>{selectedPlan='';workoutView=null;setView('plans');};
 bindSessionClock(p,d);
 if($('#workout-edit'))$('#workout-edit').onclick=openWorkoutEditor;if($('#undo-replacement'))$('#undo-replacement').onclick=undoReplacement;if($('#discard-execution'))$('#discard-execution').onclick=discardExecution;
 $('#session-date').onchange=e=>{if(e.target.value){d.date=e.target.value;d.datePinned=true;persist();}};$('#session-note').oninput=e=>{d.note=e.target.value;persist();};$('#session-duration').oninput=e=>{if(e.target.checkValidity()){d.duration=e.target.value;persist();}};
 $('#finish').onclick=finishSession;$('#finish-bottom').onclick=finishSession;$('#add-exercise').onclick=()=>openExercisePicker();
 $('#session-balance').onclick=()=>setView('history');
 if($('#warmup-start'))$('#warmup-start').onclick=()=>{startRest(180);toast('Aquecimento a contar. Começa quando estiveres pronto.');};
 if($('#cancel-edit'))$('#cancel-edit').onclick=()=>{delete state.drafts[p.id];if(p.sessionOnly)state.plans=state.plans.filter(plan=>plan.id!==p.id);persist();setView('history');};
 bindExercises();document.querySelectorAll('[data-variant]').forEach(button=>button.onclick=()=>changeVariant(p.exercises.find(e=>e.id===button.dataset.variant)));
 updateProgress();
}
