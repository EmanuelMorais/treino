/* Keep the same form/fields alive while progressively revealing its four steps. */
function setupProfileSteps(form,{validate}){
 const sections=Array.from(form.querySelectorAll('.profile-section'));
 const labels=['Objetivos','Tempo e local','Material','Preferências'];
 const intro=document.createElement('section');intro.className='profile-journey';intro.setAttribute('aria-label','Progresso do questionário');
 intro.innerHTML=`<p id="profile-step-status" role="status"></p><nav class="profile-step-links" aria-label="Passos do questionário">${labels.map((label,i)=>`<button class="btn secondary" type="button" data-profile-step="${i}">${i+1}. ${label}</button>`).join('')}</nav>`;
 form.prepend(intro);
 // Consent is visible from the start; without it answers stay only in this open form.
 const consent=form.elements.namedItem('consent').closest('label');intro.append(consent);
 const controls=document.createElement('div');controls.className='profile-step-controls';
 controls.innerHTML='<button class="btn secondary" type="button" id="profile-prev">← Anterior</button><button class="btn" type="button" id="profile-next">Continuar →</button>';
 sections.at(-1).after(controls);
 const submit=form.querySelector('[type="submit"]'),previous=controls.querySelector('#profile-prev'),next=controls.querySelector('#profile-next');
 let current=0;
 function show(index,focus=true){
  current=index;sections.forEach((section,i)=>{section.hidden=i!==index;});
  intro.querySelector('#profile-step-status').textContent=`Passo ${index+1} de ${sections.length} · ${labels[index]}`;
  intro.querySelectorAll('[data-profile-step]').forEach((button,i)=>{if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
  previous.disabled=index===0;next.hidden=index===sections.length-1;submit.hidden=index!==sections.length-1;
  if(focus){const title=sections[index].querySelector('h2');title.tabIndex=-1;title.focus({preventScroll:true});title.scrollIntoView({block:'start'});}
 }
 previous.onclick=()=>show(current-1);
 next.onclick=()=>{if(validate(Array.from(sections[current].querySelectorAll('input,select,textarea'))))show(current+1);};
 intro.querySelectorAll('[data-profile-step]').forEach(button=>button.onclick=()=>show(Number(button.dataset.profileStep)));
 show(0,false);
 return {
  advanceIfNeeded(){if(current===sections.length-1)return false;next.onclick();return true;},
  reveal(field){const index=sections.findIndex(section=>section.contains(field));if(index!==-1)show(index,false);}
 };
}
