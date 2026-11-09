/* Pure sync rules shared by browser and tests. */
(function(root){
 const rules={
  decide({localExists,dirty,baseRevision,remote}){
   if(!remote)return localExists?'push':'create';
   if(!localExists)return 'pull';
   if(!dirty)return 'pull';
   return Number(baseRevision||0)===Number(remote.revision)?'push':'conflict';
  },
  afterSave({sentSequence,currentSequence}){return sentSequence!==currentSequence;},
  isConflict(error){return error?.code==='PT409'||/revision_conflict/.test(error?.message||'');}
 };
 if(typeof module==='object'&&module.exports)module.exports=rules;else root.TreinoSyncRules=rules;
})(typeof window!=='undefined'?window:this);
