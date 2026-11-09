(function (root) {
  const data = typeof module !== 'undefined' && module.exports ? require('../data/exercise-catalog.js') : root.TreinoCatalogData;
  const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const CONTEXTS = {
    all: { name: 'Todo o catálogo', equipment: null },
    bodyweight: { name: 'Sem equipamento', equipment: [] },
    dumbbells: { name: 'Só halteres', equipment: ['dumbbells'] },
    dumbbells_bench: { name: 'Halteres + banco plano', equipment: ['dumbbells','bench'] },
    dumbbells_incline: { name: 'Halteres + banco inclinável', equipment: ['dumbbells','bench','incline_bench'] },
    barbell: { name: 'Só barra e discos', equipment: ['barbell'] },
    bands: { name: 'Elásticos sem ancoragem', equipment: ['bands'] },
    bands_anchor: { name: 'Elásticos + ancoragem', equipment: ['bands','band_anchor'] }
  };

  function compatibleWith(exercise, equipment, conditions = {}) {
    return exercise.equipmentKnown !== false && exercise.equipment.every(key => equipment.includes(key)) &&
      !(conditions.lowCeiling && exercise.overhead) && !(conditions.walkingSpace === false && exercise.walking);
  }

  function defaultContext(equipment) {
    if (!Array.isArray(equipment)) return 'all';
    return Object.keys(CONTEXTS).find(key => {
      const available = CONTEXTS[key].equipment;
      return available && available.length === equipment.length && available.every(item => equipment.includes(item));
    }) || 'all';
  }

  function search({ query = '', muscle = '', context = 'all', favorites = [], onlyFavorites = false, recents = [], extra = [], conditions = {} } = {}) {
    const terms = normalize(query).split(' ').filter(Boolean), permitted = CONTEXTS[context]?.equipment;
    if (!Object.hasOwn(CONTEXTS, context) && !context.startsWith('machine:')) return [];
    const machine = context.startsWith('machine:') ? context.slice(8) : '';
    const items = [...data.exercises, ...extra].filter(e => {
      if (muscle && !e.muscles.includes(muscle)) return false;
      if (onlyFavorites && !favorites.includes(e.id)) return false;
      if (permitted && !compatibleWith(e, permitted, conditions)) return false;
      if (machine && !e.equipment.includes(machine)) return false;
      if (conditions.lowCeiling && e.overhead || conditions.walkingSpace === false && e.walking) return false;
      const text = normalize([e.name, ...(e.aliases || []), ...e.muscles].join(' '));
      return terms.every(term => text.includes(term));
    });
    const score = e => {
      const name = normalize(e.name), q = normalize(query);
      if (q && [e.name, ...(e.aliases || [])].some(alias => normalize(alias) === q)) return 100;
      if (q && name.startsWith(q)) return 80;
      return (favorites.includes(e.id) ? 20 : 0) + Math.max(0, 10 - recents.indexOf(e.id)) * Number(recents.includes(e.id));
    };
    return items.sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name, 'pt'));
  }

  function coverage(equipment, conditions = {}, patterns = ['squat','hinge','push','pull','core']) {
    const available = data.exercises.filter(e => compatibleWith(e, equipment, conditions));
    const counts = Object.fromEntries(patterns.map(pattern => [pattern, available.filter(e => e.pattern === pattern).length]));
    return { total: available.length, counts, missing: patterns.filter(pattern => counts[pattern] === 0) };
  }

  function instantiate(definition, id) {
    return {
      id, libraryId: definition.personal ? undefined : definition.id,
      exerciseKey: definition.exerciseKey || 'catalog:' + definition.id,
      name: definition.name, video: definition.video || '', start: definition.start || 0,
      sets: 2, target: '', unit: definition.unit || 'reps', note: '',
      loadReference: definition.loadReference, noLoad: definition.loadReference === 'bodyweight',
      how: definition.how, equipment: [...definition.equipment], muscles: [...definition.muscles],
      equipmentKnown: definition.equipmentKnown !== false,
      pattern: definition.pattern, direction: definition.direction, unilateral: definition.unilateral
    };
  }

  function personalExercises(plans) {
    const seen = new Set();
    return plans.flatMap(plan => plan.exercises).filter(e => {
      if (e.libraryId && data.exercises.some(item => item.id === e.libraryId)) return false;
      const key = e.exerciseKey || 'legacy:' + e.id;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).map(e => ({
      ...e, id: e.exerciseKey || 'legacy:' + e.id, personal: true,
      aliases: [], muscles: Array.isArray(e.muscles) ? e.muscles.filter(x => typeof x === 'string') : [],
      equipment: Array.isArray(e.equipment) ? e.equipment.filter(x => typeof x === 'string') : [],
      equipmentKnown: e.equipmentKnown !== false && Array.isArray(e.equipment) && e.equipment.every(x => typeof x === 'string'),
      how: typeof e.how === 'string' ? e.how : typeof e.note === 'string' ? e.note : '',
      loadReference: e.loadReference || 'unspecified'
    }));
  }

  const api = { ...data, CONTEXTS, normalize, compatibleWith, defaultContext, search, coverage, instantiate, personalExercises };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TreinoExerciseCatalog = api;
})(typeof window !== 'undefined' ? window : globalThis);
