/* Evidence scope: general adult guidance plus explicitly authored heuristics. */
(function(root){
 const sources=[
  {id:'acsm-2026',title:'ACSM — resistance training guidelines 2026',url:'https://acsm.org/resistance-training-guidelines-update-2026/',scope:'Orientação geral para adultos saudáveis; não fornece este programa nem todas as doses.',checkedOn:'2026-11-10'},
  {id:'cdc-weight',title:'CDC — physical activity, weight and health',url:'https://www.cdc.gov/healthy-weight-growth/physical-activity/',scope:'Atividade física e controlo do peso; não fornece variantes nem doses deste programa.',checkedOn:'2026-11-10'}
 ];
 const rules=[
  {id:'selection-v2',kind:'application_heuristic',sources:['acsm-2026'],description:'Preferências editoriais por dia, material, espaço e complexidade; variantes estáveis nas semanas.'},
  {id:'general-dose-v2',kind:'application_heuristic',sources:['acsm-2026'],description:'Faixas de repetições/tempo, 1–3 séries, descanso e semanas leves são aproximações da aplicação; não uma transcrição das recomendações.'},
  {id:'time-budget-v2',kind:'application_heuristic',sources:[],description:'Estimativa de execução, lados, descanso e transições; redução de séries para caber no tempo. Não é uma duração medida.'},
  {id:'progression-v1',kind:'application_heuristic',sources:['acsm-2026'],description:'Progressão orientada por desempenho/recuperação e menor aumento disponível, sem prescrever kg automaticamente.'}
 ];
 const api={version:2,reviewStatus:'editorial_not_independently_reviewed',sources,rules};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.TreinoRuleEvidence=api;
})(typeof window!=='undefined'?window:globalThis);
