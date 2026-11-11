/* Additive contracts for v1 documents. No exercise is identified by its name. */
(function (root) {
  const CLIENT_BUILD = 10;
  const programs=typeof module==='object'&&module.exports?require('../../program-engine.js'):root.TreinoPrograms;
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
    if(document.minClientBuild>CLIENT_BUILD)throw Error('Atualiza a aplicação antes de abrir este documento.');
    const next = copy(document);
    next.minClientBuild = CLIENT_BUILD;
    for (const plan of next.plans) {
      if(plan.program&&plan.program.weekday===undefined){
        const version=next.programVersions?.find(item=>item.id===plan.program.id);
        const answers=next.questionnaireVersions?.find(item=>item.id===version?.questionnaireId)?.answers;
        if(answers&&[1,2,3,4].includes(answers.days)&&Array.isArray(answers.preferredDays)){
          const weekday=programs.scheduleDays(answers)[plan.program.day];
          if(Number.isInteger(weekday)&&weekday>=0&&weekday<=6)plan.program.weekday=weekday;
        }
      }
      for (const exercise of plan.exercises) {
        exercise.exerciseKey = exerciseKey(exercise, plan.id);
        exercise.loadReference = loadReference(exercise);
      }
    }
    for (const session of next.history) {
      const plan = next.plans.find(p => p.id === session.planId);
      for (const saved of session.exercises) {
        const original = plan?.exercises.find(e => e.id === saved.id && e.name === saved.name && e.unit === saved.unit && loadReference(e) === loadReference(saved));
        const historical=session.planSnapshot?.exercises.find(e=>e.id===saved.id&&e.name===saved.name&&e.unit===saved.unit&&loadReference(e)===loadReference(saved));
        saved.exerciseKey ||= historical?.exerciseKey || original?.exerciseKey || 'legacy-history:' + session.id + ':' + saved.id;
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

  function signature(plan) {
    return JSON.stringify(plan.exercises.map(e => [e.id,e.exerciseKey||'',e.unit,loadReference(e),e.sets,e.target]));
  }

  function restoreRows(saved, minimum = 1) {
    const validIndex = index => Number.isInteger(index) && index >= 0 && index < 30;
    const count = Math.min(30,Math.max(minimum,saved.length,...saved.map(r => validIndex(r.setIndex) ? r.setIndex+1 : 0)));
    const rows=Array.from({length:count},()=>({kg:'',reps:'',done:false})),used=new Set();
    for (const row of saved) {
      const index=validIndex(row.setIndex)&&!used.has(row.setIndex)?row.setIndex:rows.findIndex((_,i)=>!used.has(i));
      if(index<0)throw Error('O registo excede o número de séries suportado.');
      used.add(index);rows[index]={kg:row.kg,reps:row.reps,done:row.done};
    }
    return rows;
  }

  function recoveryPlan(record, id) {
    if(record.planSnapshot)return {
      id,name:record.planName,note:record.planSnapshot.note,
      sessionOnly:true,executionSourceId:record.planId||record.id,
      exercises:copy(record.planSnapshot.exercises).map(e=>({...e,exerciseKey:e.exerciseKey||record.exercises.find(saved=>saved.id===e.id)?.exerciseKey||exerciseKey(e,record.planId||record.id)}))
    };
    return {
      id,name:record.planName,note:'Correção do registo guardado, separada do plano atual.',
      sessionOnly:true,executionSourceId:record.planId||record.id,
      exercises:record.exercises.map(e=>({
        id:e.id,name:e.name,unit:e.unit,exerciseKey:e.exerciseKey||'legacy-history:'+record.id+':'+e.id,
        libraryId:e.libraryId,loadReference:loadReference(e),noLoad:loadReference(e)==='bodyweight',
        sets:restoreRows(e.rows).length,target:'',video:'',start:0,note:e.loadUnit||''
      }))
    };
  }

  function planSnapshot(plan, draft) {
    const keys=['id','name','exerciseKey','libraryId','unit','loadReference','noLoad','target','video','start','note','restSeconds','unilateral','pattern','direction','equipment','equipmentKnown','muscles','beforeReplacement'];
    const pending=plan.exercises.flatMap(e=>(draft.rows[e.id]||[]).flatMap((row,setIndex)=>!row.done&&hasValues([row])?[{exerciseId:e.id,setIndex,...copy(row),done:false}]:[]));
    return {note:plan.note,completePrescription:!draft.recoveryOnly,pending,exercises:plan.exercises.map(e=>{
      const saved={};for(const key of keys)if(e[key]!==undefined)saved[key]=copy(e[key]);
      saved.sets=draft.rows[e.id]?.length||e.sets;
      return saved;
    })};
  }

  function sessionRecord(plan, draft, existing, {id,now,week}) {
    const exercises=plan.exercises.map(e=>snapshot(e,draft.rows[e.id]||[])).filter(e=>e.rows.length);
    const done=exercises.reduce((count,e)=>count+e.rows.length,0),total=plan.exercises.reduce((count,e)=>count+(draft.rows[e.id]||[]).length,0);
    return {
      id:existing?existing.id:id,planId:existing?existing.planId:plan.executionSourceId||plan.id,
      planName:plan.name,date:draft.date,note:draft.note,savedAt:existing?existing.savedAt:now,
      exercises,complete:draft.recoveryOnly?existing?.complete:done>=total,
      course:existing?existing.course:plan.course?{...copy(plan.course),week}:null,
      effort:draft.effort||'',duration:draft.duration||'',planSignature:signature(plan),planSnapshot:planSnapshot(plan,draft),
      ...(draft.watch||existing?.watch?{watch:copy(draft.watch||existing.watch)}:{})
    };
  }

  function portablePlan(plan) {
    const next=copy(plan);
    for(const key of ['course','program','primary','prepared','sourceExact','sessionOnly','executionSourceId','historyRecordId'])delete next[key];
    for(const e of next.exercises)for(const key of ['exampleIds','primaryExample','beforeReplacement','replacementOf'])delete e[key];
    return next;
  }

  function validMetadata(document) {
    if(document.minClientBuild!==undefined&&(!Number.isInteger(document.minClientBuild)||document.minClientBuild<1||document.minClientBuild>CLIENT_BUILD))return false;
    const safeId=id=>typeof id==='string'&&/^[\w-]{1,100}$/.test(id);
    if(document.plans.some(p=>(p.sessionOnly!==undefined&&typeof p.sessionOnly!=='boolean')||(p.executionSourceId!==undefined&&!safeId(p.executionSourceId))||(p.sessionOnly===true&&!safeId(p.executionSourceId))))return false;
    if(document.history.some(h=>h.planSignature!==undefined&&(typeof h.planSignature!=='string'||h.planSignature.length>80000)))return false;
    for (const [key, limit] of [['catalogFavorites', 1000], ['catalogRecents', 50]]) {
      if (document[key] !== undefined && (!Array.isArray(document[key]) || document[key].length > limit || document[key].some(id => typeof id !== 'string' || !/^[\w:.-]{1,220}$/.test(id)))) return false;
    }
    const exercises = [...document.plans.flatMap(p => p.exercises), ...document.history.flatMap(h => h.exercises), ...document.history.flatMap(h=>h.planSnapshot?.exercises||[])];
    return exercises.every(e =>
      (e.exerciseKey === undefined || (typeof e.exerciseKey === 'string' && /^[\w:.-]{1,220}$/.test(e.exerciseKey))) &&
      (e.loadReference === undefined || LOAD_REFERENCES.includes(e.loadReference)) &&
      (e.libraryId === undefined || (typeof e.libraryId === 'string' && /^[\w-]{1,100}$/.test(e.libraryId)))
    );
  }

  const api = { CLIENT_BUILD, LOAD_REFERENCES, loadReference, loadLabel, exerciseKey, compatible, upgrade, previous, hasValues, editIssue, snapshot, signature, restoreRows, recoveryPlan, planSnapshot, sessionRecord, portablePlan, validMetadata };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TreinoRecords = api;
})(typeof window !== 'undefined' ? window : globalThis);
