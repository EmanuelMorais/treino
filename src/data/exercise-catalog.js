/* Original editorial metadata. Demonstrations use explicit YouTube searches.
 * Selection preferences and prescription are defined separately in program-engine.js.
 */
(function (root) {
  const base = typeof module !== 'undefined' && module.exports ? require('./base-exercises.js') : root.TreinoBaseExercises;
  const EQUIPMENT = {
    dumbbells: 'Halteres', barbell: 'Barra e discos', bench: 'Banco plano', incline_bench: 'Banco inclinável',
    rack: 'Suporte / rack', bands: 'Elásticos', band_anchor: 'Ancoragem para elástico', chair: 'Cadeira estável',
    step: 'Degrau / plataforma estável', wall: 'Parede livre', pullup: 'Barra de elevações', ab_wheel: 'Rolo abdominal',
    machine_chest_press: 'Máquina de chest press', machine_row: 'Máquina de remada', machine_leg_press: 'Leg press',
    machine_lat: 'Máquina de puxada vertical', machine_leg_extension: 'Máquina de extensão de pernas',
    machine_leg_curl: 'Máquina de flexão de pernas', machine_calf: 'Máquina de gémeos',
    machine_pec_deck: 'Peck deck', machine_reverse_fly: 'Máquina de voos invertidos',
    machine_shoulder_press: 'Máquina de shoulder press', machine_abduction: 'Máquina de abdução da anca',
    machine_adduction: 'Máquina de adução da anca', cable_low: 'Polia baixa e pega', cable_high: 'Polia alta e pega'
  };
  const DIRECTIONS = { squat: 'joelho', hinge: 'anca', push: 'horizontal', pull: 'horizontal', shoulders: 'vertical', core: 'tronco', arms: 'acessório', calves: 'acessório', mobility: 'mobilidade', carry: 'transporte', scapular: 'controlo escapular', vertical_pull: 'vertical' };
  const machines = { legpress: 'machine_leg_press', 'machine-press': 'machine_chest_press', 'machine-row': 'machine_row' };
  const english = {
    squat: 'bodyweight squat', goblet: 'goblet squat', legpress: 'leg press', lunge: 'static lunge split squat',
    bridge: 'glute bridge', 'db-rdl': 'dumbbell romanian deadlift', 'bar-rdl': 'barbell romanian deadlift',
    pushup: 'push up', 'knee-pushup': 'kneeling push up', 'floor-press': 'dumbbell floor press',
    'bench-press': 'dumbbell bench press', 'machine-press': 'machine chest press', 'db-row': 'single arm dumbbell row',
    'band-row': 'seated resistance band row', 'machine-row': 'machine row', 'prone-w': 'prone w raise',
    'seated-press': 'seated dumbbell shoulder press', 'kneeling-press': 'half kneeling single arm press',
    'lateral-raise': 'dumbbell lateral raise', curl: 'dumbbell biceps curl', calf: 'standing calf raise',
    deadbug: 'dead bug', 'bird-dog': 'bird dog', 'cat-cow': 'cat cow', 'hip-mobility': 'half kneeling hip mobility'
  };
  const originals = base.library.map(e => ({
    ...e, aliases: [english[e.id]], equipment: e.equipment.map(x => x === 'machines' ? machines[e.id] : x),
    pattern: e.id === 'prone-w' ? 'scapular' : e.id === 'lateral-raise' ? 'accessory' : e.pattern,
    level: ['prone-w','squat','bridge','knee-pushup','calf','cat-cow','hip-mobility'].includes(e.id) ? 'beginner' : 'regular',
    overhead: ['seated-press','kneeling-press'].includes(e.id), walking: false, unit: 'reps'
  }));
  // id, name, English alias, pattern, required equipment, muscles, execution cue, level, unit, unilateral, overhead, walking.
  const additions = [
    ['reverse-lunge','Afundo atrás','reverse lunge','squat',[],['Quadríceps','Glúteos'],'Dá um passo atrás e regressa à posição inicial com controlo.','regular','reps',true],
    ['side-lunge','Afundo lateral','lateral lunge side lunge','squat',[],['Quadríceps','Glúteos'],'Transfere o peso para a perna que flete e mantém o outro pé apoiado.','regular','reps',true],
    ['single-bridge','Ponte de glúteos numa perna','single leg glute bridge','hinge',[],['Glúteos','Posteriores da coxa'],'Mantém a bacia nivelada enquanto elevas e baixas com uma perna apoiada.','regular','reps',true],
    ['plank','Prancha de antebraços','forearm plank','core',[],['Core'],'Mantém o tronco alinhado e respira durante a posição.','beginner','s'],
    ['side-plank','Prancha lateral','side plank','core',[],['Core'],'Apoia o antebraço e mantém a bacia alinhada com o tronco.','regular','s',true],
    ['side-plank-knees','Prancha lateral com joelhos apoiados','side plank knees','core',[],['Core'],'Mantém os joelhos apoiados e eleva a bacia sem rodar o tronco.','beginner','s',true],
    ['reverse-crunch','Abdominal inverso','reverse crunch','core',[],['Core'],'Eleva suavemente a bacia sem embalar as pernas.','regular'],
    ['heel-taps','Toques de calcanhar deitado','supine heel taps','core',[],['Core'],'Alterna os apoios de calcanhar mantendo o tronco estável.','beginner','reps',true],
    ['pike-pushup','Flexão em pike','pike push up','shoulders',[],['Ombros','Tríceps'],'Com a bacia elevada, flete os braços e regressa com controlo.','experienced'],
    ['wall-pushup','Flexão na parede','wall push up','push',['wall'],['Peito','Tríceps'],'Apoia as mãos na parede e aproxima o tronco mantendo o corpo alinhado.','beginner'],
    ['sit-stand','Sentar e levantar da cadeira','sit to stand chair squat','squat',['chair'],['Quadríceps','Glúteos'],'Usa uma cadeira estável; levanta e volta a sentar com controlo.','beginner'],
    ['stepup','Subida para degrau','step up','squat',['step'],['Quadríceps','Glúteos'],'Sobe para uma plataforma estável usando a perna apoiada e controla a descida.','regular','reps',true],
    ['single-calf','Elevação de gémeos numa perna','single leg calf raise','calves',[],['Gémeos'],'Eleva e baixa o calcanhar com controlo, mantendo o equilíbrio.','regular','reps',true],
    ['db-deadlift','Peso morto com halteres','dumbbell deadlift','hinge',['dumbbells'],['Glúteos','Posteriores da coxa'],'Mantém os halteres perto das pernas durante a subida e descida.','regular'],
    ['staggered-rdl','Peso morto romeno em apoio desencontrado','staggered stance dumbbell deadlift b stance rdl','hinge',['dumbbells'],['Glúteos','Posteriores da coxa'],'A perna de trás apoia o equilíbrio; leva a bacia atrás sobre a perna principal.','regular','reps',true],
    ['single-db-rdl','Peso morto romeno numa perna com halteres','single leg dumbbell rdl','hinge',['dumbbells'],['Glúteos','Posteriores da coxa'],'Leva a bacia atrás sem rodar a anca e regressa com equilíbrio.','experienced','reps',true],
    ['db-front-squat','Agachamento frontal com dois halteres','double dumbbell front squat','squat',['dumbbells'],['Quadríceps','Glúteos'],'Mantém os halteres junto aos ombros e os pés apoiados durante o agachamento.','regular'],
    ['db-reverse-lunge','Afundo atrás com halteres','dumbbell reverse lunge','squat',['dumbbells'],['Quadríceps','Glúteos'],'Segura os halteres ao lado do corpo e dá um passo atrás com controlo.','regular','reps',true],
    ['db-split-squat','Afundo estático com halteres','dumbbell split squat','squat',['dumbbells'],['Quadríceps','Glúteos'],'Mantém os pés desencontrados e desce sem deslocar os apoios.','regular','reps',true],
    ['bulgarian','Agachamento búlgaro com halteres','bulgarian split squat','squat',['dumbbells','bench'],['Quadríceps','Glúteos'],'Apoia o pé traseiro num banco estável e controla o movimento da perna da frente.','experienced','reps',true],
    ['db-sumo','Agachamento sumo com haltere','dumbbell sumo squat','squat',['dumbbells'],['Quadríceps','Glúteos'],'Segura o haltere entre as pernas e acompanha a direção dos pés com os joelhos.','regular'],
    ['incline-db-press','Supino inclinado com halteres','incline dumbbell bench press','push',['dumbbells','incline_bench'],['Peito','Ombros','Tríceps'],'Apoia as costas no banco inclinado e controla a descida dos halteres.','regular'],
    ['db-fly','Aberturas com halteres no banco','dumbbell chest fly','push',['dumbbells','bench'],['Peito'],'Abre os braços com os cotovelos ligeiramente fletidos numa amplitude controlada.','regular'],
    ['chest-supported-row','Remada com peito apoiado no banco inclinado','chest supported dumbbell row','pull',['dumbbells','incline_bench'],['Costas','Bíceps'],'Mantém o peito apoiado e puxa os cotovelos sem elevar o tronco.','regular'],
    ['db-bent-row','Remada inclinada com dois halteres','bent over dumbbell row','pull',['dumbbells'],['Costas','Bíceps'],'Mantém o tronco estável e puxa os halteres junto ao corpo.','regular'],
    ['db-reverse-fly','Voos invertidos com halteres','dumbbell reverse fly rear delt raise','scapular',['dumbbells'],['Ombros','Costas'],'Inclina o tronco e afasta os braços sem embalar os pesos.','regular'],
    ['hammer-curl','Curl martelo com halteres','dumbbell hammer curl','arms',['dumbbells'],['Bíceps'],'Flete os cotovelos mantendo as palmas voltadas uma para a outra.','beginner'],
    ['alternating-curl','Curl alternado com halteres','alternating dumbbell curl','arms',['dumbbells'],['Bíceps'],'Alterna os braços sem deslocar os cotovelos nem embalar o tronco.','beginner','reps',true],
    ['lying-db-triceps','Extensão de tríceps deitado no chão','lying dumbbell triceps extension floor skull crusher','arms',['dumbbells'],['Tríceps'],'Flete e estende os cotovelos mantendo os braços estáveis.','regular'],
    ['overhead-db-triceps','Extensão de tríceps acima da cabeça','overhead dumbbell triceps extension','arms',['dumbbells'],['Tríceps'],'Mantém o tronco estável e move os antebraços; confirma a altura livre.','regular','reps',false,true],
    ['farmer-carry','Caminhada do fazendeiro com halteres','farmers carry farmer walk','carry',['dumbbells'],['Core','Costas'],'Caminha com passos controlados e os halteres ao lado do corpo.','regular','steps',false,false,true],
    ['suitcase-carry','Caminhada com um haltere ao lado','dumbbell suitcase carry','carry',['dumbbells'],['Core'],'Mantém o tronco direito enquanto caminhas com o peso num só lado.','regular','steps',true,false,true],
    ['db-calf','Elevação de gémeos com halteres','dumbbell calf raise','calves',['dumbbells'],['Gémeos'],'Sobe e desce os calcanhares sem embalar os halteres.','regular'],
    ['db-bridge','Ponte de glúteos com haltere','dumbbell glute bridge','hinge',['dumbbells'],['Glúteos','Posteriores da coxa'],'Apoia o haltere sobre a bacia com as mãos e controla a elevação.','regular'],
    ['standing-db-press','Shoulder press em pé com halteres','standing dumbbell shoulder press','shoulders',['dumbbells'],['Ombros','Tríceps'],'Empurra os halteres sem inclinar o tronco; confirma a altura livre.','regular','reps',false,true],
    ['bar-deadlift','Peso morto com barra','barbell deadlift','hinge',['barbell'],['Glúteos','Posteriores da coxa','Costas'],'Mantém a barra junto às pernas e ensaia o movimento com carga adaptada.','regular'],
    ['bar-row','Remada inclinada com barra','barbell bent over row','pull',['barbell'],['Costas','Bíceps'],'Mantém o tronco inclinado e estável enquanto puxas a barra.','regular'],
    ['bar-bench','Supino com barra','barbell bench press','push',['barbell','bench','rack'],['Peito','Tríceps'],'Usa banco e suportes adequados e controla a barra na descida.','regular'],
    ['bar-press','Shoulder press com barra a partir de suporte','barbell overhead press','shoulders',['barbell','rack'],['Ombros','Tríceps'],'Retira a barra do suporte e empurra sem arquear o tronco; confirma a altura livre.','regular','reps',false,true],
    ['back-squat','Agachamento com barra nas costas','barbell back squat','squat',['barbell','rack'],['Quadríceps','Glúteos'],'Usa suportes adequados e controla a descida com os pés apoiados.','experienced'],
    ['front-squat','Agachamento frontal com barra','barbell front squat','squat',['barbell','rack'],['Quadríceps','Glúteos'],'Mantém a barra apoiada à frente dos ombros e o tronco estável.','experienced'],
    ['bar-hip-thrust','Hip thrust com barra e banco','barbell hip thrust','hinge',['barbell','bench'],['Glúteos'],'Apoia as costas num banco estável e eleva a bacia sem hiperestender a lombar.','regular'],
    ['bar-curl','Curl de bíceps com barra','barbell biceps curl','arms',['barbell'],['Bíceps'],'Flete os cotovelos mantendo o tronco estável e a barra controlada.','beginner'],
    ['band-anchor-row','Remada com elástico ancorado','standing anchored resistance band row','pull',['bands','band_anchor'],['Costas','Bíceps'],'Confirma a ancoragem e puxa mantendo o tronco estável.','beginner'],
    ['band-chest-press','Press de peito com elástico ancorado','resistance band chest press','push',['bands','band_anchor'],['Peito','Tríceps'],'Com a ancoragem atrás, empurra as mãos à frente sem perder o alinhamento.','regular'],
    ['band-overhead','Shoulder press com elástico sob os pés','resistance band overhead press','shoulders',['bands'],['Ombros','Tríceps'],'Mantém o elástico seguro sob os pés e confirma a altura acima da cabeça.','regular','reps',false,true],
    ['band-curl','Curl de bíceps com elástico','resistance band biceps curl','arms',['bands'],['Bíceps'],'Prende o elástico sob os pés e flete os cotovelos sem embalar.','beginner'],
    ['band-triceps','Extensão de tríceps com elástico ancorado','band triceps pushdown','arms',['bands','band_anchor'],['Tríceps'],'Usa uma ancoragem adequada e estende os cotovelos mantendo os braços estáveis.','regular'],
    ['band-pullapart','Abertura de elástico à frente do peito','band pull apart','scapular',['bands'],['Ombros','Costas'],'Afasta as mãos controlando a tensão sem encolher os ombros.','beginner'],
    ['band-facepull','Face pull com elástico ancorado','resistance band face pull','scapular',['bands','band_anchor'],['Ombros','Costas'],'Puxa o elástico em direção ao rosto com a ancoragem segura e os ombros controlados.','regular'],
    ['band-lat','Puxada vertical com elástico ancorado','resistance band lat pulldown','vertical_pull',['bands','band_anchor'],['Costas','Bíceps'],'Usa uma ancoragem elevada apropriada e puxa os cotovelos para baixo.','regular'],
    ['lat-pulldown','Puxada vertical na máquina','lat pulldown machine','vertical_pull',['machine_lat'],['Costas','Bíceps'],'Ajusta o apoio das pernas e puxa a pega à frente do corpo com controlo.','regular'],
    ['leg-extension','Extensão de pernas na máquina','leg extension machine','accessory',['machine_leg_extension'],['Quadríceps'],'Ajusta os apoios à tua posição e estende as pernas com controlo.','beginner'],
    ['leg-curl','Flexão de pernas na máquina','leg curl machine','accessory',['machine_leg_curl'],['Posteriores da coxa'],'Ajusta a máquina e flete os joelhos sem mover a bacia.','beginner'],
    ['machine-calf','Elevação de gémeos na máquina','machine calf raise','calves',['machine_calf'],['Gémeos'],'Ajusta os apoios e controla a subida e a descida dos calcanhares.','beginner'],
    ['pec-deck','Aberturas na máquina peck deck','pec deck chest fly machine','push',['machine_pec_deck'],['Peito'],'Ajusta o assento e aproxima os braços sem embalar o tronco.','beginner'],
    ['reverse-machine','Voos invertidos na máquina','reverse pec deck rear delt machine','scapular',['machine_reverse_fly'],['Ombros','Costas'],'Mantém o peito apoiado e afasta os braços com controlo.','beginner'],
    ['machine-overhead','Shoulder press na máquina','machine shoulder press','shoulders',['machine_shoulder_press'],['Ombros','Tríceps'],'Ajusta o assento e empurra as pegas sem arquear o tronco.','regular','reps',false,true],
    ['hip-abduction','Abdução da anca na máquina','hip abduction machine','accessory',['machine_abduction'],['Glúteos'],'Afasta os joelhos com controlo mantendo a bacia apoiada.','beginner'],
    ['hip-adduction','Adução da anca na máquina','hip adduction machine','accessory',['machine_adduction'],['Adutores'],'Aproxima as pernas com controlo e sem embalar a bacia.','beginner'],
    ['cable-row','Remada na polia baixa','seated cable row','pull',['cable_low'],['Costas','Bíceps'],'Usa uma pega e posição adequadas e puxa sem embalar o tronco.','regular'],
    ['cable-triceps','Extensão de tríceps na polia alta','cable triceps pushdown','arms',['cable_high'],['Tríceps'],'Mantém os braços estáveis enquanto estendes os cotovelos.','beginner'],
    ['cable-curl','Curl de bíceps na polia baixa','cable biceps curl','arms',['cable_low'],['Bíceps'],'Flete os cotovelos sem inclinar o tronco para levantar a carga.','beginner'],
    ['thoracic-rotation','Rotação torácica em quatro apoios','quadruped thoracic rotation','mobility',[],['Costas'],'Roda suavemente a parte superior do tronco sem forçar a amplitude.','beginner','reps',true],
    ['hip-9090','Mobilidade da anca 90/90','90 90 hip mobility','mobility',[],['Glúteos'],'Alterna a posição das pernas devagar numa amplitude confortável.','regular','reps',true],
    ['ankle-wall','Mobilidade do tornozelo junto à parede','knee to wall ankle mobility','mobility',['wall'],['Gémeos'],'Aproxima o joelho da parede mantendo o calcanhar apoiado.','beginner','reps',true],
    ['hip-flexor-hold','Alongamento dos flexores da anca em meio-ajoelhado','half kneeling hip flexor stretch','mobility',[],['Flexores da anca'],'Mantém a bacia controlada e procura uma tensão suave sem forçar.','beginner','s',true],
    ['ab-wheel','Rolo abdominal a partir dos joelhos','kneeling ab wheel rollout','core',['ab_wheel'],['Core'],'Avança apenas até onde consegues manter o tronco controlado e regressar.','experienced']
  ].map(([id,name,alias,pattern,equipment,muscles,how,level='regular',unit='reps',unilateral=false,overhead=false,walking=false]) => ({id,name,aliases:[alias],pattern,equipment,muscles,how,level,unit,unilateral,overhead,walking}));
  const exercises = [...originals, ...additions].map(e => ({
    ...e, pattern: ['db-fly','pec-deck'].includes(e.id) ? 'accessory' : e.pattern,
    direction: ['db-fly','pec-deck'].includes(e.id) ? 'adução' : DIRECTIONS[e.pattern] || 'acessório',
    loadReference: e.equipment.includes('dumbbells') ? 'per_dumbbell' : e.equipment.includes('barbell') ? 'barbell_total' : e.equipment.some(x => x.startsWith('machine_') || x.startsWith('cable_')) ? 'machine_stack' : e.equipment.includes('bands') || e.equipment.includes('ab_wheel') ? 'unspecified' : 'bodyweight',
    posture: e.id === 'seated-press' || e.id === 'machine-overhead' ? 'seated' : e.id === 'kneeling-press' ? 'kneeling' : 'other',
    contentStatus: 'editorial', provenance: 'treino-catalogue-1', video: ''
  }));
  // Execution guidance shared by every exercise of a movement pattern; the exercise adds its own cue.
  const PATTERN_GUIDES = {
    squat: { start: 'Pés à largura dos ombros ou um pouco mais, apoiados por inteiro. Peito aberto e abdómen firme.', move: 'Desce como se te fosses sentar, com os joelhos a acompanhar a direção dos pés, até onde manténs os calcanhares no chão. Sobe empurrando o chão.', avoid: 'Evita que os joelhos fujam para dentro e que os calcanhares levantem.' },
    hinge: { start: 'Pés à largura da anca, joelhos ligeiramente fletidos e costas direitas.', move: 'Leva a bacia para trás mantendo o peso junto ao corpo, até sentires os posteriores da coxa. Regressa contraindo os glúteos.', avoid: 'Evita arredondar a lombar ou transformar o movimento num agachamento.' },
    push: { start: 'Omoplatas juntas e apoiadas, pulsos alinhados com os cotovelos e pés firmes.', move: 'Desce com controlo durante 2–3 segundos até uma amplitude confortável e empurra sem bloquear os cotovelos com força.', avoid: 'Evita abrir os cotovelos a 90° do tronco e levantar os ombros.' },
    pull: { start: 'Tronco estável, peito aberto e ombros afastados das orelhas.', move: 'Começa por puxar a omoplata para trás e leva o cotovelo junto ao tronco. Pausa breve no fim e regressa devagar.', avoid: 'Evita embalar o tronco ou puxar só com o braço.' },
    vertical_pull: { start: 'Braços estendidos acima da cabeça, peito aberto e abdómen firme.', move: 'Puxa os cotovelos para baixo e para os lados do tronco, até as mãos chegarem à altura do queixo ou do peito. Regressa devagar.', avoid: 'Evita inclinar-te muito para trás ou encolher os ombros.' },
    shoulders: { start: 'Abdómen e glúteos firmes, pesos à altura dos ombros e antebraços na vertical.', move: 'Empurra para cima até os braços ficarem quase estendidos e desce com controlo até à altura das orelhas.', avoid: 'Evita arquear a lombar; confirma a altura livre antes de começar.' },
    accessory: { start: 'Tronco estável e uma carga leve que controles em toda a amplitude.', move: 'Sobe em 1–2 segundos, pausa breve e desce em 2–3 segundos.', avoid: 'Evita embalar o corpo ou encolher os ombros para ajudar.' },
    scapular: { start: 'Peito aberto, pescoço relaxado e ombros afastados das orelhas.', move: 'Junta as omoplatas atrás, pausa um segundo e regressa devagar.', avoid: 'Evita compensar com a lombar ou com o pescoço.' },
    arms: { start: 'Cotovelos fixos junto ao tronco (ou apontados para o teto, no tríceps) e pulsos direitos.', move: 'Move apenas o antebraço: sobe em 1–2 segundos e desce em 2–3 segundos, em toda a amplitude.', avoid: 'Evita embalar o tronco ou deslocar os cotovelos.' },
    calves: { start: 'Apoia a parte da frente dos pés, de preferência num degrau, com um apoio leve para o equilíbrio.', move: 'Sobe o mais alto que conseguires, pausa um segundo e desce devagar até sentires os gémeos a alongar.', avoid: 'Evita saltitar ou encurtar o movimento.' },
    core: { start: 'Coluna numa posição neutra, costelas para baixo e abdómen firme.', move: 'Mantém a posição ou move braços e pernas devagar, sem deixar a lombar arquear. Respira normalmente.', avoid: 'Evita suster a respiração ou deixar a bacia cair.' },
    mobility: { start: 'Posição confortável e respiração calma.', move: 'Move-te devagar até sentires uma tensão suave, pausa 1–2 segundos e regressa.', avoid: 'Nunca forces até à dor nem faças movimentos bruscos.' },
    carry: { start: 'Pega nos pesos com as costas direitas, ombros para baixo e abdómen firme.', move: 'Caminha com passos curtos e controlados, sem balançar o tronco.', avoid: 'Evita inclinar-te para o lado do peso; termina antes de perder a postura.' }
  };
  // Structured guide for any exercise: its own cue plus the guidance of its movement pattern.
  function guide(exercise) {
    const definition = exercises.find(e => e.id === (exercise.libraryId || exercise.id));
    const general = PATTERN_GUIDES[exercise.pattern || definition?.pattern];
    const steps = [];
    if (general) steps.push(['Posição inicial', general.start]);
    if (exercise.how || definition?.how) steps.push([general ? 'Neste exercício' : 'Execução', exercise.how || definition.how]);
    if (general) steps.push(['Movimento', general.move], ['Atenção', general.avoid]);
    return steps;
  }
  // English names find more demonstrations; the search is opened only when the person asks.
  function searchQuery(exercise) {
    const definition = exercises.find(e => e.id === (exercise.libraryId || exercise.id));
    return [exercise.name, definition?.aliases?.[0], 'execução técnica'].filter(Boolean).join(' ');
  }
  const api = { VERSION: 1, EQUIPMENT, exercises, PATTERN_GUIDES, guide, searchQuery };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TreinoCatalogData = api;
})(typeof window !== 'undefined' ? window : globalThis);
