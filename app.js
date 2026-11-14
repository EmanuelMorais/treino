function loadAccountState(next,key,{preserveView=false}={}){
 if(key!==activeStorageKey&&typeof clearReplacementUndo==='function')clearReplacementUndo();
 const previousPlan=selectedPlan,previousView=view,scrollTop=window.scrollY;
 const detailKey=el=>(el.closest('[data-exercise]')?.dataset.exercise||'')+'|'+el.querySelector('summary')?.textContent;
 const openDetails=preserveView?new Set(Array.from($('#content').querySelectorAll('details[open]'),detailKey)):new Set();
 const focused=preserveView&&$('#content').contains(document.activeElement)?document.activeElement:null;
 const focus=focused?{id:focused.id,name:focused.name,value:focused.value,type:focused.type,label:focused.getAttribute('aria-label'),check:focused.getAttribute('data-course-check'),start:focused.selectionStart,end:focused.selectionEnd}:null;
 state=next;activeStorageKey=key;storageOK=true;$('#storage-error').hidden=true;normaliseAccountState();
 const initialPlan='';
 selectedPlan=preserveView&&(!previousPlan||state.plans.some(p=>p.id===previousPlan))?previousPlan:initialPlan;view=preserveView?previousView:'plans';render();
 if(preserveView){
  $('#content').querySelectorAll('details').forEach(el=>{if(openDetails.has(detailKey(el)))el.open=true;});
  const replacement=focus&&Array.from($('#content').querySelectorAll('input,textarea,select')).find(el=>focus.id?el.id===focus.id:focus.label?el.getAttribute('aria-label')===focus.label:focus.check?el.getAttribute('data-course-check')===focus.check:focus.name&&el.name===focus.name&&(focus.type!=='checkbox'||el.value===focus.value));
  if(replacement){replacement.focus({preventScroll:true});if(typeof focus.start==='number'&&typeof replacement.setSelectionRange==='function')replacement.setSelectionRange(focus.start,focus.end);}
  window.scrollTo({top:scrollTop,behavior:'instant'});
 }
 setTimeout(handleWatchImport,0);
}
const KEY='bioforceman-treino-v1';
// Starting points for the questionnaire: each one only pre-fills answers the person can still change.
const HOME_TEMPLATES=[
 {label:'Corpo inteiro',detail:'3 dias · o melhor para começar',preset:{split:'full_body',days:3}},
 {label:'Tronco / pernas',detail:'4 dias · upper / lower',preset:{split:'upper_lower',days:4,experience:'regular'}},
 {label:'Push / pull / legs',detail:'3 ou 6 dias · para quem já treina',preset:{split:'ppl',days:3,experience:'regular'}},
 {label:'Um grupo por dia',detail:'5 dias · bro split',preset:{split:'bro',days:5,experience:'experienced',minutes:50}},
 {label:'Tonificar',detail:'3 dias · pernas e glúteos em destaque',preset:{split:'auto',days:3,goals:['tone'],primaryGoal:'tone',emphasis:'lower'}},
 {label:'Ganhar força',detail:'3 dias · cargas altas, descansos longos',preset:{split:'auto',days:3,goals:['strength'],primaryGoal:'strength',minutes:45}},
 {label:'Mobilidade',detail:'2 dias · mobilidade e força de base',preset:{split:'auto',days:2,goals:['mobility'],primaryGoal:'mobility',minutes:30}}
];
let activeStorageKey=KEY;
const icon=(name)=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${({library:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',plans:'<path d="M8 5H5a2 2 0 0 0-2 2v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a2 2 0 0 0-2-2h-3"/><rect x="8" y="2" width="8" height="6" rx="2"/><path d="m7 14 3 3 7-7"/>',history:'<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2"/>',search:'<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',download:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',plus:'<path d="M12 5v14M5 12h14"/>',today:'<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v10h12V10"/>',program:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',progress:'<path d="M5 20V11M12 20V5M19 20v-6"/>',me:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',more:'<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',chevron:'<path d="m9 5 7 7-7 7"/>',back:'<path d="m15 5-7 7 7 7"/>'})[name]||''}</svg>`;
const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unitLabel=e=>({s:'s',steps:'passos',reps:'reps'}[e.unit]||'reps');
const targetLabel=e=>{const t=String(e.target||'Objetivo pessoal'),m=t.match(/^(.*?)( por (?:lado|direção))$/);return m?m[1]+' '+unitLabel(e)+m[2]:t+' '+unitLabel(e)};
const uid=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const blankRow=()=>({kg:'',reps:'',done:false});
const ex=(name,video,sets=1,start=0,note='')=>({id:uid(),name,video,sets,target:'',unit:'reps',start,note});
const fresh=()=>({version:1,programRevision:14,courseVersion:COURSE.version,courseEnabled:false,courseWeek:1,courseSession:'A',courseChecks:{},favorites:[],plans:[],drafts:{},history:[]});
let accountAccess=false;
function setAccountAccess(allowed,message='Entra na tua conta para aceder aos teus treinos e registos.'){
 accountAccess=allowed;document.body.dataset.auth=allowed?'ready':'locked';$('#auth-gate-detail').textContent=message;
 if(!allowed){$('#content').replaceChildren();closeModal();}else render();
}
let state,storageOK=true,view='plans',category='Todos',format='Todos',search='',page=1,favOnly=false,selectedPlan='',toastTimeout,restDuration=90,restRemaining=90,restUntil=0,restRunning=false,nextAfterSave=null,wakeLock=null;
const $=s=>document.querySelector(s);
function warnStorage(msg){storageOK=false;$('#storage-error').hidden=false;$('#storage-error').textContent=msg;}
function validState(d){return window.TreinoDocumentContract.valid(d);}
state=fresh(); // Private cached documents are loaded only after authentication, by cloud.js.
function persist(){if(!accountAccess||!storageOK)return false;try{localStorage.setItem(activeStorageKey,JSON.stringify(state));if(window.TreinoCloud)window.TreinoCloud.changed();return true;}catch(e){warnStorage('Não foi possível guardar no navegador. Mantém a página aberta e exporta uma cópia de segurança para não perderes os registos.');return false;}}
function toast(msg){$('#toast').textContent=msg;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').textContent='',4000)}
function getPlan(){return state.plans.find(p=>p.id===selectedPlan)||state.plans[0]}
function getDraft(p){if(!Object.hasOwn(state.drafts,p.id))state.drafts[p.id]={date:today(),note:'',rows:{}};const d=state.drafts[p.id];if(d.date!==today()&&!d.datePinned&&!d.note&&Object.values(d.rows).every(rs=>rs.every(r=>!r.kg&&!r.reps&&!r.done)))d.date=today();p.exercises.forEach(e=>{e.exerciseKey||=window.TreinoRecords.exerciseKey(e,p.id);e.loadReference||=window.TreinoRecords.loadReference(e);if(!Object.hasOwn(d.rows,e.id))d.rows[e.id]=Array.from({length:e.sets},blankRow)});return d;}
function setView(v){if(!accountAccess)return;closeModal();view=v;render();window.scrollTo({top:0,behavior:'instant'});}
const NAV_OWNER={profile:'program',library:'program'};
function syncNav(){const owner=NAV_OWNER[view]||view;document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===owner);b.setAttribute('aria-current',b.dataset.view===owner?'page':'false')});}
// One name per screen: the stylesheet uses it to show the account panel, the rest bar and the session layout.
function setScreen(name){document.body.dataset.screen=name;if(name!=='session')$('#rest-bar').hidden=true;}
function openPlan(id){selectedPlan=id;view='plans';render();window.scrollTo({top:0,behavior:'instant'});}
function render(){if(!accountAccess)return;syncNav();if(view==='library'){setScreen('library');renderLibrary();}if(view==='plans'){if(!selectedPlan)renderHome();else renderPlans();}if(view==='program')renderProgram();if(view==='history')renderHistory();if(view==='me')renderMe();if(view==='profile'){setScreen('questionnaire');renderProfile();}}
function duration(v){return v.duration?`${Math.floor(v.duration/60)}:${String(v.duration%60).padStart(2,'0')}`:v.type}
function heading(title,subtitle,extra=''){return `<div class="pagehead"><div><h1>${title}</h1><p class="subtext">${subtitle}</p></div>${extra}</div>`}
function renderLibrary(){
 $('#content').innerHTML=heading('A tua biblioteca<br>de treino.','Explora, escolhe e passa à prática. Os vídeos do canal, com espaço para a tua evolução.',`<span class="count-chip">${CATALOG.length} vídeos · 1 lugar</span>`)+`<section class="hero" aria-label="Rotina em destaque"><div class="hero-content"><span class="eyebrow">Começa por aqui · rotina pública</span><h2>Três movimentos.<br>Uma base de força.</h2><p>Flexão, split squat e remada.<br>Vê a progressão e regista o teu treino.</p><button class="btn lime" id="open-feature">Ver exemplo de vídeo <span aria-hidden="true">↗</span></button></div><button class="hero-image" id="video-feature" aria-label="Ver vídeo Build Full Body Strength in 14 Days"><img src="https://i.ytimg.com/vi/0QXSICOie5c/hqdefault.jpg" alt="" referrerpolicy="no-referrer"><span class="play" aria-hidden="true">▶</span></button></section><div class="section-title"><h2>Explorar os vídeos</h2><span class="results-count" id="result-count"></span></div><div class="toolbar"><div class="search">${icon('search')}<input id="search" type="search" placeholder="Pesquisar: ombros, push-ups, rotina…" aria-label="Pesquisar vídeos" value="${esc(search)}"></div><select id="format" aria-label="Formato"><option value="Todos">Todos os formatos</option><option>Vídeo</option><option>Short</option></select><button class="btn secondary" id="favorites" aria-pressed="${favOnly}">${favOnly?'★':'☆'} Favoritos</button></div><div class="chips" role="group" aria-label="Filtrar por tema">${['Todos','Rotinas','Peito','Costas','Ombros','Braços','Pernas','Core','Mobilidade','Geral'].map(c=>`<button class="chip ${category===c?'active':''}" data-cat="${c}" aria-pressed="${category===c}">${c}</button>`).join('')}</div><div id="video-grid" class="grid"></div><div id="pages" class="pagination"></div><p class="privacy">Os temas são organizados a partir dos títulos. O catálogo inclui rotinas, exercícios e vídeos explicativos. Podes adicionar novos vídeos manualmente aos teus treinos.</p>`;
 $('#format').value=format;$('#search').oninput=e=>{search=e.target.value;page=1;renderCards()};$('#format').onchange=e=>{format=e.target.value;page=1;renderCards()};$('#favorites').onclick=()=>{favOnly=!favOnly;page=1;renderLibrary()};document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{category=b.dataset.cat;page=1;renderLibrary()});$('#video-feature').onclick=()=>openVideo('0QXSICOie5c');$('#open-feature').onclick=()=>openVideo('0QXSICOie5c');renderCards();$('#content .pagehead').insertAdjacentHTML('afterend',exerciseExamplesPanel());bindExerciseExamples();
}
const normalize=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function renderCards(){
 const synonyms={'ombros':'shoulder delt','bracos':'arm bicep tricep forearm','peito':'chest push','costas':'back pull row','pernas':'leg squat calv','rotina':'routine','flexao':'push-up pushup','abdominais':'abs core','corpo inteiro':'full body','principiante':'beginner'};
 const query=normalize(search.trim());const words=(synonyms[query]||'').split(' ').filter(Boolean);
 const filtered=CATALOG.filter(v=>(category==='Todos'||v.tags.includes(category))&&(format==='Todos'||v.type===format)&&(!favOnly||state.favorites.includes(v.id))&&(!query||normalize(v.title+' '+v.tags.join(' ')).includes(query)||words.some(w=>normalize(v.title).includes(w))));
 const total=Math.max(1,Math.ceil(filtered.length/12));page=Math.min(page,total);$('#result-count').textContent=`${filtered.length} resultados`;
 $('#video-grid').innerHTML=filtered.length?filtered.slice((page-1)*12,page*12).map(v=>`<article class="video-card"><div class="cover"><button class="cover-open" data-video="${v.id}" aria-label="Ver ${esc(v.title)}"><img loading="lazy" src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" referrerpolicy="no-referrer"></button><span class="duration">${duration(v)}</span><button class="fav ${state.favorites.includes(v.id)?'saved':''}" data-fav="${v.id}" aria-label="${state.favorites.includes(v.id)?'Remover dos':'Adicionar aos'} favoritos: ${esc(v.title)}" aria-pressed="${state.favorites.includes(v.id)}">${state.favorites.includes(v.id)?'★':'☆'}</button></div><h3><button class="title-button" data-video="${v.id}">${esc(v.title)}</button></h3><div class="meta"><span class="type">${v.type}</span><span>${v.tags.slice(0,2).join(' · ')}</span></div></article>`).join(''):'<div class="empty" style="grid-column:1/-1"><h3>Nenhum vídeo encontrado</h3>Experimenta outro tema ou termo de pesquisa.</div>';
 $('#pages').innerHTML=filtered.length?`<button class="btn secondary" id="prev" ${page===1?'disabled':''}>← Anterior</button><span>${page} / ${total}</span><button class="btn secondary" id="next" ${page===total?'disabled':''}>Seguinte →</button>`:'';
 document.querySelectorAll('[data-video]').forEach(b=>b.onclick=()=>openVideo(b.dataset.video));document.querySelectorAll('[data-fav]').forEach(b=>b.onclick=()=>{const id=b.dataset.fav;state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];persist();renderCards()});
 if($('#prev'))$('#prev').onclick=()=>{page--;renderCards();$('#search').scrollIntoView({block:'start'})};if($('#next'))$('#next').onclick=()=>{page++;renderCards();$('#search').scrollIntoView({block:'start'})};
}
function modal(title,body,small=false){$('#modal').classList.toggle('small-dialog',small);$('#dialog-title').textContent=title;$('#dialog-content').innerHTML=body;if(!$('#modal').open)$('#modal').showModal()}
function closeModal(){$('#modal').close();$('#dialog-content').innerHTML=''}
$('#modal .close').onclick=closeModal;$('#modal').addEventListener('cancel',()=>{$('#dialog-content').innerHTML=''});
// Remove the embedded player before the external YouTube tab opens.
$('#dialog-content').addEventListener('click',event=>{if(event.target.closest('.video-links a[target="_blank"]'))closeModal();});
function openVideo(id,start=0){if(!/^[\w-]{11}$/.test(id||''))return toast('Vídeo indisponível. Pesquisa o exercício no YouTube.');const v=CATALOG.find(v=>v.id===id);const exercise=state.plans.flatMap(p=>p.exercises).find(e=>e.video===id);const title=v?.title||exercise?.name||'Demonstração do exercício';const matching=state.plans.find(p=>p.video===id&&p.sourceExact);modal('Ver e praticar',`<div class="video-modal-grid"><div><div class="player"><iframe src="https://www.youtube-nocookie.com/embed/${esc(id)}?start=${Math.max(0,start)}&rel=0" title="${esc(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div><div class="video-links"><a href="https://www.youtube.com/watch?v=${esc(id)}&t=${start}s" target="_blank" rel="noopener">Abrir no YouTube ↗</a><span>${v?'Bioforceman':'Vídeo de demonstração'}</span></div><p class="dialog-note">Se o leitor não funcionar ao abrir o ficheiro HTML, usa “Abrir no YouTube”. Os vídeos precisam de internet.</p></div><div class="video-description"><span class="eyebrow">${esc(v?.type||'Vídeo de referência')}</span><h3 style="margin-top:8px">${esc(title)}</h3><p>Consulta a demonstração e regressa à ficha para seguir as séries, os objetivos e as notas.</p>${matching?`<button class="btn full" id="follow-prepared">Seguir este treino completo →</button><p class="dialog-note">${matching.exercises.length} exercícios já preparados, com as doses do excerto.</p>`:''}<label for="add-plan">Adicionar a</label><select id="add-plan">${state.plans.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select><button id="video-add" class="btn full">${icon('plus')} Adicionar exercício</button><p class="dialog-note">Um vídeo pode mostrar vários exercícios. Adiciona uma linha de registo por movimento.</p></div></div>`);if($('#follow-prepared'))$('#follow-prepared').onclick=()=>{selectedPlan=matching.id;closeModal();setView('plans')};$('#video-add').onclick=()=>{if(!state.plans.length){closeModal();return newPlanForm();}selectedPlan=$('#add-plan').value;closeModal();view='plans';render();exerciseForm(null,id)};}
function sourceComparison(p){
 // Only programmes built from a published routine have something to compare with.
 const hasVideo=/^[\w-]{11}$/.test(p.video||''),hasOriginal=p.exercises.some(e=>e.originalDose||(e.originalName&&e.originalName!==e.name));
 if(!hasVideo&&!hasOriginal)return '';
 return `<div class="source-comparison"><div class="source-comparison-title"><h3>Exercícios e adaptações da rotina</h3>${hasVideo?`<a href="https://www.youtube.com/watch?v=${esc(p.video)}" target="_blank" rel="noopener">Ver a rotina original ↗</a>`:''}</div>${hasOriginal?'<p class="comparison-note">A lista original mantém-se visível. A coluna desta semana é a dose a seguir e registar.</p>':''}<ol>${p.exercises.map(e=>`<li><div class="comparison-name"><strong>${esc(e.name)}</strong>${e.originalName&&e.originalName!==e.name?`<small>No vídeo: ${esc(e.originalName)}</small>`:''}${e.adaptation?`<small>Adaptação: ${esc(e.adaptation)}</small>`:''}${e.adapted?`<small>Alternativa selecionada: ${esc(e.name)}</small>`:''}</div><div class="comparison-dose">${e.originalDose?`<span><b>No vídeo</b>${esc(e.originalDose)}</span>`:''}<span><b>Semana ${p.course.week}</b>${e.sets} × ${esc(targetLabel(e))}</span></div></li>`).join('')}</ol><p class="comparison-note">Uma série unilateral inclui os dois lados. Começa leve nos movimentos novos; as semanas mais leves reduzem o volume.</p></div>`}
