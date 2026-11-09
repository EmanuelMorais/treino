/* Additive contracts for v1 documents. No exercise is identified by its name. */
(function (root) {
  const LOAD_REFERENCES = ['per_dumbbell', 'barbell_total', 'machine_stack', 'bodyweight', 'external_total', 'unspecified'];
  const copy = value => JSON.parse(JSON.stringify(value));

  function loadReference(exercise) {
    if (LOAD_REFERENCES.includes(exercise.loadReference)) return exercise.loadReference;
    if (exercise.noLoad === true) return 'bodyweight';
    const note = String(exercise.loadUnit || exercise.note || '').trim().toLowerCase();
    // Recognise only the exact labels previously emitted by the application.
    if (/^(?:regista )?kg por haltere\.?$/.test(note)) return 'per_dumbbell';
    if (/^regista kg totais, incluindo a barra\.?$/.test(note)) return 'barbell_total';
    return 'unspecified';
  }

  function exerciseKey(exercise, planId = '') {
    if (exercise.exerciseKey) return exercise.exerciseKey;
    if (exercise.libraryId && !exercise.adapted) return 'catalog:' + exercise.libraryId;
    return 'legacy:' + planId + ':' + exercise.id;
  }

  function loadLabel(exercise) {
    return ({ per_dumbbell: 'kg por haltere', barbell_total: 'kg totais da barra', machine_stack: 'kg na máquina', external_total: 'kg externos totais', bodyweight: 'Sem carga externa', unspecified: 'kg' })[loadReference(exercise)];
  }

  function compatible(a, b) {
    if (a.unit !== b.unit || loadReference(a) !== loadReference(b)) return false;
    if (loadReference(a) === 'unspecified' && String(a.loadUnit || a.note || '') !== String(b.loadUnit || b.note || '')) return false;
    if (a.exerciseKey && b.exerciseKey) return a.exerciseKey === b.exerciseKey;
    // An unlinked legacy record is matched conservatively, never by name alone.
    return a.id === b.id && a.name === b.name;
  }

  function upgrade(document) {
    const next = copy(document);
    for (const plan of next.plans) {
      for (const exercise of plan.exercises) {
        exercise.exerciseKey = exerciseKey(exercise, plan.id);
        exercise.loadReference = loadReference(exercise);
      }
    }
    for (const session of next.history) {
      const plan = next.plans.find(p => p.id === session.planId);
      for (const saved of session.exercises) {
        const original = plan?.exercises.find(e => e.id === saved.id && e.name === saved.name && e.unit === saved.unit && loadReference(e) === loadReference(saved));
        saved.exerciseKey ||= original?.exerciseKey || 'legacy-history:' + session.id + ':' + saved.id;
        saved.loadReference = loadReference(saved);
      }
    }
    return next;
  }

  function previous(history, exercise, date, excludeSessionId) {
    const sessions = history.filter(h => h.id !== excludeSessionId && h.date <= date)
      .slice().sort((a, b) => b.date.localeCompare(a.date) || b.savedAt - a.savedAt);
    for (const session of sessions) {
      const saved = session.exercises.find(e => compatible(exercise, e) && e.rows.length);
      if (saved) return { date: session.date, rows: copy(saved.rows) };
    }
    return null;
  }

  function hasValues(rows = []) {
    return rows.some(row => row.done || row.kg !== '' || row.reps !== '');
  }

  function editIssue(before, after, rows = []) {
    if (hasValues(rows) && (before.name !== after.name || before.unit !== after.unit || loadReference(before) !== loadReference(after))) {
      return 'Este exercício já tem séries preenchidas. Guarda a sessão antes de alterar o movimento, a medida ou a referência da carga. Os registos existentes serão preservados.';
    }
    if (after.sets < before.sets && hasValues(rows.slice(after.sets))) return 'As séries finais têm registos. Mantém essas séries até guardares a sessão.';
    return '';
  }

  function snapshot(exercise, rows) {
    return {
      id: exercise.id, name: exercise.name, unit: exercise.unit,
      exerciseKey: exercise.exerciseKey, libraryId: exercise.libraryId,
      loadReference: loadReference(exercise), loadUnit: exercise.note || '',
      rows: rows.map((row, setIndex) => ({ ...row, setIndex })).filter(row => row.done)
    };
  }

  function validMetadata(document) {
    for (const [key, limit] of [['catalogFavorites', 1000], ['catalogRecents', 50]]) {
      if (document[key] !== undefined && (!Array.isArray(document[key]) || document[key].length > limit || document[key].some(id => typeof id !== 'string' || !/^[\w:.-]{1,220}$/.test(id)))) return false;
    }
    const exercises = [...document.plans.flatMap(p => p.exercises), ...document.history.flatMap(h => h.exercises)];
    return exercises.every(e =>
      (e.exerciseKey === undefined || (typeof e.exerciseKey === 'string' && /^[\w:.-]{1,220}$/.test(e.exerciseKey))) &&
      (e.loadReference === undefined || LOAD_REFERENCES.includes(e.loadReference)) &&
      (e.libraryId === undefined || (typeof e.libraryId === 'string' && /^[\w-]{1,100}$/.test(e.libraryId)))
    );
  }

  const api = { LOAD_REFERENCES, loadReference, loadLabel, exerciseKey, compatible, upgrade, previous, hasValues, editIssue, snapshot, validMetadata };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TreinoRecords = api;
})(typeof window !== 'undefined' ? window : globalThis);
