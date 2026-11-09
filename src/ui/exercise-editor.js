function exerciseForm(existing = null, video = '') {
  const plan = getPlan();
  if (!existing && plan.exercises.length >= 100) return toast('Limite de 100 exercícios por treino.');
  const exercise = existing || ex('', video);
  const references = {
    unspecified: 'Não especificado', per_dumbbell: 'Kg por haltere',
    barbell_total: 'Kg totais da barra', machine_stack: 'Kg indicados na máquina',
    external_total: 'Kg de carga externa total', bodyweight: 'Peso corporal / sem carga externa'
  };
  modal(existing ? 'Editar exercício' : 'Criar exercício pessoal', `<form id="exercise-form">
    <div class="form-grid">
      <label class="wide">Nome do exercício<input id="e-name" required maxlength="200" placeholder="Ex.: Flexão inclinada" value="${esc(exercise.name)}"></label>
      <label class="wide">Vídeo YouTube <small>· opcional</small><input id="e-video" placeholder="URL ou ID do vídeo" value="${exercise.video ? 'https://www.youtube.com/watch?v=' + esc(exercise.video) : ''}"></label>
      <label>Séries no plano<input id="e-sets" type="number" min="1" max="30" step="1" required value="${exercise.sets}"></label>
      <label>Medida<select id="e-unit" aria-label="Medida"><option value="reps">Repetições</option><option value="s">Segundos</option><option value="steps">Passos</option></select></label>
      <label class="wide">Referência da carga<select id="e-load-reference" aria-label="Referência da carga">${Object.entries(references).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select></label>
      <label>Objetivo <small>· opcional</small><input id="e-target" maxlength="60" placeholder="Ex.: 8–12" value="${esc(exercise.target)}"></label>
      <label>Início do vídeo · segundos<input id="e-start" type="number" min="0" max="86400" step="1" value="${exercise.start}" required></label>
      <label class="wide">Notas do exercício<textarea id="e-note" maxlength="2000" placeholder="Progressão, técnica, material…">${esc(exercise.note)}</textarea></label>
    </div>
    <p class="dialog-note">As séries extra registadas na sessão não alteram as séries previstas no plano. Sem vídeo, fica disponível uma pesquisa no YouTube.</p>
    <p id="exercise-error" class="auth-message" role="alert" tabindex="-1"></p>
    <div class="form-actions"><button class="btn secondary" type="button" id="e-cancel">Cancelar</button><button class="btn" type="submit">Guardar exercício</button></div>
  </form>`, true);
  $('#e-unit').value = exercise.unit;
  $('#e-load-reference').value = window.TreinoRecords.loadReference(exercise);
  $('#e-cancel').onclick = closeModal;
  const fail = message => { $('#exercise-error').textContent = message; $('#exercise-error').focus(); };
  $('#exercise-form').onsubmit = event => {
    event.preventDefault();
    const name = $('#e-name').value.trim(), videoId = parseVideo($('#e-video').value);
    const sets = Number($('#e-sets').value), start = Number($('#e-start').value);
    const unit = $('#e-unit').value, loadReference = $('#e-load-reference').value;
    if (!name) return fail('Indica o nome do exercício.');
    if (videoId === null) return fail('Indica um URL válido do YouTube.');
    if (!Number.isInteger(sets) || sets < 1 || sets > 30 || !Number.isInteger(start) || start < 0 || start > 86400 || !['reps', 's', 'steps'].includes(unit) || !Object.hasOwn(references, loadReference)) return fail('Revê as séries, a medida, a carga e o início do vídeo.');
    const draft = getDraft(plan), old = draft.rows[exercise.id] || [];
    const next = { name, video: videoId, sets, unit, loadReference, target: $('#e-target').value.trim(), start, note: $('#e-note').value.trim() };
    const issue = window.TreinoRecords.editIssue(exercise, next, old);
    if (issue) return fail(issue);
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
