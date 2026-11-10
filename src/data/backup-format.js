(function(root){
  const records=typeof module!=='undefined'&&module.exports?require('../domain/workout-records.js'):root.TreinoRecords;
  const contract=typeof module!=='undefined'&&module.exports?require('../domain/document-contract.js'):root.TreinoDocumentContract;
  function planEnvelope(plan){return {format:'treino-plan-v2',version:2,minClientBuild:records.CLIENT_BUILD,plan:records.portablePlan(plan)};}
  function decode(value){
    if(value?.minClientBuild>records.CLIENT_BUILD)throw Error('Este ficheiro precisa de uma versão mais recente do Treino. Atualiza a página antes de o importar.');
    if(value?.format==='treino-plan'||value?.format==='treino-plan-v2'){
      if(value.format==='treino-plan-v2'&&value.version!==2||value.format==='treino-plan'&&value.version!==undefined&&value.version!==1)throw Error('Esta versão do ficheiro de plano não é suportada. Atualiza a aplicação.');
      if(!contract.valid({version:1,plans:[value.plan],history:[],drafts:{},favorites:[]}))throw Error('O plano tem exercícios ou medidas inválidos. Os dados atuais mantêm-se.');
      return {kind:'plan',value:records.portablePlan(value.plan)};
    }
    if(!contract.valid(value))throw Error('O ficheiro não é uma cópia de segurança válida desta página.');
    return {kind:'document',value};
  }
  const api={planEnvelope,decode};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TreinoBackupFormat=api;
})(typeof window!=='undefined'?window:globalThis);
