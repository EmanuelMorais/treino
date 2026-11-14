// Load progression and personal records, from what was actually logged.
// Pure: it reads history and returns a suggestion; nothing here writes.
(function () {
  const records = typeof require === 'function' && typeof module !== 'undefined' ? require('./workout-records.js') : (typeof window !== 'undefined' ? window.TreinoRecords : null);

  // What one more step of load is worth, by what the weight is measured in.
  // Tuned to ordinary home plates: 1 kg and 2 kg discs a side.
  const STEPS = { per_dumbbell: 2, barbell_total: 4, machine_stack: 5, external_total: 2, unspecified: 2, bodyweight: 0 };
  const MAX_REPS_BONUS = 2;

  const num = value => { const n = Number(String(value ?? '').replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : 0; };

  // "8–10" → {low:8, high:10}; "30" → {low:30, high:30}; anything else → null.
  function range(target) {
    const text = String(target ?? '').replace(/[–—]/g, '-');
    const pair = text.match(/(\d+)\s*-\s*(\d+)/);
    if (pair) return { low: Number(pair[1]), high: Number(pair[2]) };
    const single = text.match(/^\s*(\d+)\s*$/);
    return single ? { low: Number(single[1]), high: Number(single[1]) } : null;
  }

  function stepFor(exercise) {
    const reference = records ? records.loadReference(exercise) : 'unspecified';
    return { reference, step: STEPS[reference] ?? 2 };
  }

  // One personal record per exercise: the heaviest set, and the best volume in a session.
  function best(history, exercise) {
    let heaviest = null, volume = null;
    for (const session of Array.isArray(history) ? history : []) {
      const logged = (session.exercises || []).find(e => records && records.compatible(exercise, e));
      if (!logged) continue;
      let sessionVolume = 0;
      for (const row of logged.rows || []) {
        const kg = num(row.kg), reps = num(row.reps);
        if (!reps) continue;
        sessionVolume += kg * reps;
        const score = kg * reps;
        if (kg && (!heaviest || kg > heaviest.kg || (kg === heaviest.kg && score > heaviest.kg * heaviest.reps))) heaviest = { kg, reps, date: session.date };
      }
      if (sessionVolume && (!volume || sessionVolume > volume.total)) volume = { total: Math.round(sessionVolume), date: session.date };
    }
    return { heaviest, volume };
  }

  // Load over time: one point per session, the heaviest set of that day.
  function series(history, exercise) {
    const points = [];
    for (const session of Array.isArray(history) ? history : []) {
      const logged = (session.exercises || []).find(e => records && records.compatible(exercise, e));
      if (!logged) continue;
      let top = 0, reps = 0;
      for (const row of logged.rows || []) { const kg = num(row.kg); if (kg > top) { top = kg; reps = num(row.reps); } }
      if (top) points.push({ date: session.date, kg: top, reps });
    }
    return points.sort((a, b) => a.date.localeCompare(b.date));
  }

  // The suggestion for the next session, from the last time this exercise was done.
  // Up only after a clean session at the top of the range; never two steps at once.
  function suggest(history, exercise, { date = '9999-12-31', excludeSessionId } = {}) {
    if (!records) return null;
    const last = records.previous(history, exercise, date, excludeSessionId);
    if (!last || !last.rows || !last.rows.length) return null;
    const bounds = range(exercise.target);
    const { reference, step } = stepFor(exercise);
    const kgs = last.rows.map(r => num(r.kg)).filter(Boolean);
    const repsList = last.rows.map(r => num(r.reps)).filter(Boolean);
    if (!repsList.length) return null;
    const lowestReps = Math.min(...repsList);
    const topKg = kgs.length ? Math.max(...kgs) : 0;
    const planned = Number.isInteger(exercise.sets) ? exercise.sets : last.rows.length;
    const full = last.rows.length >= planned;

    if (!bounds) return { kind: 'hold', kg: topKg, reason: 'Repete a carga da última vez.', last };
    if (full && lowestReps >= bounds.high) {
      if (!step || !topKg) return { kind: 'reps', reps: bounds.high + MAX_REPS_BONUS, reason: `Chegaste a ${bounds.high} em todas as séries. Sem carga para juntar, procura ${bounds.high + MAX_REPS_BONUS} repetições.`, last };
      return { kind: 'up', kg: Math.round((topKg + step) * 10) / 10, from: topKg, step, reference, reason: `Fizeste ${lowestReps} repetições em todas as séries. Sobe a carga e volta ao fundo do intervalo.`, last };
    }
    if (lowestReps < bounds.low) return { kind: 'down', kg: topKg, reason: `Ficaste em ${lowestReps} repetições, abaixo de ${bounds.low}. Mantém ou alivia a carga até cumprires o intervalo.`, last };
    return { kind: 'hold', kg: topKg, reason: `Mantém ${topKg ? topKg + ' kg' : 'a carga'} e procura mais repetições, até ${bounds.high}.`, last };
  }

  function suggestionLabel(suggestion) {
    if (!suggestion) return '';
    if (suggestion.kind === 'up') return `Sugestão: ${suggestion.kg} kg`;
    if (suggestion.kind === 'reps') return `Sugestão: ${suggestion.reps} repetições`;
    if (suggestion.kind === 'down') return 'Sugestão: alivia a carga';
    return suggestion.kg ? `Sugestão: manter ${suggestion.kg} kg` : '';
  }

  const api = { STEPS, range, stepFor, best, series, suggest, suggestionLabel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.TreinoProgression = api;
})();
