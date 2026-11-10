/* Copy-on-write execution plans keep v1 readers able to preserve actual sets. */
(function (root) {
  const records = typeof module !== 'undefined' && module.exports ? require('./workout-records.js') : root.TreinoRecords;
  const catalog = typeof module !== 'undefined' && module.exports ? require('./exercise-catalog.js') : root.TreinoExerciseCatalog;
  const copy = value => JSON.parse(JSON.stringify(value));
  const blank = () => ({kg:'',reps:'',done:false});

  function estimate(plan) {
    return Math.ceil((240+plan.exercises.reduce((total,e)=>{
      const numbers=String(e.target||'').match(/\d+/g)?.map(Number).filter(n=>Number.isFinite(n)&&n<=100000)||[],amount=numbers.length?Math.max(...numbers):0;
      const work=(e.unit==='s'?(amount||40):e.unit==='steps'?(amount||20)*2:amount?amount*3:40)*(e.unilateral?2:1);
      return total+e.sets*(work+(Number.isFinite(e.restSeconds)?e.restSeconds:90))+35;
    },0))/60);
  }

  function selection(document, planId, exerciseId, scope) {
    const plan = document.plans.find(p => p.id === planId);
    const exercise = plan?.exercises.find(e => e.id === exerciseId);
    if (!exercise) throw Error('O exercício já não está disponível. Abre novamente o treino.');
    if (!['today','future_day','future_program'].includes(scope)) throw Error('Escolhe onde aplicar a alteração.');
    const source = plan.sessionOnly ? document.plans.find(p => p.id === plan.executionSourceId) : plan;
    const ordinal = plan.exercises.filter(e => records.compatible(e, exercise)).findIndex(e => e.id === exerciseId);
    const courseGroup = p => p.course && p.id.match(/^(.*)-w\d{2}-[ABCM]$/)?.[1];
    const family = source?.program ? {id:source.program.id,week:source.program.week,day:source.program.day,type:'generated'} : source&&courseGroup(source) ? {id:courseGroup(source),week:source.course.week,day:source.course.session,type:'course'} : null;
    if(scope==='future_program'&&!family)throw Error('Esta ficha não tem um programa com semanas identificadas. Usa o âmbito desta sessão ou deste plano.');
    const targets = [], skipped = [];
    if (scope !== 'today' && source) for (const candidate of document.plans) {
      if (candidate.sessionOnly) continue;
      if (family) {
        const schedule=family.type==='generated'?candidate.program:candidate.course;
        const sameFamily=family.type==='generated'?candidate.program?.id===family.id:courseGroup(candidate)===family.id&&candidate.course?.version===source.course.version;
        const day=family.type==='generated'?schedule?.day:schedule?.session;
        if (!sameFamily || schedule.week < family.week || scope === 'future_day' && day !== family.day) continue;
        if (document.history.some(h => h.planId === candidate.id)) { skipped.push(candidate.id); continue; }
      } else if (candidate.id !== source.id) continue;
      let index = candidate.exercises.map((e,i) => records.compatible(e,exercise) ? i : -1).filter(i => i >= 0)[ordinal];
      if(index===undefined&&family?.type==='course'){
        const slot=source.exercises.findIndex(e=>e.id===exerciseId),other=candidate.exercises[slot];
        // Legacy course linkage needs family, session/slot, exact variant and units, not name alone.
        if(other&&other.name===exercise.name&&other.unit===exercise.unit&&records.loadReference(other)===records.loadReference(exercise)&&(records.loadReference(other)!=='unspecified'||other.note===exercise.note))index=slot;
      }
      if (index === undefined) continue;
      const draft = document.drafts[candidate.id];
      if (candidate.id !== plan.id && draft && Object.values(draft.rows).some(rows => records.hasValues(rows))) { skipped.push(candidate.id); continue; }
      targets.push({planId:candidate.id,index});
    }
    return {plan,exercise,source,targets,skipped};
  }

  function preview(document, options) {
    const selected = selection(document,options.planId,options.exerciseId,options.scope);
    const rows = document.drafts[selected.plan.id]?.rows[selected.exercise.id] || Array.from({length:selected.exercise.sets},blank);
    const result = {
      affected: selected.targets.map(target => ({id:target.planId,name:document.plans.find(p => p.id === target.planId).name})),
      skipped: selected.skipped, remaining: rows.filter(row => !records.hasValues([row])).length,
      kept: rows.filter(row => records.hasValues([row])).length
    };
    if(options.definition){
      const adjusted=copy(selected.plan),index=adjusted.exercises.findIndex(e=>e.id===selected.exercise.id);
      if(options.scope==='today'||options.includeCurrent!==false){
        const blocks=[];if(result.kept)blocks.push({...copy(selected.exercise),sets:result.kept});
        const estimateOptions=options.dosePolicy==='custom'&&!options.target?.trim()?{}:options;
        if(result.remaining)blocks.push(prescription(selected.exercise,options.definition,'preview',result.remaining,estimateOptions));
        adjusted.exercises.splice(index,1,...blocks);
      }
      result.estimatedMinutes=estimate(adjusted);
    }
    return result;
  }

  function prescription(before, definition, id, sets = before.sets, options = {}) {
    const next = catalog.instantiate(definition,id);
    const sameDose = before.unit === next.unit && before.pattern === next.pattern && before.direction === next.direction && !!before.unilateral === !!next.unilateral;
    next.sets = sets; next.target = sameDose ? before.target : '';
    if(options.dosePolicy==='custom'){
      if(typeof options.target!=='string'||!options.target.trim()||options.target.trim().length>60)throw Error('Define o objetivo do exercício novo ou escolhe manter os objetivos compatíveis.');
      next.target=options.target.trim();
    }else if(options.dosePolicy==='preserve'){
      if(before.unit!==next.unit||/%|1rm/i.test(before.target))throw Error('A medida ou a referência de esforço mudou. Define um objetivo novo; percentagens não transitam entre exercícios.');
      next.target=!next.unilateral?before.target.replace(/ por (?:lado|direção)$/,''):before.target;
    }else if(options.dosePolicy!==undefined)throw Error('Escolhe como ajustar os objetivos.');
    if (sameDose && Number.isFinite(before.restSeconds)) next.restSeconds = before.restSeconds;
    next.userModified = true; next.replacementOf = {name:before.name,exerciseKey:before.exerciseKey};
    if (before.originalDose) { next.originalDose=before.originalDose; next.originalName=before.originalName||before.name; next.adaptation='Substituição escolhida pela pessoa.'; }
    return next;
  }

  function replace(document, options) {
    if(document.minClientBuild>records.CLIENT_BUILD)throw Error('Atualiza a aplicação antes de alterar este documento.');
    const next = copy(document), {definition,uid,date} = options;
    next.minClientBuild=records.CLIENT_BUILD;
    const selected = selection(next,options.planId,options.exerciseId,options.scope);
    if (next.drafts[selected.plan.id]?.editHistoryId) throw Error('Guarda a correção do registo antes de ajustar uma nova sessão.');
    if ((definition.exerciseKey || 'catalog:'+definition.id) === selected.exercise.exerciseKey) throw Error('Escolhe um exercício diferente.');
    const info = preview(next,options), includeCurrent = options.scope === 'today' || options.includeCurrent !== false;
    if (includeCurrent && info.remaining === 0) throw Error('Todas as séries deste exercício têm valores. Aplica a troca só às próximas sessões ou adiciona outro exercício.');
    if (options.scope !== 'today' && !selected.targets.length) throw Error('Não há prescrições futuras compatíveis para alterar. Podes aplicar a troca só nesta sessão.');
    let execution = selected.plan;
    if (!execution.sessionOnly) {
      if (next.plans.length >= 256) throw Error('Limite de fichas atingido. Exporta e revê os planos antes de ajustar a sessão.');
      if (next.plans.some(p => p.sessionOnly && p.executionSourceId === execution.id && next.drafts[p.id])) throw Error('Já existe uma sessão ajustada em curso para este plano. Abre-a em Os meus treinos.');
      execution = {...copy(execution),id:uid(),sessionOnly:true,executionSourceId:selected.plan.id,primary:false,sourceExact:false};
      const draft = copy(next.drafts[selected.plan.id] || {date,note:'',rows:{}});
      next.drafts[execution.id] = draft; delete next.drafts[selected.plan.id]; next.plans.push(execution);
    }
    if (includeCurrent) {
      const draft = next.drafts[execution.id], index = execution.exercises.findIndex(e => e.id === selected.exercise.id);
      const old = execution.exercises[index], rows = draft.rows[old.id] || Array.from({length:old.sets},blank);
      const kept = rows.filter(row => records.hasValues([row]));
      if (kept.length && execution.exercises.length >= 100) throw Error('A sessão já tem 100 exercícios. Guarda-a antes de criar outro bloco.');
      const replacement = prescription(old,definition,uid(),info.remaining,options);
      if (kept.length) {
        old.sets = kept.length; old.beforeReplacement = true; draft.rows[old.id] = kept;
        execution.exercises.splice(index+1,0,replacement);
      } else { execution.exercises[index]=replacement; delete draft.rows[old.id]; }
      draft.rows[replacement.id]=Array.from({length:replacement.sets},blank);
    }
    for (const target of selected.targets) {
      const plan = next.plans.find(p=>p.id===target.planId), old=plan.exercises[target.index];
      const replacement=prescription(old,definition,uid(),old.sets,options);plan.exercises[target.index]=replacement;plan.userModified=true;
      plan.duration=estimate(plan)+' min estimados';
      if (plan.sourceExact) plan.sourceExact=false;
      const draft=next.drafts[plan.id];if(draft){delete draft.rows[old.id];draft.rows[replacement.id]=Array.from({length:replacement.sets},blank);}
    }
    execution.duration=estimate(execution)+' min estimados';
    return {document:next,selectedPlanId:execution.id,affected:info.affected,skipped:info.skipped};
  }

  function suggestions(exercise, equipment, conditions = {}) {
    const original=catalog.exercises.find(e=>e.id===exercise.libraryId)||exercise;
    if (!original.pattern || !original.direction || !original.muscles?.length) return [];
    const levels={beginner:0,regular:1,experienced:2},maximum=levels[conditions.experience||original.level||'regular'];
    return catalog.exercises.filter(e=>e.id!==original.id&&e.pattern===original.pattern&&e.direction===original.direction&&e.unit===original.unit&&e.muscles[0]===original.muscles[0]&&levels[e.level]<=maximum&&catalog.compatibleWith(e,equipment||original.equipment||[],conditions)).slice(0,5);
  }

  const api={preview,replace,suggestions,estimate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TreinoReplacement=api;
})(typeof window!=='undefined'?window:globalThis);
