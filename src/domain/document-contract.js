/* The v1 envelope remains readable; feature compatibility is fenced separately. */
(function(root){
  const records=typeof module!=='undefined'&&module.exports?require('./workout-records.js'):root.TreinoRecords;
  const programs=typeof module!=='undefined'&&module.exports?require('../../program-engine.js'):root.TreinoPrograms;
  const proposals=typeof module!=='undefined'&&module.exports?require('./programme-proposal.js'):root.TreinoProposal;
  const text=(value,max=2000)=>typeof value==='string'&&value.length<=max;
  const safeId=value=>text(value,100)&&/^[A-Za-z0-9_-]+$/.test(value)&&!['__proto__','constructor','prototype'].includes(value);
  const num=(value,max=100000)=>value===''||(typeof value==='string'&&value.length<20&&Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=max);
  const video=value=>text(value,11)&&(!value||/^[\w-]{11}$/.test(value));
  const date=value=>text(value,10)&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T12:00:00'));
  const row=value=>value&&num(value.kg)&&num(value.reps)&&typeof value.done==='boolean';
  const course=value=>value&&typeof value==='object'&&!Array.isArray(value)&&Number.isInteger(value.week)&&value.week>=1&&value.week<=12&&['A','B','C','M'].includes(value.session)&&Number.isInteger(value.phase)&&value.phase>=0&&value.phase<=3;
  const exercise=value=>value&&safeId(value.id)&&text(value.name,200)&&value.name.trim()&&video(value.video)&&Number.isInteger(value.sets)&&value.sets>=1&&value.sets<=30&&text(value.target,60)&&['reps','s','steps'].includes(value.unit)&&Number.isInteger(value.start)&&value.start>=0&&value.start<=86400&&text(value.note);
  const logged=value=>value&&safeId(value.id)&&text(value.name,200)&&['reps','s','steps'].includes(value.unit)&&Array.isArray(value.rows)&&value.rows.length<=30&&value.rows.every(row);

  function safeKeys(value,ancestors=new Set(),depth=0){
    if(!value||typeof value!=='object')return true;
    if(depth>40||ancestors.has(value))return false;
    ancestors.add(value);
    for(const [key,child]of Object.entries(value)){
      if(['__proto__','constructor','prototype'].includes(key)||!safeKeys(child,ancestors,depth+1))return false;
    }
    ancestors.delete(value);return true;
  }

  function validSnapshot(history){
    const snapshot=history.planSnapshot;if(snapshot===undefined)return true;
    if(!snapshot||!text(snapshot.note)||(snapshot.completePrescription!==undefined&&typeof snapshot.completePrescription!=='boolean')||!Array.isArray(snapshot.exercises)||snapshot.exercises.length>100||!snapshot.exercises.every(exercise)||new Set(snapshot.exercises.map(e=>e.id)).size!==snapshot.exercises.length)return false;
    for(const saved of history.exercises){
      const definition=snapshot.exercises.find(e=>e.id===saved.id);
      if(!definition||definition.name!==saved.name||definition.unit!==saved.unit||records.loadReference(definition)!==records.loadReference(saved)||definition.exerciseKey&&saved.exerciseKey&&definition.exerciseKey!==saved.exerciseKey||saved.rows.length>definition.sets||saved.rows.some(row=>!row.done))return false;
    }
    const pending=snapshot.pending===undefined?[]:snapshot.pending;
    if(!Array.isArray(pending)||pending.length>3000)return false;
    const positions=new Set(),counts=new Map();
    for(const value of pending){
      if(!value||!safeId(value.exerciseId)||!row(value)||value.done!==false||!Number.isInteger(value.setIndex)||value.setIndex<0)return false;
      const definition=snapshot.exercises.find(e=>e.id===value.exerciseId);
      if(!definition||value.setIndex>=definition.sets)return false;
      const key=value.exerciseId+':'+value.setIndex;if(positions.has(key))return false;positions.add(key);
      const saved=history.exercises.find(e=>e.id===value.exerciseId)?.rows||[];
      if(saved.some((done,index)=>(Number.isInteger(done.setIndex)&&done.setIndex>=0&&done.setIndex<30?done.setIndex:index)===value.setIndex))return false;
      const count=(counts.get(value.exerciseId)||0)+1;counts.set(value.exerciseId,count);
      if(saved.length+count>definition.sets)return false;
    }
    return true;
  }

  function validate(doc){
    if(!safeKeys(doc)||!doc||doc.version!==1||!Array.isArray(doc.plans)||doc.plans.length>256||!Array.isArray(doc.history)||doc.history.length>10000||!Array.isArray(doc.favorites)||doc.favorites.length>1000||!doc.drafts||typeof doc.drafts!=='object'||Array.isArray(doc.drafts))return false;
    if(doc.courseWeek!==undefined&&(!Number.isInteger(doc.courseWeek)||doc.courseWeek<1||doc.courseWeek>12))return false;
    if(doc.courseSession!==undefined&&!['A','B','C','M'].includes(doc.courseSession))return false;
    if(!doc.favorites.every(value=>/^[\w-]{11}$/.test(value)))return false;
    if(!doc.plans.every(plan=>plan&&safeId(plan.id)&&text(plan.name,100)&&plan.name.trim()&&text(plan.note)&&Array.isArray(plan.exercises)&&plan.exercises.length<=100&&plan.exercises.every(exercise)&&(!plan.course||course(plan.course))))return false;
    if(new Set(doc.plans.map(plan=>plan.id)).size!==doc.plans.length||doc.plans.some(plan=>new Set(plan.exercises.map(e=>e.id)).size!==plan.exercises.length))return false;
    for(const draft of Object.values(doc.drafts)){
      if(draft?.editHistoryId!==undefined&&!safeId(draft.editHistoryId))return false;
      if(!draft||!date(draft.date)||!text(draft.note)||!draft.rows||typeof draft.rows!=='object'||Array.isArray(draft.rows)||Object.keys(draft.rows).length>100)return false;
      if(!Object.values(draft.rows).every(rows=>Array.isArray(rows)&&rows.length<=30&&rows.every(row)))return false;
    }
    if(!doc.history.every(h=>h&&safeId(h.id)&&text(h.planName,100)&&date(h.date)&&text(h.note)&&Number.isFinite(h.savedAt)&&Array.isArray(h.exercises)&&h.exercises.length<=100&&h.exercises.every(logged)&&(!h.course||course(h.course))&&(h.complete===undefined||typeof h.complete==='boolean')&&(h.duration===undefined||num(h.duration,240))))return false;
    if(!doc.history.every(validSnapshot))return false;
    return records.validMetadata(doc)&&programs.validExtras(doc)&&(!doc.proposal||proposals.valid(doc.proposal))&&(!doc.previousProposal||proposals.valid(doc.previousProposal))&&proposals.validVersions(doc.programVersions);
  }

  function valid(doc){try{return !!validate(doc);}catch{return false;}}
  const api={valid};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TreinoDocumentContract=api;
})(typeof window!=='undefined'?window:globalThis);