function courseWeek(p=getPlan()){return p.course?.session==='M'?state.courseWeek||1:p.course?.week||state.courseWeek||1}
function isCurrentCourse(p){return p.course?.version===COURSE.version&&p.id.startsWith(COURSE.prefix+'-')}
function courseId(week,session='A'){return session==='M'?COURSE.prefix+'-mobility':`${COURSE.prefix}-w${String(week).padStart(2,'0')}-${session}`}
function chooseCourse(week,session='A'){state.courseWeek=week;state.courseSession=session;persist();openPlan(courseId(week,session));}
function courseDone(id){return state.history.some(h=>h.planId===id&&h.complete===true)}
function courseSessions(){return window.TreinoCourse.sessionsOf(COURSE)}
function nextCourseSession(){return window.TreinoCourse.next(state,COURSE)}
function nextCourseLabel(next){const plan=state.plans.find(p=>p.id===next.planId);return `${next.resume?'Retomar':next.finished?'Rever':'Continuar'} · Semana ${next.week} · ${next.session}${plan?.shortTitle?' — '+plan.shortTitle:''}${window.TreinoCourse.optionalOf(COURSE).includes(next.session)?' (opcional)':''}`}
function courseProfile(){modal('Como usar este modelo',`<p>Este programa está guardado na tua conta. As fichas, adaptações e registos são privados e não são distribuídos às contas novas. Podes editar os exercícios ou importar uma ficha recebida.</p><p>Guarda a carga por haltere ou o total da barra conforme a indicação de cada exercício. Não transfiras cargas automaticamente entre variantes.</p>`);}
// Weekly volume: what the programme prescribes, and what was actually recorded.
function courseGoal(){return state.balance?.goal||state.profile?.answers?.primaryGoal||'muscle';}
function courseEmphasis(){return state.balance?.emphasis||state.profile?.answers?.emphasis||'balanced';}
function volumeOptions(){return {goal:courseGoal(),emphasis:courseEmphasis()};}
function dayOffset(days){const date=new Date();date.setDate(date.getDate()-days);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
let balanceRange=null;
// The planned week comes from the 12-week programme or, without one, from the generated programme.
function plannedWeek(){
 if(state.plans.some(isCurrentCourse)){const week=nextCourseSession()?.week||state.courseWeek||1;return {title:`Semana ${week} · previsto`,plans:courseSessions().map(id=>state.plans.find(p=>p.id===courseId(week,id))).filter(Boolean)};}
 const active=state.programVersions?.find(p=>p.id===state.activeProgram);if(!active)return null;
 const week=state.activeProgramWeek||1;return {title:`Semana ${week} · previsto`,plans:state.plans.filter(p=>p.program?.id===active.id&&p.program.week===week&&!p.sessionOnly)};
}
function balanceReport(){
 const planned=plannedWeek();
 if(balanceRange==='plan'&&planned)return {report:window.TreinoVolume.weeklyVolume(planned.plans,volumeOptions()),title:planned.title};
 const days=balanceRange==='28'?28:7;
 return {report:window.TreinoVolume.performedVolume(state.history,{...volumeOptions(),from:dayOffset(days-1)}),title:days===7?'Últimos 7 dias':'Últimas 4 semanas'};
}
function renderBalance(){
 const {report,title}=balanceReport();
 $('#balance-body').innerHTML=volumeChartHTML(report,{title});
 document.querySelectorAll('[data-balance]').forEach(b=>{b.classList.toggle('active',b.dataset.balance===balanceRange);b.setAttribute('aria-pressed',String(b.dataset.balance===balanceRange));});
}
function balanceSectionHTML(){
 const planned=plannedWeek(),recent=state.history.some(h=>h.date>=dayOffset(6));
 if(!['plan','7','28'].includes(balanceRange)||balanceRange==='plan'&&!planned)balanceRange=recent||!planned?'7':'plan';
 const tabs=[...(planned?[['plan','Plano']]:[]),['7','7 dias'],['28','4 semanas']];
 return `<section class="panel balance-panel"><div class="balance-top"><h2>Séries por músculo</h2><div class="seg" role="group" aria-label="Período">${tabs.map(([key,label])=>`<button data-balance="${key}">${label}</button>`).join('')}</div></div><div id="balance-body"></div><div class="balance-target"><label>Objetivo<select id="balance-goal">${Object.entries(programs.GOALS).map(([k,v])=>`<option value="${k}" ${k===courseGoal()?'selected':''}>${esc(v)}</option>`).join('')}</select></label><label>Ênfase<select id="balance-emphasis">${Object.entries(programs.EMPHASIS).map(([k,v])=>`<option value="${k}" ${k===courseEmphasis()?'selected':''}>${esc(v)}</option>`).join('')}</select></label></div><p class="auth-note">O objetivo e a ênfase só mudam a faixa-alvo do gráfico, não as fichas. A mobilidade não conta.</p></section>`;
}
function bindBalance(){
 document.querySelectorAll('[data-balance]').forEach(b=>b.onclick=()=>{balanceRange=b.dataset.balance;renderBalance();});
 for(const [id,key] of [['#balance-goal','goal'],['#balance-emphasis','emphasis']])$(id).onchange=e=>{
  const next={...state.balance,[key]:e.target.value};
  if(!validState({...state,balance:next}))return toast('Valor inválido.');
  state.balance=next;persist();renderBalance();
 };
 renderBalance();
}
function courseSources(){const w=courseWeek();const rows=courseSessions().map(id=>state.plans.find(p=>p.id===courseId(w,id))).filter(Boolean);modal('Sessões, fontes e adaptações',`${rows.map(p=>`<p><b>${esc(p.course.session)} — ${esc(p.shortTitle||p.name)}</b>${p.description?'<br>'+esc(p.description):''}</p>`).join('')}${(COURSE.sources||[]).length?`<div class="source-links">${COURSE.sources.map(([n,url])=>/^https:\/\//.test(url)?`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(n)} ↗</a>`:'').join('')}</div>`:''}<p>${esc(COURSE.sourcesNote||'A sequência, o volume e a progressão são uma organização própria.')}</p>`);}
function courseOriginals(){const originals=state.plans.filter(p=>p.sourceExact);modal('Rotinas originais de referência',`<p class="dialog-note" style="margin-top:0">Estas fichas preservam as doses publicadas. Não são sessões para acrescentar ao programa pessoal; servem para veres a origem da seleção.</p><div class="other-plans">${originals.map(p=>`<button class="other-plan" data-original-plan="${esc(p.id)}"><strong>${esc(p.name)}</strong><span>${p.exercises.length} exercícios · ${p.exercises.reduce((n,e)=>n+e.sets,0)} séries ↗</span></button>`).join('')}</div>`,true);document.querySelectorAll('[data-original-plan]').forEach(b=>b.onclick=()=>{closeModal();openPlan(b.dataset.originalPlan)});}

function normaliseAccountState(){
 if(window.TreinoRecords)state=window.TreinoRecords.upgrade(state);
 COURSE=window.TreinoCourse.pick(state,COURSES,state.courseVersion)||COURSE;state.courseVersion=COURSE.version;
 state.courseEnabled??=state.plans.some(p=>isCurrentCourse(p));
 if(!Number.isInteger(state.courseWeek)||state.courseWeek<1||state.courseWeek>12)state.courseWeek=1;
 if(![...courseSessions(),'M'].includes(state.courseSession))state.courseSession=courseSessions()[0];
 if(!state.courseChecks||typeof state.courseChecks!=='object'||Array.isArray(state.courseChecks))state.courseChecks={};
}
function previousExercise(e,date){
 const p=getPlan(),d=p&&state.drafts[p.id];
 return window.TreinoRecords.previous(state.history,e,date,d?.editHistoryId);
}
function otherPlans(){const ps=state.plans.filter(p=>!isCurrentCourse(p)&&!p.sessionOnly);modal('Arquivo de planos e rotinas de referência',`<p class="dialog-note" style="margin-top:0">O programa pessoal tem o seu seletor de semanas e sessões. Estas fichas anteriores e rotinas de referência mantêm-se acessíveis; não são trabalho para somar ao programa.</p><div class="other-plans">${ps.map(p=>`<button class="other-plan" data-other-plan="${esc(p.id)}"><strong>${p.course?'Programa anterior · ':''}${esc(p.name)}</strong><span>${p.exercises.length} exercícios${p.duration?' · '+esc(p.duration):''} ↗</span></button>`).join('')}</div>`,true);document.querySelectorAll('[data-other-plan]').forEach(b=>b.onclick=()=>{closeModal();openPlan(b.dataset.otherPlan)});}
function changeVariant(e){
 const p=getPlan(),d=getDraft(p),records=window.TreinoRecords;
 if(records.hasValues(d.rows[e.id]))return toast('Guarda a sessão antes de trocar a variante deste exercício.');
 const alternative=e.alternative;if(!alternative)return;
 const fields=['name','video','start','how','cue','note','sourceDose','unit','target','loadHint','restSeconds','exerciseKey','loadReference','libraryId','noLoad','primaryExample','exampleIds'];
 const before={};for(const key of fields)if(e[key]!==undefined)before[key]=e[key];
 before.label=e.adapted?'Usar alternativa preparada':'Voltar ao movimento da ficha';
 for(const key of fields)if(alternative[key]!==undefined)e[key]=alternative[key];
 e.exerciseKey=alternative.exerciseKey||'variant:'+p.id+':'+e.id+':'+(e.adapted?'base':'alternative');
 for(const key of ['libraryId','primaryExample','exampleIds'])if(alternative[key]===undefined)delete e[key];
 e.loadReference=alternative.loadReference||records.loadReference({note:alternative.note||'',noLoad:alternative.noLoad});
 e.noLoad=e.loadReference==='bodyweight'||alternative.noLoad===true;
 e.loadHint=alternative.loadHint||'Variante alterada: recalibra a carga e confirma a unidade indicada na ficha.';
 e.alternative=before;e.adapted=!e.adapted;persist();renderPlans();toast('Variante atualizada. O histórico anterior mantém-se.');
}
function previousRowLabel(e,row){
 if(!row||row.reps===''||row.reps===undefined)return '—';
 const amount=esc(row.reps)+(e.unit==='s'?' s':e.unit==='steps'?' passos':'');
 return row.kg!==''&&row.kg!==undefined&&!e.noLoad?`${esc(row.kg)} kg × ${amount}`:amount+(e.unit==='s'||e.unit==='steps'?'':' reps');
}
function exerciseHTML(e,i,d,onlyRow=null){
 const rows=d.rows[e.id]||[],last=previousExercise(e,d.date),id=esc(e.id),repsName=e.unit==='s'?'Segundos':e.unit==='steps'?'Passos':'Repetições';
 const rest=Number.isFinite(e.restSeconds)?(e.restSeconds===0?' · sem descanso':' · descanso '+e.restSeconds+' s'):'';
 return `<article class="exercise" data-exercise="${id}"><div class="exercise-top"><div class="exercise-title"><span class="number">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(e.name)}</h3><small>${rows.length} séries · ${esc(targetLabel(e))}${rest}${onlyRow!==null?' · agora: série '+(onlyRow+1):''}</small></div></div><button class="icon-btn" data-menu="ex-${id}" aria-label="Mais opções para ${esc(e.name)}" aria-expanded="false">${icon('more')}</button><div class="menu" id="menu-ex-${id}" hidden><button data-swap="${id}">Trocar</button><button data-edit="${id}">Editar</button><button data-note="${id}">${exerciseNote(e)?'Editar nota':'Juntar nota'}</button>${e.alternative?`<button data-variant="${id}">${esc(e.alternative.label||'Usar alternativa preparada')}</button>`:''}<button data-remove="${id}" aria-label="Retirar ${esc(e.name)}">Retirar</button></div></div>${e.adapted?'<span class="adapted-tag">Variante alternativa preparada</span>':''}${e.beforeReplacement?'<p class="block-note">Antes da troca · valores preservados no movimento original.</p>':''}${e.block?`<p class="block-note">${esc(e.block)}</p>`:''}${e.cue?`<p class="cue-note">${esc(e.cue)}</p>`:''}<div class="exercise-links"><button class="mini" data-how="${id}">Como fazer e demonstração</button></div>${last?`<p class="previous-line">Último registo · ${dateLabel(last.date)}</p>`:e.loadHint?`<p class="load-hint">${esc(e.loadHint)}</p>`:''}${exerciseNote(e)?`<p class="exercise-note"><b>Nota</b><span>${esc(exerciseNote(e))}</span></p>`:''}${suggestionHTML(e,d)}<div class="set-grid head"><span><span class="sr-only">Série</span><span aria-hidden="true">#</span></span><span class="set-prev">Anterior</span><span>${esc(window.TreinoRecords.loadLabel(e))}</span><span>${e.unit==='s'?'Tempo · s':e.unit==='steps'?'Passos':'Reps'}</span><span>Feita</span></div>${rows.map((r,j)=>onlyRow!==null&&onlyRow!==j?'':`<div class="set-grid set-row ${r.done?'done':''}"><span class="set-index">${j+1}</span><span class="set-prev">${previousRowLabel(e,last?.rows[j])}</span>${e.noLoad?'<span class="no-load">Sem carga</span>':`<input type="number" min="0" max="100000" step="0.25" inputmode="decimal" placeholder="${esc(last?.rows[j]?.kg||'—')}" value="${esc(r.kg)}" aria-label="Carga, ${esc(e.name)}, série ${j+1}" data-field="kg" data-e="${id}" data-row="${j}">`}<input type="number" min="0" max="100000" step="1" inputmode="numeric" placeholder="${esc(last?.rows[j]?.reps||(e.target||'').match(/^\d+/)?.[0]||'—')}" value="${esc(r.reps)}" aria-label="${repsName}, ${esc(e.name)}, série ${j+1}" data-field="reps" data-e="${id}" data-row="${j}"><button class="tick ${r.done?'done':''}" data-tick="${id}" data-row="${j}" aria-label="Concluir série ${j+1} de ${esc(e.name)}" aria-pressed="${r.done}">${icon('check')}</button></div>`).join('')}${onlyRow===null?`<button class="add-set" data-add-set="${id}">+ Adicionar série</button>`:''}</article>`;
}

// A note you leave yourself on an exercise, kept by exercise, not by session.
function noteKey(e){return window.TreinoRecords.exerciseKey(e,'')||e.libraryId||e.id;}
function exerciseNote(e){return (state.exerciseNotes||{})[noteKey(e)]||'';}
function openExerciseNote(e){
 modal('Nota do exercício',`<h3>${esc(e.name)}</h3><form id="note-form"><label>A tua nota<textarea id="note-text" maxlength="300" rows="3" placeholder="Ex.: dói o ombro com pega larga; usar pega neutra.">${esc(exerciseNote(e))}</textarea></label><div class="home-actions"><button class="btn" type="submit">Guardar nota</button>${exerciseNote(e)?'<button class="btn secondary" type="button" id="note-clear">Apagar nota</button>':''}</div></form><p class="dialog-note">A nota fica neste exercício e aparece sempre que o fizeres.</p>`,true);
 const save=text=>{state.exerciseNotes??={};const key=noteKey(e);if(text)state.exerciseNotes[key]=text;else delete state.exerciseNotes[key];if(!Object.keys(state.exerciseNotes).length)delete state.exerciseNotes;persist();closeModal();renderPlans();};
 $('#note-form').onsubmit=event=>{event.preventDefault();const text=$('#note-text').value.trim().slice(0,300);if(Object.keys(state.exerciseNotes||{}).length>=200&&text&&!exerciseNote(e))return toast('Limite de 200 notas atingido.');save(text);};
 if($('#note-clear'))$('#note-clear').onclick=()=>save('');
}
function exerciseSuggestion(e,d){return window.TreinoProgression.suggest(state.history,e,{date:d.date,excludeSessionId:d.editHistoryId});}
function suggestionHTML(e,d){
 const s=exerciseSuggestion(e,d),label=window.TreinoProgression.suggestionLabel(s);
 if(!label)return '';
 return `<p class="suggestion ${esc(s.kind)}"><b>${esc(label)}</b><button class="mini" data-why="${esc(e.id)}" aria-label="Porquê esta sugestão">porquê?</button></p>`;
}
function bindExercises(){const p=getPlan(),d=getDraft(p);
 document.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>openExerciseNote(p.exercises.find(x=>x.id===b.dataset.note)));
 document.querySelectorAll('[data-why]').forEach(b=>b.onclick=()=>{const e=p.exercises.find(x=>x.id===b.dataset.why),s=exerciseSuggestion(e,d);
  modal('Sugestão de carga',`<h3>${esc(e.name)}</h3><p>${esc(s.reason)}</p>${s.last?`<p class="auth-note">Última vez · ${esc(dateLabel(s.last.date))} · ${s.last.rows.map(r=>esc((r.kg?r.kg+' kg × ':'')+(r.reps||'—'))).join(' · ')}</p>`:''}<p class="dialog-note">A sugestão vem do teu histórico e do intervalo de repetições da ficha. Decides tu.</p>`,true);});
 document.querySelectorAll('[data-field]').forEach(input=>input.oninput=()=>{const value=input.value;if(value!==''&&(!Number.isFinite(Number(value))||Number(value)<0||Number(value)>100000)){input.setCustomValidity('Indica um valor entre 0 e 100000.');return;}input.setCustomValidity('');const r=d.rows[input.dataset.e][+input.dataset.row];r[input.dataset.field]=value;if(input.dataset.field==='reps'&&Number(value)<=0){r.done=false;const b=input.parentElement.querySelector('.tick');b.classList.remove('done');b.setAttribute('aria-pressed','false');input.parentElement.classList.remove('done')}persist();updateProgress()});
 document.querySelectorAll('[data-tick]').forEach(b=>b.onclick=()=>{const r=d.rows[b.dataset.tick][+b.dataset.row];if(!r.done&&(!r.reps||+r.reps<=0)){const e=p.exercises.find(x=>x.id===b.dataset.tick),before=previousExercise(e,d.date)?.rows[+b.dataset.row];if(!before||!(+before.reps>0)){toast('Preenche as repetições, os segundos ou os passos antes de concluir a série.');return}r.reps=String(before.reps);if(r.kg===''&&before.kg!==''&&before.kg!==undefined&&!e.noLoad)r.kg=String(before.kg);b.closest('.set-row').querySelectorAll('[data-field]').forEach(input=>input.value=r[input.dataset.field]);}r.done=!r.done;if(r.done&&p.sessionOnly&&!d.editHistoryId&&!d.startedAt){window.TreinoCourse.clockStart(d,Date.now());requestWakeLock();}if(r.done&&!d.editHistoryId){const rest=p.exercises.find(e=>e.id===b.dataset.tick)?.restSeconds;startRest(Number.isFinite(rest)?rest:60);}persist();b.classList.toggle('done',r.done);b.closest('.set-row').classList.toggle('done',r.done);b.setAttribute('aria-pressed',String(r.done));updateProgress()});
 document.querySelectorAll('[data-add-set]').forEach(b=>b.onclick=()=>{const e=p.exercises.find(e=>e.id===b.dataset.addSet);if(d.rows[e.id].length>=30)return toast('Máximo de 30 séries por exercício.');d.rows[e.id].push(blankRow());persist();renderPlans()});
document.querySelectorAll('[data-swap]').forEach(b=>b.onclick=()=>openExerciseReplacement(p.exercises.find(e=>e.id===b.dataset.swap)));document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>exerciseForm(p.exercises.find(e=>e.id===b.dataset.edit)));
 document.querySelectorAll('[data-how]').forEach(b=>b.onclick=()=>openExerciseHow(p.exercises.find(e=>e.id===b.dataset.how)));bindMenus();
 document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const e=p.exercises.find(e=>e.id===b.dataset.remove);if(window.TreinoRecords.hasValues(d.rows[e.id]))return toast('Este exercício tem séries preenchidas. Guarda a sessão antes de o retirar; os registos serão preservados.');modal('Retirar exercício',`<p>Retirar “${esc(e.name)}” deste plano e do rascunho atual? As sessões já guardadas mantêm-se no histórico.</p><div class="form-actions"><button class="btn secondary" id="cancel-remove">Cancelar</button><button class="btn danger" id="confirm-remove">Retirar exercício</button></div>`,true);$('#cancel-remove').onclick=closeModal;$('#confirm-remove').onclick=()=>{p.exercises=p.exercises.filter(x=>x.id!==e.id);delete d.rows[e.id];persist();closeModal();renderPlans();toast('Exercício retirado do plano.')};});
}
function updateProgress(){const p=getPlan(),d=getDraft(p);const rows=p.exercises.flatMap(e=>d.rows[e.id]||[]);const done=rows.filter(r=>r.done).length;if($('#session-bar-fill'))$('#session-bar-fill').style.width=(rows.length?done/rows.length*100:0)+'%';if($('#session-bar-label'))$('#session-bar-label').textContent=`${done} de ${rows.length} séries`;}
function parseVideo(raw){return String(raw).trim()?window.TreinoPrograms.videoId(raw):'';}

function newPlanForm(){if(state.plans.length>=256)return toast('Limite de 256 treinos atingido.');modal('Criar treino',`<form id="new-plan-form"><label>Nome do treino<input id="new-name" required maxlength="100" placeholder="Ex.: Treino de segunda-feira"></label><div class="form-actions"><button type="button" class="btn secondary" id="new-cancel">Cancelar</button><button class="btn" type="submit">Criar treino</button></div></form>`,true);$('#new-cancel').onclick=closeModal;$('#new-plan-form').onsubmit=e=>{e.preventDefault();const name=$('#new-name').value.trim();if(!name)return;const p={id:uid(),name,note:'',exercises:[]};state.plans.push(p);selectedPlan=p.id;persist();closeModal();renderPlans()};}
function finishSession(){
 const p=getPlan(),d=getDraft(p);if(!$('#session-date').checkValidity()){$('#session-date').reportValidity();return}
 if(!d.duration&&!d.editHistoryId){const minutes=window.TreinoCourse.clockMinutes(d,Date.now());if(minutes)d.duration=String(minutes);}
 if($('#session-duration')&&!$('#session-duration').checkValidity()){$('#session-duration').reportValidity();return}
 const oldIndex=d.editHistoryId?state.history.findIndex(h=>h.id===d.editHistoryId):-1;
 if(d.editHistoryId&&oldIndex<0)return toast('O registo original já não está disponível. O rascunho foi preservado; não foi criada uma sessão duplicada.');
 const record=window.TreinoRecords.sessionRecord(p,d,oldIndex>=0?state.history[oldIndex]:null,{id:uid(),now:Date.now(),week:d.courseWeek||courseWeek(p)});
 if(!record.exercises.length)return toast('Conclui pelo menos uma série para guardar a sessão.');
 const complete=record.complete;if(oldIndex>=0)state.history[oldIndex]=record;else state.history.unshift(record);
 clearReplacementUndo();delete state.drafts[p.id];if(p.sessionOnly){state.plans=state.plans.filter(x=>x.id!==p.id);selectedPlan=p.executionSourceId||'';}releaseWakeLock();nextAfterSave=record.course&&record.course.version===COURSE.version&&!d.editHistoryId?nextCourseSession():null;persist();toast(storageOK?(complete?'Sessão completa guardada.':'Sessão parcial guardada; os registos ficam no histórico.'):'Sessão registada em memória. Exporta uma cópia antes de fechar.');setView('history');
}
function reopenSession(id){
 const h=state.history.find(x=>x.id===id);if(!h)return;
 const records=window.TreinoRecords;
 const editing=state.plans.find(p=>state.drafts[p.id]?.editHistoryId===h.id);
 if(editing){selectedPlan=editing.id;setView('plans');return toast('Correção em curso retomada; as alterações preenchidas mantêm-se.');}
 let p=state.plans.find(x=>x.id===h.planId)||state.plans.find(x=>!x.sessionOnly&&x.name===h.planName);
 const compatible=!h.planSnapshot&&p&&(!h.planSignature||h.planSignature===records.signature(p))&&h.exercises.every(saved=>p.exercises.some(e=>e.id===saved.id&&records.compatible(e,saved)));
 if(!compatible){if(state.plans.length>=256)return toast('Limite de fichas atingido. O registo continua preservado; exporta e revê os planos.');p=records.recoveryPlan(h,uid());state.plans.push(p);}
 const existing=state.drafts[p.id];if(existing&&existing.editHistoryId!==h.id&&(existing.note||Object.values(existing.rows).some(rows=>records.hasValues(rows))))return toast('Há um rascunho preenchido neste plano. Guarda-o antes de reabrir outro registo.');
 const d={date:h.date,datePinned:true,note:h.note,rows:{},guided:false,step:0,editHistoryId:h.id,recoveryOnly:!compatible&&(!h.planSnapshot||h.planSnapshot.completePrescription===false),effort:h.effort||'',duration:h.duration||''};
 for(const e of p.exercises){const saved=h.exercises.find(x=>x.id===e.id);const pending=h.planSnapshot?.pending?.filter(row=>row.exerciseId===e.id)||[];d.rows[e.id]=records.restoreRows([...(saved?.rows||[]),...pending],e.sets);}
 state.drafts[p.id]=d;selectedPlan=p.id;if(isCurrentCourse(p)){state.courseWeek=h.course?.week||p.course.week;state.courseSession=p.course.session;}persist();setView('plans');toast('Registo reaberto. Guardar substitui esta sessão; não cria uma cópia.');
}

function dateLabel(s){return new Date(s+'T12:00:00').toLocaleDateString('pt-PT',{day:'numeric',month:'short',year:'numeric'})}
function renderHistory(){setScreen('progress');const history=[...state.history].sort((a,b)=>b.date.localeCompare(a.date)||b.savedAt-a.savedAt);const count=history.reduce((s,h)=>s+h.exercises.reduce((n,e)=>n+e.rows.length,0),0);const volume=history.reduce((sum,h)=>sum+(Number(h.duration)||0),0);
 const next=nextAfterSave&&state.plans.some(p=>p.id===nextAfterSave.planId)?nextAfterSave:null;nextAfterSave=null;
 $('#content').innerHTML=heading('Progresso','O que treinaste, série a série, e o que o plano prevê.')+`${next?`<section class="program-intro next-session"><span class="eyebrow">Sessão guardada</span><div class="home-actions"><button class="btn" id="history-next">Próximo: ${esc(nextCourseLabel(next).replace(/^\S+ · /,''))}</button>${window.TreinoCourse.skip(COURSE,next)?`<button class="btn secondary" id="history-skip">Saltar para ${esc(nextCourseLabel(window.TreinoCourse.skip(COURSE,next)).replace(/^\S+ · /,''))}</button>`:''}</div></section>`:''}${balanceSectionHTML()}${recordsSectionHTML()}<h2 class="section-title">Sessões guardadas</h2><div class="stats"><div class="stat"><strong>${history.length}</strong><span>Sessões guardadas</span></div><div class="stat"><strong>${count}</strong><span>Séries concluídas</span></div><div class="stat"><strong>${new Intl.NumberFormat('pt-PT',{maximumFractionDigits:1}).format(volume)}</strong><span>Minutos registados</span></div></div><div class="history-list">${history.length?history.map(h=>`<details class="history-item"><summary><div><h3>${esc(h.planName)}</h3><span class="summary-date">${dateLabel(h.date)} · ${h.exercises.length} ${h.exercises.length===1?'exercício':'exercícios'} · ${h.exercises.reduce((n,e)=>n+e.rows.length,0)} ${h.exercises.reduce((n,e)=>n+e.rows.length,0)===1?'série':'séries'}</span></div><span aria-hidden="true">⌄</span></summary><div class="history-body">${h.course?`<span class="history-tag">${h.complete?'Completa':'Parcial'} · semana ${esc(h.course.week)}</span>`:''}${h.watch?`<p>Apple Watch: ${esc(h.watch.minutes)} min${Number.isInteger(h.watch.kcal)?' · '+esc(h.watch.kcal)+' kcal ativas':''}${Number.isInteger(h.watch.hr)?' · FC média '+esc(h.watch.hr):''}</p>`:''}${h.duration?`<p>Duração: ${esc(h.duration)} min${h.effort?' · margem: '+esc(h.effort)+' reps':''}</p>`:h.effort?`<p>Margem registada: ${esc(h.effort)} reps</p>`:''}${h.note?`<p>${esc(h.note)}</p>`:''}${h.exercises.map(e=>`<div class="history-ex"><strong>${esc(e.name)}</strong>${e.loadUnit?`<small>${esc(e.loadUnit)}</small>`:''}<span>${e.rows.map((r,i)=>`${i+1}: ${esc(r.reps)} ${unitLabel(e)}${r.kg!==''?' × '+esc(r.kg)+' kg':''}`).join(' · ')}</span></div>`).join('')}<button class="btn secondary recovery-button" data-reopen="${esc(h.id)}">${h.complete===false?'Retomar sessão parcial':'Reabrir / corrigir registo'}</button></div></details>`).join(''):`<div class="empty"><h3>A tua primeira sessão fica aqui.</h3>Abre um treino, preenche os registos e marca as séries feitas.<br><button class="btn" id="history-start">Ir para Hoje</button></div>`}</div><p class="privacy">Compara cargas no mesmo exercício, na mesma variante e unidade. Kg por haltere, kg totais da barra, passos e segundos são registos diferentes.</p>`;if($('#history-start'))$('#history-start').onclick=()=>setView('plans');bindBalance();bindRecords();if($('#history-skip'))$('#history-skip').onclick=()=>{const n=window.TreinoCourse.skip(COURSE,nextCourseSession());if(n){workoutView=null;chooseCourse(n.week,n.session);view='plans';render();}};if($('#history-next'))$('#history-next').onclick=()=>{const n=nextCourseSession();if(n){workoutView=null;chooseCourse(n.week,n.session);view='plans';render();}};document.querySelectorAll('[data-reopen]').forEach(b=>b.onclick=()=>reopenSession(b.dataset.reopen));
}
function formatTime(n){return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function startRest(seconds){if(!(seconds>0))return;restDuration=Math.min(3600,seconds);restRemaining=restDuration;restUntil=Date.now()+restDuration*1000;restRunning=true;updateTimer();}
function updateTimer(){updateSessionClock();if(restRunning){restRemaining=Math.max(0,Math.ceil((restUntil-Date.now())/1000));if(!restRemaining){restRunning=false;toast('Descanso terminado. Próxima série.');try{navigator.vibrate?.(200);}catch{}}}const bar=$('#rest-bar');bar.hidden=!(restRunning&&document.body.dataset.screen==='session');if(!bar.hidden)$('#rest-time').textContent=formatTime(restRemaining);}
$('#rest-skip').onclick=()=>{restRunning=false;restRemaining=0;updateTimer();};$('#rest-plus').onclick=()=>{if(restRunning){restUntil+=15000;updateTimer();}};$('#rest-minus').onclick=()=>{if(restRunning){restUntil=Math.max(Date.now(),restUntil-15000);updateTimer();}};
// Option menus: one open at a time; any click outside closes it.
function closeMenus(){document.querySelectorAll('.menu:not([hidden])').forEach(m=>m.hidden=true);document.querySelectorAll('[data-menu][aria-expanded="true"]').forEach(b=>b.setAttribute('aria-expanded','false'));}
function bindMenus(){document.querySelectorAll('[data-menu]').forEach(b=>b.onclick=event=>{event.stopPropagation();const menu=document.getElementById('menu-'+b.dataset.menu),open=menu.hidden;closeMenus();menu.hidden=!open;b.setAttribute('aria-expanded',String(open));});}
document.addEventListener('click',closeMenus);document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenus();});
setInterval(updateTimer,500);
function sessionClockDraft(){const p=view==='plans'&&selectedPlan?state.plans.find(x=>x.id===selectedPlan):null;return p&&p.sessionOnly?state.drafts[p.id]:null;}
function updateSessionClock(){const el=$('#session-clock-time');if(!el)return;const d=sessionClockDraft();if(!d)return;el.textContent=formatTime(window.TreinoCourse.clockElapsed(d,Date.now()));const budget=Number($('#session-clock')?.dataset.core||0),core=$('#session-clock-core');if(core&&budget)core.hidden=window.TreinoCourse.clockElapsed(d,Date.now())<budget*60;}
async function requestWakeLock(){try{if(!wakeLock&&navigator.wakeLock&&document.visibilityState==='visible'){wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener('release',()=>{wakeLock=null;});}}catch{wakeLock=null;}}
function releaseWakeLock(){try{wakeLock?.release();}catch{}wakeLock=null;}
document.addEventListener('visibilitychange',()=>{const d=sessionClockDraft();if(document.visibilityState==='visible'&&d?.startedAt&&!d.pausedAt)requestWakeLock();updateSessionClock();});
// Apple Watch summaries: the Shortcut opens #watch?start=…&end=…&kcal=…&hr=…; the hash is removed at once.
const WATCH_KEY='treino-watch-import';
function captureWatchHash(){if(!/^#watch\?/.test(location.hash))return;try{sessionStorage.setItem(WATCH_KEY,JSON.stringify({fragment:location.hash,receivedAt:Date.now()}));}catch{}history.replaceState(null,'',location.pathname+location.search);}
function handleWatchImport(){
 if(!accountAccess)return;let pending=null;try{pending=JSON.parse(sessionStorage.getItem(WATCH_KEY)||'null');}catch{}if(!pending)return;
 try{sessionStorage.removeItem(WATCH_KEY);}catch{}
 const parsed=window.TreinoWatch.parse(pending.fragment,Date.now());if(!parsed)return;if(parsed.error)return toast(parsed.error);
 const options=window.TreinoWatch.candidates(state,parsed),w=parsed.watch,summary=`${w.minutes} min${Number.isInteger(w.kcal)?' · '+w.kcal+' kcal ativas':''}${Number.isInteger(w.hr)?' · FC média '+w.hr:''}`;
 if(!options.length)return toast(`Treino do Apple Watch recebido (${summary}), mas não há nenhuma sessão em ${dateLabel(parsed.date)}. Guarda a sessão e volta a correr o Atalho.`);
 const key=activeStorageKey;
 modal('Associar treino do Apple Watch',`<p><b>${esc(summary)}</b> · ${esc(dateLabel(parsed.date))}, ${esc(new Date(w.start).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}))}–${esc(new Date(w.end).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}))}</p><fieldset class="watch-options">${options.map((o,i)=>`<label><input type="radio" name="watch-target" value="${i}" ${i===0?'checked':''}> ${esc(o.label)}${o.existing?' · substitui o registo anterior do Watch':''}</label>`).join('')}</fieldset><p class="dialog-note">A duração do Watch substitui a duração da sessão. Os exercícios e as séries não mudam.</p><div class="home-actions"><button class="btn" id="watch-confirm">Associar</button><button class="btn secondary" id="watch-cancel">Agora não</button></div>`,true);
 $('#watch-cancel').onclick=closeModal;
 $('#watch-confirm').onclick=()=>{
  if(!accountAccess||key!==activeStorageKey)return toast('A conta mudou. Corre o Atalho novamente.');
  const choice=options[Number(document.querySelector('[name="watch-target"]:checked')?.value||0)];
  try{const next=window.TreinoWatch.apply(state,choice,w);if(!validState(next))throw Error('Não foi possível validar os dados do Apple Watch.');const before=state;state=next;if(!persist()){state=before;throw Error('Não foi possível guardar.');}closeModal();toast('Treino do Apple Watch associado.');render();}catch(error){toast(error.message);}
 };
}
captureWatchHash();window.addEventListener('hashchange',()=>{captureWatchHash();handleWatchImport();});
function downloadBackup(){if(!accountAccess)return;const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`treinos-bioforceman-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000);toast('Cópia de segurança exportada. Guarda o ficheiro JSON.');}
$('#export').innerHTML=icon('download')+' Exportar cópia';$('#export').onclick=downloadBackup;$('#import').onclick=()=>{if(accountAccess)$('#import-file').click()};$('#import-file').onchange=async ev=>{
 if(!accountAccess)return;const destinationKey=activeStorageKey,file=ev.target.files[0];ev.target.value='';if(!file)return;
 if(file.size>15*1024*1024)return toast('O ficheiro é demasiado grande (máximo 15 MB).');
 let incoming;
 try{
  const raw=await file.text();if(!accountAccess||activeStorageKey!==destinationKey)return toast('A conta mudou durante a leitura. Importa o ficheiro novamente na conta pretendida.');
  const decoded=window.TreinoBackupFormat.decode(JSON.parse(raw));if(decoded.kind==='plan'){importSinglePlan(decoded.value);return;}incoming=decoded.value;
 }catch(error){return toast(error instanceof SyntaxError?'O ficheiro não contém JSON válido.':error.message||'O ficheiro não é uma cópia válida.');}
 modal('Importar cópia de segurança',`<p>Esta cópia contém <strong>${incoming.plans.length} ${incoming.plans.length===1?'treino':'treinos'}</strong> e <strong>${incoming.history.length} ${incoming.history.length===1?'sessão':'sessões'}</strong>. A importação substitui os dados atuais desta conta.</p><p class="dialog-note">Exporta os registos atuais antes de os substituíres.</p><div class="form-actions"><button class="btn secondary" id="before-import">Exportar atuais</button><button class="btn" id="confirm-import">Substituir pelos dados da cópia</button></div>`,true);
 $('#before-import').onclick=downloadBackup;
 $('#confirm-import').onclick=()=>{
  if(!accountAccess||activeStorageKey!==destinationKey)return toast('A conta mudou. Importa novamente na conta pretendida.');
  state=incoming;normaliseAccountState();selectedPlan=state.plans[0]?.id||'';state.courseEnabled??=false;storageOK=true;
  if(persist()){$('#storage-error').hidden=true;toast('Cópia importada e guardada.');}else toast('Cópia importada em memória. Não foi possível guardar no navegador.');closeModal();render();
 };
};
const navNames={plans:'Hoje',program:'Programa',history:'Progresso',me:'Perfil'},navIcons={plans:'today',program:'program',history:'progress',me:'me'};document.querySelectorAll('[data-view]').forEach(b=>{b.innerHTML=icon(navIcons[b.dataset.view])+navNames[b.dataset.view];b.onclick=()=>{if(b.dataset.view==='plans')selectedPlan='';if(b.dataset.view==='program')programWeek=null;setView(b.dataset.view)}});
function startApp(){normaliseAccountState();render();}

function exportCurrentPlan(){
 const p=window.TreinoRecords.portablePlan(getPlan());
 const blob=new Blob([JSON.stringify(window.TreinoBackupFormat.planEnvelope(p),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='plano-treino-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000);toast('Plano exportado sem histórico, cargas realizadas ou rascunhos.');
}
function importSinglePlan(plan){
 if(!accountAccess)return;const destinationKey=activeStorageKey;
 if(!validState({version:1,plans:[plan],drafts:{},history:[],favorites:[]}))throw Error('invalid plan');
 if(state.plans.length>=256)return toast('Limite de planos atingido.');
 modal('Adicionar uma ficha de treino',`<p>Adicionar “${esc(plan.name)}” com ${plan.exercises.length} exercícios? Os teus planos e registos atuais mantêm-se.</p><button class="btn" id="import-single-plan">Adicionar plano</button>`);
 $('#import-single-plan').onclick=()=>{if(!accountAccess||activeStorageKey!==destinationKey)return toast('A conta mudou. Importa novamente na conta pretendida.');const p=window.TreinoRecords.portablePlan(plan);p.id=uid();delete p.course;p.prepared=false;p.primary=false;p.sourceExact=false;p.exercises.forEach(e=>e.id=uid());state.plans.push(p);selectedPlan=p.id;persist();closeModal();setView('plans');toast('Plano adicionado. Os registos anteriores mantêm-se.');};
}
