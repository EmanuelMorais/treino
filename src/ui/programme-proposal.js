/* Proposal UI operates on private drafts; activation/revision commands are pure. */
function proposalMessage(message){const box=$('#proposal-error');if(box){box.textContent=message;box.focus();}else toast(message);}
function proposalGuard(key,expected){
 if(!accountAccess||activeStorageKey!==key||!state.proposal||JSON.stringify(state.proposal)!==expected){toast('A conta ou proposta mudou. Abre novamente a proposta antes de continuar.');return false;}return true;
}
function saveProposalEdit(next,key,expected){
 if(!proposalGuard(key,expected))return false;
 const previous=state.proposal;state.proposal=next;
 if(!validState(state)||!persist()){state.proposal=previous;proposalMessage('Não foi possível guardar a alteração. A proposta anterior mantém-se.');return false;}return true;
}
function commitProgramme(result,key){
 if(!accountAccess||activeStorageKey!==key)throw Error('A conta mudou. Abre novamente a proposta na conta pretendida.');
 if(!validState(result.document))throw Error('Não foi possível validar o programa. Os dados anteriores mantêm-se.');
 const previous=state;state=result.document;
 if(!persist()){state=previous;throw Error('Não foi possível guardar. O programa anterior mantém-se; exporta uma cópia antes de fechar.');}
 if(result.selectedPlanId)selectedPlan=result.selectedPlanId;
 closeModal();setView('plans');
}
function previewProposal(){
 if(!accountAccess||!state.proposal)return;
 const domain=window.TreinoProposal,key=activeStorageKey,expected=JSON.stringify(state.proposal);
 let result;try{result=domain.summary(state.proposal);}catch(error){return toast(error.message);}
 const p=result.proposal,first=p.sessions.filter(s=>s.week===1),active=state.programVersions?.find(v=>v.id===state.activeProgram);
 const issueList=[...new Map(result.issues.map(issue=>[issue.message,issue])).values()];
 modal('Rever o teu programa',`<p><b>${esc(programs.GOALS[p.profile.primaryGoal])}</b> · ${p.profile.weeks} semanas · ${p.profile.days} dias por semana · até ${p.profile.minutes} min.</p>
  <p class="auth-note">Revê cada sessão. As personalizações aplicam-se ao mesmo dia em todas as semanas; as semanas leves mantêm menos séries.</p>
  ${p.warnings.map(w=>`<p class="overview-rule">${esc(w)}</p>`).join('')}
  ${issueList.length?`<details class="proposal-help" open><summary>O que precisa de atenção</summary><ul>${issueList.map(issue=>`<li>${esc(issue.message)}</li>`).join('')}</ul></details>`:''}
  <div class="proposal-grid">${first.map(s=>`<section class="panel"><h3>Sessão ${String.fromCharCode(65+s.day)} · ${programs.DAYS[s.weekday]}</h3><p>${s.estimatedMinutes} min estimados</p><ol>${s.exercises.map(e=>`<li>${esc(e.name)} · ${e.sets} × ${esc(e.target)}${e.unit==='s'?' segundos':e.unit==='steps'?' passos':''}${e.unilateral?' por lado':''} · ${e.restSeconds}s descanso</li>`).join('')}</ol><button class="btn secondary" data-proposal-day="${s.day}">Personalizar sessão ${String.fromCharCode(65+s.day)}</button></section>`).join('')}</div>
${p.profile.athlete?.calendar.length?athleteWeekHTML(p.profile.athlete,first):''}
  <details class="proposal-help"><summary>Como seguir e progredir</summary>${p.notes.slice(1).map(n=>`<p class="auth-note">${esc(n)}</p>`).join('')}</details>
  <details class="proposal-help"><summary>Como foi criado este plano?</summary><p class="auth-note">Versão ${p.ruleVersion} das regras · catálogo ${p.catalogVersion||'inicial'}. Seleção e dose são regras da aplicação com referências gerais de <a href="https://acsm.org/resistance-training-guidelines-update-2026/" target="_blank" rel="noopener">ACSM 2026</a> e <a href="https://www.cdc.gov/healthy-weight-growth/physical-activity/" target="_blank" rel="noopener">CDC</a>. Não constituem uma avaliação individual nem revisão profissional.</p>${programs.evidence.rules.map(rule=>`<p class="auth-note">${esc(rule.description)}</p>`).join('')}</details>
  ${result.issues.length?'<label class="choice"><input type="checkbox" id="proposal-ack">Revi os avisos de tempo, material, espaço e cobertura desta proposta.</label>':''}
  <p id="proposal-error" class="auth-message" role="alert" tabindex="-1"></p>
  ${state.previousProposal?'<p class="auth-note">Há ajustes da proposta anterior guardados. Podes compará-los antes de escolher esta proposta.</p><button class="btn secondary" id="proposal-previous">Comparar ajustes anteriores</button>':''}<div class="home-actions"><button class="btn" id="activate-proposal">Ativar este programa</button>${active?'<button class="btn secondary" id="revise-programme">Rever alterações ao programa atual</button>':''}<button class="btn secondary" id="edit-proposal">Corrigir respostas</button></div>
  <p class="auth-note">Ativar cria um programa novo e conserva os anteriores. Rever o programa atual permite alterar apenas fichas por realizar, com diferenças antes de confirmar.</p>`);
 document.querySelectorAll('[data-proposal-day]').forEach(button=>button.onclick=()=>{if(proposalGuard(key,expected))editProposalDay(Number(button.dataset.proposalDay));});
 if($('#proposal-previous'))$('#proposal-previous').onclick=()=>{if(proposalGuard(key,expected))reviewPreviousProposal();};
 $('#edit-proposal').onclick=()=>{if(proposalGuard(key,expected)){closeModal();setView('profile');}};
 if($('#revise-programme'))$('#revise-programme').onclick=()=>{if(proposalGuard(key,expected))reviewProgrammeRevision();};
 $('#activate-proposal').onclick=()=>{
  if(!proposalGuard(key,expected))return;
  if(result.issues.length&&!$('#proposal-ack').checked)return proposalMessage('Revê os avisos e confirma que os compreendeste antes de ativar.');
  try{commitProgramme(domain.activate(state,state.proposal,{uid}),key);toast('Programa ativado. Os planos e registos anteriores foram preservados.');}catch(error){proposalMessage(error.message);}
 };
}
function editProposalDay(day){
 if(!accountAccess||!state.proposal)return;
 const domain=window.TreinoProposal,key=activeStorageKey,expected=JSON.stringify(state.proposal);
 let s;try{s=domain.summary(state.proposal).proposal.sessions.find(s=>s.week===1&&s.day===day);}catch(error){return toast(error.message);}if(!s)return;
 const dose=e=>`${e.sets} × ${e.target}${e.unit==='s'?' segundos':e.unit==='steps'?' passos':''}${e.unilateral?' por lado':''} · ${e.restSeconds}s descanso`;
 modal('Personalizar sessão '+String.fromCharCode(65+day),`<p>Aplica-se a este dia em todas as semanas da proposta. As semanas leves mantêm menos séries. Ainda não altera o programa ativo.</p><p>${s.estimatedMinutes} min estimados · limite do perfil ${state.proposal.profile.minutes} min</p>
  <div class="proposal-exercises">${s.exercises.map((e,i)=>`<article class="proposal-exercise"><h3>${esc(e.name)}</h3><p>${esc(dose(e))}</p><div class="proposal-exercise-actions"><button class="btn secondary" data-proposal-dose="${e.proposalSlot}">Editar dose de ${esc(e.name)}</button><button class="btn secondary" data-proposal-swap="${e.proposalSlot}">Trocar ${esc(e.name)}</button><a class="btn secondary" href="${esc(e.video?'https://www.youtube.com/watch?v='+e.video+'&t='+e.start:exerciseSearchURL(e))}" target="_blank" rel="noopener noreferrer">${e.video?'Ver exemplo':'Pesquisar demonstração'} ↗</a><button class="mini" data-proposal-up="${e.proposalSlot}" ${i===0?'disabled':''} aria-label="Subir ${esc(e.name)}">↑</button><button class="mini" data-proposal-down="${e.proposalSlot}" ${i===s.exercises.length-1?'disabled':''} aria-label="Descer ${esc(e.name)}">↓</button><button class="mini" data-proposal-remove="${e.proposalSlot}" ${s.exercises.length===1?'disabled':''} aria-label="Retirar ${esc(e.name)} da proposta">Retirar</button></div></article>`).join('')}</div>
  <p id="proposal-error" class="auth-message" role="alert" tabindex="-1"></p><div class="home-actions"><button class="btn secondary" id="proposal-add">Adicionar exercício à proposta</button><button class="btn" id="proposal-back">Voltar à proposta</button></div>`);
 const find=slot=>s.exercises.find(e=>e.proposalSlot===slot);
 const apply=action=>{try{if(saveProposalEdit(domain.change(state.proposal,{day,...action}),key,expected))editProposalDay(day);}catch(error){proposalMessage(error.message);}};
 for(const [attribute,action]of [['up',{type:'move',offset:-1}],['down',{type:'move',offset:1}],['remove',{type:'remove'}]])document.querySelectorAll('[data-proposal-'+attribute+']').forEach(button=>button.onclick=()=>apply({...action,slot:button.dataset['proposal'+attribute[0].toUpperCase()+attribute.slice(1)]}));
 document.querySelectorAll('[data-proposal-dose]').forEach(button=>button.onclick=()=>{if(proposalGuard(key,expected))editProposalDose(day,find(button.dataset.proposalDose));});
 const choose=(before=null)=>openExercisePicker({sourceExercises:s.exercises,replacing:before,onCancel:()=>editProposalDay(day),onChoose:definition=>{if(proposalGuard(key,expected))editProposalDose(day,before,definition);}});
 document.querySelectorAll('[data-proposal-swap]').forEach(button=>button.onclick=()=>{if(proposalGuard(key,expected))choose(find(button.dataset.proposalSwap));});
 $('#proposal-add').onclick=()=>{if(proposalGuard(key,expected))choose();};$('#proposal-back').onclick=previewProposal;
}
function editProposalDose(day,before,definition=null){
 const key=activeStorageKey,expected=JSON.stringify(state.proposal),replacing=!!definition;
 const unit=definition?.unit||before.unit,compatible=before?.unit===unit&&!/%|1rm/i.test(before.target||'');
 const e={...before,...definition},target=compatible?before.target:unit==='s'?'20–30':unit==='steps'?'30':'8–12';
 modal(replacing?'Rever exercício da proposta':'Editar dose da proposta',`<h3>${esc(e.name)}</h3>${before&&replacing?`<p>${esc(before.name)} → ${esc(e.name)}. As cargas anteriores não transitam.</p>`:''}
  <form id="proposal-dose-form" novalidate><div class="form-grid"><label>Séries por semana normal<input id="proposal-sets" type="number" min="1" max="30" step="1" required value="${before?.sets||2}"></label><label>Objetivo · ${unit==='s'?'segundos':unit==='steps'?'passos':'repetições'}${e.unilateral?' por lado':''}<input id="proposal-target" maxlength="60" required value="${esc(target)}"></label><label>Descanso · segundos<input id="proposal-rest" type="number" min="0" max="600" step="1" required value="${before?.restSeconds??60}"></label></div>
  <p class="auth-note">Dose inicial editável. Confirma a adaptação ao novo movimento. Esta escolha aplica-se a todas as semanas deste dia; as semanas leves ficam com uma série.</p>
  <details class="proposal-help"><summary>O meu exemplo YouTube — opcional</summary><label>Ligação YouTube<input id="proposal-video" type="url" value="${e.video?'https://www.youtube.com/watch?v='+esc(e.video):''}"></label><label>Início · segundos<input id="proposal-start" type="number" min="0" max="86400" step="1" required value="${definition?definition.start||0:before?.start||0}"></label></details>
  <p id="proposal-error" class="auth-message" role="alert" tabindex="-1"></p><div class="home-actions"><button class="btn secondary" id="proposal-dose-cancel" type="button">Cancelar</button><button class="btn" type="submit">Guardar na proposta</button></div></form>`,true);
 $('#proposal-dose-cancel').onclick=()=>editProposalDay(day);
 $('#proposal-dose-form').onsubmit=event=>{
  event.preventDefault();if(!proposalGuard(key,expected))return;
  if(['#proposal-sets','#proposal-rest','#proposal-start'].some(selector=>!$(selector).value.trim()))return proposalMessage('Preenche as séries, o descanso e o início do vídeo (0 se não se aplicar).');
  const video=programs.videoId($('#proposal-video').value),raw=$('#proposal-video').value.trim();
  if(raw&&!video)return proposalMessage('Indica uma ligação válida do YouTube.');
  const dose={sets:Number($('#proposal-sets').value),target:$('#proposal-target').value.trim(),restSeconds:Number($('#proposal-rest').value),video:video||'',start:Number($('#proposal-start').value)};
  try{const next=window.TreinoProposal.change(state.proposal,{day,type:replacing?before?'replace':'add':'dose',slot:before?.proposalSlot,newSlot:'slot-'+uid(),definition,dose});if(saveProposalEdit(next,key,expected))editProposalDay(day);}catch(error){proposalMessage(error.message);}
 };
}
function reviewProgrammeRevision(options={}){
 if(!accountAccess||!state.proposal)return;
 const key=activeStorageKey,domain=window.TreinoProposal;
 const settings={fromWeek:state.activeProgramWeek||1,policy:'keep',...options};
 let review;try{review=domain.revisionPreview(state,state.proposal,settings);}catch(error){return proposalMessage(error.message);}
 const expected=JSON.stringify(state),warnings=domain.summary(state.proposal).issues,conflicts=review.kept.filter(plan=>plan.conflicts.length);
 const display=shape=>shape.exercises.map(e=>`${e.name}: ${e.sets} × ${e.target} (${e.unit}), ${e.restSeconds??'—'}s descanso`).join(' · ');
 modal('Rever alterações ao programa atual',`<p>Atualiza apenas fichas por realizar. As sessões guardadas e os treinos com valores preenchidos mantêm-se.</p>
  <div class="form-grid"><label>A partir da semana<select id="revision-week" aria-label="A partir da semana">${Array.from({length:review.proposal.profile.weeks},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></label><label>Fichas personalizadas<select id="revision-policy" aria-label="Fichas personalizadas"><option value="keep">Manter as minhas personalizações</option><option value="replace">Substituir pela proposta revista</option></select></label></div>
  <p role="status"><b>${review.updates.length} fichas a alterar</b> · ${review.kept.length} mantidas · ${review.unchanged.length} sem diferenças</p>
  ${review.updates.length?`<details class="proposal-help" open><summary>Ver diferenças antes de aplicar</summary>${review.updates.map(plan=>`<details class="revision-diff"><summary>${esc(plan.name)}${plan.personalized?' · personalizada':''}</summary><p><b>Atual:</b> ${esc(display(plan.before))}</p><p><b>Proposta:</b> ${esc(display(plan.after))}</p></details>`).join('')}</details>`:'<p>Com estas opções, nenhuma ficha será alterada.</p>'}
  ${review.kept.length?`<details class="proposal-help"><summary>Fichas mantidas e motivos</summary><ul>${review.kept.map(plan=>`<li>${esc(plan.name)} — ${esc(plan.reason)}${plan.conflicts.length?'<br>Rever material/espaço de: '+plan.conflicts.map(esc).join(', '):''}</li>`).join('')}</ul></details>`:''}
  ${warnings.length||conflicts.length?`<p class="overview-rule">Há avisos na proposta ou fichas mantidas que não correspondem ao novo material/espaço. Revê-os antes de treinar.</p><label class="choice"><input type="checkbox" id="revision-ack">Revi os avisos e as fichas mantidas que precisam de adaptação.</label>`:''}
  <p id="proposal-error" class="auth-message" role="alert" tabindex="-1"></p><div class="home-actions"><button class="btn secondary" id="revision-back">Voltar à proposta</button><button class="btn" id="revision-apply" ${review.updates.length?'':'disabled'}>Aplicar às ${review.updates.length} fichas</button></div>`);
 $('#revision-week').value=String(settings.fromWeek);$('#revision-policy').value=settings.policy;
 const refresh=()=>reviewProgrammeRevision({fromWeek:Number($('#revision-week').value),policy:$('#revision-policy').value});$('#revision-week').onchange=refresh;$('#revision-policy').onchange=refresh;$('#revision-back').onclick=previewProposal;
 $('#revision-apply').onclick=()=>{
  if(!accountAccess||activeStorageKey!==key||JSON.stringify(state)!==expected)return proposalMessage('Os dados mudaram entretanto. Volta à proposta e revê novamente as diferenças.');
  if((warnings.length||conflicts.length)&&!$('#revision-ack').checked)return proposalMessage('Confirma a revisão dos avisos antes de aplicar.');
  try{const result=domain.regenerate(state,state.proposal,settings,{uid});commitProgramme(result,key);toast(result.updated+' fichas atualizadas. As sessões e personalizações mantidas foram preservadas.');}catch(error){proposalMessage(error.message);}
 };
}

