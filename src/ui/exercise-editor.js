function exerciseForm(existing = null, video = '', {replaceId=null}={}) {
  const plan = getPlan(),destinationKey=activeStorageKey;
  const data=window.TreinoExerciseCatalog,personal=!existing?.libraryId||!data?.exercises.some(e=>e.id===existing.libraryId);
  if (!existing && plan.exercises.length >= 100) return toast('Limite de 100 exercícios por treino.');
  const exercise = existing || ex('', video);
  const references = {
    unspecified: 'Não especificado', per_dumbbell: 'Kg por haltere',
    barbell_total: 'Kg totais da barra', machine_stack: 'Kg indicados na máquina',
    external_total: 'Kg de carga externa total', bodyweight: 'Peso corporal / sem carga externa'
  };
  modal(existing ? 'Editar exercício' : 'Criar exercício pessoal', `<form id="exercise-form" novalidate>
    <div class="form-grid">
      <label class="wide">Nome do exercício<input id="e-name" required maxlength="200" placeholder="Ex.: Flexão inclinada" value="${esc(exercise.name)}"></label>
      <label class="wide">Vídeo YouTube <small>· opcional</small><input id="e-video" placeholder="URL ou ID do vídeo" value="${exercise.video ? 'https://www.youtube.com/watch?v=' + esc(exercise.video) : ''}"></label>
      <label>Séries no plano<input id="e-sets" type="number" min="1" max="30" step="1" required value="${exercise.sets}"></label>
      <label>Medida<select id="e-unit" aria-label="Medida"><option value="reps">Repetições</option><option value="s">Segundos</option><option value="steps">Passos</option></select></label>
      <label class="wide">Referência da carga<select id="e-load-reference" aria-label="Referência da carga">${Object.entries(references).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select></label>
      <label>Objetivo <small>· opcional</small><input id="e-target" maxlength="60" placeholder="Ex.: 8–12" value="${esc(exercise.target)}"></label>
      <label>Descanso · segundos, opcional<input id="e-rest" type="number" min="0" max="600" step="1" value="${Number.isInteger(exercise.restSeconds)?exercise.restSeconds:''}" placeholder="Ajustável"></label><label>Início do vídeo · segundos<input id="e-start" type="number" min="0" max="86400" step="1" value="${exercise.start}" required></label>
      <label class="wide">Notas do exercício<textarea id="e-note" maxlength="2000" placeholder="Progressão, técnica, material…">${esc(exercise.note)}</textarea></label>
    </div>
    ${personal&&data?`<details class="proposal-help"><summary>Zona muscular e material — opcional</summary><label>Zona principal<select id="e-muscle" aria-label="Zona principal"><option value="">Por definir</option>${[...new Set(data.exercises.flatMap(e=>e.muscles))].map(m=>`<option value="${esc(m)}" ${exercise.muscles?.[0]===m?'selected':''}>${esc(m)}</option>`).join('')}</select></label><label>Material do exercício<select id="e-material-mode" aria-label="Material do exercício"><option value="unknown">Ainda por definir</option><option value="none">Não usa equipamento</option><option value="equipment">Escolher equipamento</option></select></label><div class="choice-grid" id="e-material-options">${Object.entries(data.EQUIPMENT).map(([key,label])=>`<label class="choice"><input type="checkbox" name="personalEquipment" value="${key}" ${exercise.equipment?.includes(key)?'checked':''}>${esc(label)}</label>`).join('')}</div><p class="auth-note">Banco, rack, ancoragem e máquinas são requisitos distintos. «Por definir» não significa sem equipamento.</p></details>`:''}
    <p class="dialog-note">${plan.sessionOnly?'Ajuste apenas desta sessão. A ficha futura mantém-se.':'Alteração desta ficha para próximas sessões.'} As séries extra registadas na sessão não alteram as séries previstas no plano. Sem vídeo, fica disponível uma pesquisa no YouTube.</p>
    <p id="exercise-error" class="auth-message" role="alert" tabindex="-1"></p>
    <div class="form-actions"><button class="btn secondary" type="button" id="e-cancel">Cancelar</button><button class="btn" type="submit">Guardar exercício</button></div>
  </form>`, true);
  $('#e-unit').value = exercise.unit;
  $('#e-load-reference').value = window.TreinoRecords.loadReference(exercise);
  if(personal&&data){const mode=$('#e-material-mode');mode.value=exercise.equipmentKnown===false||!Array.isArray(exercise.equipment)?'unknown':exercise.equipment.length?'equipment':'none';$('#e-material-options').hidden=mode.value!=='equipment';mode.onchange=()=>{$('#e-material-options').hidden=mode.value!=='equipment';if(mode.value==='none')$('#e-load-reference').value='bodyweight';};}
  $('#e-cancel').onclick = closeModal;
  const fail = message => { $('#exercise-error').textContent = message; $('#exercise-error').focus(); };
  $('#exercise-form').onsubmit = event => {
    event.preventDefault();
    if(!accountAccess||activeStorageKey!==destinationKey||getPlan()?.id!==plan.id)return toast('A conta ou ficha mudou. Abre novamente o editor.');
    const name = $('#e-name').value.trim(), videoId = parseVideo($('#e-video').value);
    const rest=$('#e-rest').value===''?undefined:Number($('#e-rest').value);
    const sets = Number($('#e-sets').value), start = Number($('#e-start').value);
    const unit = $('#e-unit').value, loadReference = $('#e-load-reference').value;
    if (!name) return fail('Indica o nome do exercício.');
    if (videoId === null) return fail('Indica um URL válido do YouTube.');
    if (!Number.isInteger(sets) || sets < 1 || sets > 30 || !Number.isInteger(start) || start < 0 || start > 86400 || !['reps', 's', 'steps'].includes(unit) || !Object.hasOwn(references, loadReference)||(rest!==undefined&&(!Number.isInteger(rest)||rest<0||rest>600))) return fail('Revê as séries, a medida, a carga e o início do vídeo.');
    const draft = getDraft(plan), old = draft.rows[exercise.id] || [];
    let material={};
    if(personal&&data){const mode=$('#e-material-mode').value,selected=Array.from(document.querySelectorAll('input[name=personalEquipment]:checked')).map(input=>input.value);if(mode==='none'&&loadReference!=='bodyweight')return fail('Sem equipamento: usa peso corporal na referência da carga ou revê o material.');if(mode==='equipment'&&!selected.length)return fail('Escolhe o equipamento necessário ou indica que não usa equipamento.');material={muscles:$('#e-muscle').value?[$('#e-muscle').value]:[],equipment:mode==='equipment'?selected:[],equipmentKnown:mode!=='unknown'};}
    const materialChanged=material.equipment&&JSON.stringify([...(exercise.equipment||[])].sort())!==JSON.stringify([...material.equipment].sort());
    if(materialChanged&&window.TreinoRecords.hasValues(old))return fail('Este exercício tem séries preenchidas. Guarda a sessão antes de alterar o material.');
    const next = { name, video: videoId, sets, unit, loadReference, target: $('#e-target').value.trim(), start, note: $('#e-note').value.trim(),...material,restSeconds:rest };
    const issue = window.TreinoRecords.editIssue(exercise, next, old);
    if (issue) return fail(issue);
    if(replaceId){const index=plan.exercises.findIndex(e=>e.id===replaceId);if(index<0||window.TreinoRecords.hasValues(draft.rows[replaceId]||[]))return fail('A ficha mudou ou tem séries preenchidas. A troca não foi aplicada.');plan.exercises[index]=exercise;delete draft.rows[replaceId];}
    if(materialChanged||existing&&(exercise.unit!==unit||window.TreinoRecords.loadReference(exercise)!==loadReference)){exercise.exerciseKey='custom:'+uid();delete exercise.libraryId;}
    const rowCount = sets < exercise.sets ? sets : Math.max(sets, old.length);
    exercise.exerciseKey ||= window.TreinoRecords.exerciseKey(exercise, plan.id);
    if (exercise.video !== videoId || exercise.start !== start) {
      delete exercise.primaryExample; delete exercise.videoLabel; exercise.exampleIds = [];
    }
    Object.assign(exercise, next, { noLoad: loadReference === 'bodyweight' });
    if (!existing) plan.exercises.push(exercise);
    draft.rows[exercise.id] = Array.from({ length: rowCount }, (_, i) => old[i] || blankRow());
    persist(); closeModal(); renderPlans(); toast('Exercício guardado.');
  };
}
