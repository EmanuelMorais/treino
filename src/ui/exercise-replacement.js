let replacementUndo=null;
function clearReplacementUndo(){replacementUndo=null;}
function canUndoReplacement(plan){return !!replacementUndo&&replacementUndo.storageKey===activeStorageKey&&replacementUndo.executionId===plan.id;}
function undoReplacement(){
  if(!replacementUndo||replacementUndo.storageKey!==activeStorageKey)return;
  if(JSON.stringify(state)!==replacementUndo.expected)return toast('Já existem alterações posteriores. Os registos mantêm-se; podes escolher outra substituição.');
  state=replacementUndo.before;selectedPlan=replacementUndo.previousPlan;clearReplacementUndo();persist();renderPlans();toast('Última substituição desfeita.');
}

function openExerciseReplacement(exercise) {
  if(!accountAccess)return;
  const plan=getPlan(),commands=window.TreinoReplacement;
  const source=plan.sessionOnly?state.plans.find(p=>p.id===plan.executionSourceId):plan;
  const hasProgramme=source?.program||source?.course&&/-w\d{2}-[ABCM]$/.test(source.id);
  openExercisePicker({replacing:exercise,onChoose:definition=>{
    const sameFunction=exercise.unit===definition.unit&&exercise.pattern===definition.pattern&&exercise.direction===definition.direction&&!/%|1rm/i.test(exercise.target);
    modal('Rever substituição',`<h3>${esc(exercise.name)} → ${esc(definition.name)}</h3>
      <p>As séries já preenchidas mantêm o movimento e os valores originais. A carga do exercício novo começa em branco.</p>
      <label>Objetivos de séries<select id="replacement-dose" aria-label="Objetivos de séries"><option value="preserve">Manter objetivos de cada ficha, com a mesma medida</option><option value="custom">Definir um objetivo novo para as fichas alteradas</option></select></label>
      <label id="replacement-target-wrap">Objetivo novo · ${esc(unitLabel(definition))}<input id="replacement-target" maxlength="60" placeholder="Ex.: 8–12"></label>
      <p class="dialog-note">Objetivo da ficha atual: ${esc(exercise.target||'por definir')}. As séries previstas variam por ficha e são preservadas. Confirma se os objetivos são adequados à nova variante.</p>
      <label>Aplicar alteração<select id="replacement-scope" aria-label="Aplicar alteração"><option value="today">Só nesta sessão</option><option value="future_day">Próximas sessões deste dia / plano</option>${hasProgramme?'<option value="future_program">Próximas sessões de todo o programa</option>':''}</select></label>
      <label id="replacement-current-wrap" class="choice" hidden><input type="checkbox" id="replacement-current" checked> Aplicar também nesta sessão</label>
      <p id="replacement-impact" role="status"></p><p id="replacement-time"></p><div id="replacement-plans"></div>
      <p class="dialog-note">Só serão alteradas ocorrências compatíveis da mesma variante. Sem correspondência estável, uma semana pode não ser incluída. Séries registadas e rascunhos preenchidos de outros treinos são preservados.</p>
      <p id="replacement-error" class="auth-message" role="alert" tabindex="-1"></p>
      <div class="form-actions"><button class="btn secondary" id="replacement-back">Escolher outro</button><button class="btn" id="replacement-confirm">Aplicar substituição</button></div>`);
    $('#replacement-dose').value=sameFunction?'preserve':'custom';
    const options=()=>({planId:plan.id,exerciseId:exercise.id,definition,scope:$('#replacement-scope').value,includeCurrent:$('#replacement-current').checked,dosePolicy:$('#replacement-dose').value,target:$('#replacement-target').value,date:today(),uid});
    const impact=()=>{
      try{
        const choice=options(),info=commands.preview(state,choice);
        $('#replacement-current-wrap').hidden=choice.scope==='today';
        $('#replacement-target-wrap').hidden=choice.dosePolicy!=='custom';
        if(info.remaining===0)$('#replacement-current').checked=false;
        $('#replacement-impact').textContent=choice.scope==='today'?`${info.kept} séries com valores preservadas; ${info.remaining} séries por preencher no exercício novo.`:`${info.affected.length} fichas futuras afetadas. ${info.skipped.length?info.skipped.length+' fichas com registos/rascunhos foram excluídas.':''}`;
        const budget=state.profile?.answers?.minutes;
        $('#replacement-time').textContent=`Esta sessão: cerca de ${info.estimatedMinutes} min, incluindo aquecimento e descansos.${budget&&info.estimatedMinutes>budget?' Ultrapassa os '+budget+' min do perfil; revê as séries ou o tempo disponível.':''}`;
        $('#replacement-plans').innerHTML=choice.scope==='today'?'':`<details><summary>Ver fichas afetadas</summary><ul>${info.affected.map(p=>`<li>${esc(p.name)}</li>`).join('')}</ul></details>`;
      }catch(error){$('#replacement-error').textContent=error.message;}
    };
    $('#replacement-scope').onchange=impact;$('#replacement-current').onchange=impact;$('#replacement-dose').onchange=impact;$('#replacement-target').oninput=impact;
    $('#replacement-back').onclick=()=>openExerciseReplacement(exercise);
    $('#replacement-confirm').onclick=()=>{
      try{
        const result=commands.replace(state,options());
        if(!validState(result.document))throw Error('Não foi possível validar a substituição. Os dados anteriores mantêm-se.');
        const before=JSON.parse(JSON.stringify(state)),previousPlan=selectedPlan;
        state=result.document;selectedPlan=result.selectedPlanId;closeModal();renderPlans();
        replacementUndo={before,previousPlan,executionId:selectedPlan,storageKey:activeStorageKey,expected:JSON.stringify(state)};
        persist();renderPlans();toast('Substituição aplicada. Os registos anteriores foram preservados.');
      }catch(error){$('#replacement-error').textContent=error.message;$('#replacement-error').focus();}
    };
    impact();
  }});
}

function discardExecution() {
  const plan=getPlan(),draft=state.drafts[plan.id];if(!plan.sessionOnly||draft?.editHistoryId)return;
  if(draft&&Object.values(draft.rows).some(rows=>window.TreinoRecords.hasValues(rows)))return toast('Há séries preenchidas nesta sessão. Guarda-a antes de descartar os ajustes.');
  modal('Descartar ajustes desta sessão',`<p>Voltar à ficha do plano? Esta sessão não tem séries preenchidas. As alterações futuras que confirmaste mantêm-se.</p><div class="form-actions"><button class="btn secondary" id="execution-keep">Continuar sessão</button><button class="btn" id="execution-discard">Descartar ajustes</button></div>`,true);
  $('#execution-keep').onclick=closeModal;
  $('#execution-discard').onclick=()=>{
    state.plans=state.plans.filter(p=>p.id!==plan.id);delete state.drafts[plan.id];selectedPlan=plan.executionSourceId;clearReplacementUndo();
    persist();closeModal();renderPlans();toast('Ajustes desta sessão descartados.');
  };
}