function reviewPreviousProposal(){
 if(!accountAccess||!state.proposal||!state.previousProposal)return;
 const key=activeStorageKey,expected=JSON.stringify(state.proposal),previous=JSON.stringify(state.previousProposal),domain=window.TreinoProposal;
 let recovered,error='';try{recovered=domain.recoverEdits(state.previousProposal,state.proposal);}catch(issue){error=issue.message;}
 const display=p=>p.sessions.filter(s=>s.week===1).map(s=>`<p><b>Sessão ${String.fromCharCode(65+s.day)}</b>: ${s.exercises.map(e=>esc(e.name)+' · '+e.sets+' × '+esc(e.target)).join(' / ')}</p>`).join('');
 modal('Comparar ajustes anteriores',`<p>Recuperar mantém os movimentos e doses que personalizaste, com as respostas novas. Terás de rever material, espaço, tempo e objetivos antes de ativar.</p><details class="proposal-help" open><summary>Proposta nova</summary>${display(state.proposal)}</details><details class="proposal-help" open><summary>Com ajustes recuperados</summary>${recovered?display(recovered):esc(error)}</details><p id="proposal-error" class="auth-message" role="alert" tabindex="-1"></p><div class="home-actions"><button class="btn secondary" id="previous-back">Voltar à proposta</button><button class="btn" id="previous-recover" ${recovered?'':'disabled'}>Recuperar ajustes e rever</button></div>`);
 $('#previous-back').onclick=previewProposal;
 $('#previous-recover').onclick=()=>{
  if(!proposalGuard(key,expected)||JSON.stringify(state.previousProposal)!==previous)return proposalMessage('Os ajustes guardados mudaram. Volta a compará-los antes de continuar.');
  if(saveProposalEdit(recovered,key,expected))previewProposal();
 };
}
