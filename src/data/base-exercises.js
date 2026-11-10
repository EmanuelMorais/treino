/* Original public exercise definitions; no prescription or private plans. */
(function(root){
 const library=[
  ['squat','Agachamento com peso corporal','squat',[],['Quadríceps','Glúteos'],'Desce até uma amplitude confortável e mantém os pés apoiados.'],
  ['goblet','Agachamento goblet','squat',['dumbbells'],['Quadríceps','Glúteos'],'Segura um haltere junto ao peito e sobe com controlo.'],
  ['legpress','Leg press','squat',['machines'],['Quadríceps','Glúteos'],'Ajusta o banco e usa uma amplitude controlada, sem bloquear os joelhos.'],
  ['lunge','Afundo estático','squat',[],['Quadríceps','Glúteos'],'Pés afastados, desce na vertical; uma série inclui os dois lados.',true],
  ['bridge','Ponte de glúteos','hinge',[],['Glúteos','Posteriores da coxa'],'Empurra o chão e eleva a bacia sem arquear a lombar.'],
  ['db-rdl','Peso morto romeno com halteres','hinge',['dumbbells'],['Glúteos','Posteriores da coxa'],'Leva a bacia atrás com os pesos junto às pernas. Carga indicada por haltere.'],
  ['bar-rdl','Peso morto romeno com barra','hinge',['barbell'],['Glúteos','Posteriores da coxa'],'Leva a bacia atrás mantendo a barra junto às pernas. Regista kg totais da barra.'],
  ['pushup','Flexão de braços','push',[],['Peito','Tríceps'],'Corpo alinhado; usa a variante de joelhos se necessário.'],
  ['knee-pushup','Flexão de braços com joelhos apoiados','push',[],['Peito','Tríceps'],'Mantém tronco e coxas alinhados e controla a descida.'],
  ['floor-press','Supino no chão com halteres','push',['dumbbells'],['Peito','Tríceps'],'Apoia suavemente os braços no chão e empurra sem perder o controlo. Kg por haltere.'],
  ['bench-press','Supino com halteres','push',['dumbbells','bench'],['Peito','Tríceps'],'Pés apoiados, escápulas estáveis. Regista a carga por haltere.'],
  ['machine-press','Chest press na máquina','push',['machines'],['Peito','Tríceps'],'Ajusta o banco para as pegas ficarem à altura do peito.'],
  ['db-row','Remada com um haltere','pull',['dumbbells'],['Costas','Bíceps'],'Inclina o tronco com controlo e puxa o cotovelo para trás. Kg por haltere; os dois lados contam como uma série.',true],
  ['band-row','Remada sentada com elástico','pull',['bands'],['Costas','Bíceps'],'Passa o elástico pela zona média dos pés, verifica a fixação e puxa junto ao tronco.'],
  ['machine-row','Remada na máquina','pull',['machines'],['Costas','Bíceps'],'Mantém o tronco estável e puxa os cotovelos para trás.'],
  ['prone-w','Elevação em W deitado','pull',[],['Costas','Ombros'],'De barriga para baixo, eleva suavemente os braços em W sem forçar a lombar. Este movimento não equivale a uma remada com carga.'],
  ['seated-press','Shoulder press sentado com halteres','shoulders',['dumbbells','bench'],['Ombros','Tríceps'],'Sentado, empurra os halteres sem arquear a lombar. Confirma que existe altura livre; kg por haltere.'],
  ['kneeling-press','Shoulder press com um haltere em meio-ajoelhado','shoulders',['dumbbells'],['Ombros','Tríceps'],'Um joelho no chão e tronco estável; pressiona um lado de cada vez. Confirma a altura livre.',true],
  ['lateral-raise','Elevação lateral com halteres','shoulders',['dumbbells'],['Ombros'],'Sobe os braços até uma altura confortável, sem encolher os ombros. Kg por haltere.'],
  ['curl','Flexão de cotovelos com halteres','arms',['dumbbells'],['Bíceps'],'Mantém os cotovelos junto ao tronco e evita embalar o peso.'],
  ['calf','Elevação de gémeos','calves',[],['Gémeos'],'Sobe e desce os calcanhares com controlo.'],
  ['deadbug','Dead bug','core',[],['Core'],'Move braço e perna opostos mantendo o tronco estável. Uma série inclui ambos os lados.',true],
  ['bird-dog','Bird dog','core',[],['Core'],'Em quatro apoios, estende braço e perna opostos sem rodar o tronco.',true],
  ['cat-cow','Mobilidade em quatro apoios','mobility',[],['Core'],'Alterna suavemente flexão e extensão, sem forçar os limites.'],
  ['hip-mobility','Mobilidade da anca em meio-ajoelhado','mobility',[],['Glúteos'],'Move a bacia suavemente para a frente, mantendo o tronco alinhado. Sem dor.',true],
 ].map(([id,name,pattern,equipment,muscles,how,unilateral=false])=>({id,name,pattern,equipment,muscles,how,unilateral}));
 const api={library};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.TreinoBaseExercises=api;
})(typeof window!=='undefined'?window:globalThis);
