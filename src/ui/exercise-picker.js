function openExercisePicker({onChoose = null, replacing = null} = {}) {
  if (!accountAccess) return;
  const catalog = window.TreinoExerciseCatalog, plan = getPlan(), answers=state.profile?.answers;
  const inventory=answers?window.TreinoPrograms.availableEquipment(answers):null;
  const extra = catalog.personalExercises(state.plans), items = [...catalog.exercises, ...extra];
  const chosen = new Set();
  const suggested = replacing && !state.profile?.answers?.limits && !state.profile?.answers?.avoided?.trim() ? window.TreinoReplacement.suggestions(replacing,state.profile?.answers?window.TreinoPrograms.availableEquipment(state.profile.answers):undefined,state.profile?.answers||{}).map(e=>e.id) : [];
  let query = '', muscle = '', context = inventory ? 'profile' : 'all', onlyFavorites = false, allowRepeated = false, listScroll = 0;
  state.catalogFavorites ||= []; state.catalogRecents ||= [];
  const machineOptions = Object.entries(catalog.EQUIPMENT).filter(([key]) => key.startsWith('machine_') || key.startsWith('cable_'));
  const zones = [...new Set(items.flatMap(e => e.muscles))].sort((a,b) => a.localeCompare(b,'pt'));
  const equipmentLabel = e => e.equipmentKnown === false ? 'Material por definir' : e.equipment.length ? e.equipment.map(key => catalog.EQUIPMENT[key] || key).join(' · ') : 'Sem equipamento';
  const favorite = id => state.catalogFavorites.includes(id);
  const duplicate = e => plan.exercises.some(current => current.exerciseKey === (e.exerciseKey || 'catalog:' + e.id));

  function results() {
    const matches = catalog.search({ query, muscle, context, onlyFavorites, favorites: state.catalogFavorites, recents: state.catalogRecents, extra, inventory, conditions:context==='profile'?answers:{} });
    if(replacing&&!query)matches.sort((a,b)=>Number(suggested.includes(b.id))-Number(suggested.includes(a.id)));
    $('#catalog-count').textContent = matches.length + (matches.length === 1 ? ' exercício' : ' exercícios');
    $('#catalog-results').innerHTML = matches.length ? matches.map(e => `<article class="catalog-item">
      <label class="catalog-choice"><input type="checkbox" data-catalog-select="${esc(e.id)}" ${chosen.has(e.id) ? 'checked' : ''}><span><strong>${esc(e.name)}</strong><small>${esc(e.muscles[0] || 'Exercício pessoal')} · ${esc(equipmentLabel(e))}${suggested.includes(e.id)?' · Mesmo padrão e material compatível':''}${duplicate(e) ? ' · Já neste treino' : ''}</small></span></label>
      <div class="catalog-item-actions"><button class="mini" data-catalog-detail="${esc(e.id)}" aria-label="Detalhes de ${esc(e.name)}">Detalhes</button><button class="mini catalog-star" data-catalog-favorite="${esc(e.id)}" aria-pressed="${favorite(e.id)}" aria-label="Favorito: ${esc(e.name)}">${favorite(e.id) ? '★' : '☆'}</button></div>
    </article>`).join('') : '<div class="empty"><h3>Não encontrámos exercícios.</h3><p>Experimenta outro nome, limpa os filtros ou cria um exercício pessoal.</p></div>';
    document.querySelectorAll('[data-catalog-select]').forEach(input => input.onchange = () => {
      if (input.checked) { if(onChoose)chosen.clear();chosen.add(input.dataset.catalogSelect); } else chosen.delete(input.dataset.catalogSelect);
      if(onChoose)document.querySelectorAll('[data-catalog-select]').forEach(item=>item.checked=chosen.has(item.dataset.catalogSelect));
      updateSelection();
    });
    document.querySelectorAll('[data-catalog-favorite]').forEach(button => button.onclick = () => {
      const id = button.dataset.catalogFavorite;
      state.catalogFavorites = favorite(id) ? state.catalogFavorites.filter(x => x !== id) : [...state.catalogFavorites, id].slice(-1000);
      const scroll = $('#catalog-results').scrollTop;
      persist(); results(); $('#catalog-results').scrollTop = scroll;
      (Array.from(document.querySelectorAll('[data-catalog-favorite]')).find(item => item.dataset.catalogFavorite === id) || $('#catalog-only-favorites')).focus();
    });
    document.querySelectorAll('[data-catalog-detail]').forEach(button => button.onclick = () => {
      listScroll = $('#catalog-results').scrollTop;
      detail(items.find(e => e.id === button.dataset.catalogDetail));
    });
  }

  function updateSelection() {
    $('#catalog-add').disabled = chosen.size === 0;
    $('#catalog-add').textContent = onChoose ? 'Continuar com a seleção' : 'Adicionar ' + chosen.size + (chosen.size === 1 ? ' exercício' : ' exercícios');
  }

  function renderPicker() {
    modal(onChoose?'Trocar exercício':'Adicionar exercícios', `<section class="catalog-picker">
      ${replacing?`<p>Substituir <strong>${esc(replacing.name)}</strong>. Escolhe uma alternativa e revê onde será aplicada.</p>`:''}
      <label>Pesquisar exercício<input id="catalog-search" type="search" placeholder="Ex.: remada, supino, bíceps…" value="${esc(query)}" autocomplete="off"></label>
      <div class="catalog-filters"><label>Zona muscular<select id="catalog-muscle" aria-label="Zona muscular"><option value="">Todas as zonas</option>${zones.map(zone => `<option value="${esc(zone)}">${esc(zone)}</option>`).join('')}</select></label>
      <label>Material / contexto<select id="catalog-context" aria-label="Material / contexto">${inventory?'<option value="profile">Material e espaço do meu perfil</option>':''}${Object.entries(catalog.CONTEXTS).map(([key,value]) => `<option value="${key}">${esc(value.name)}</option>`).join('')}<optgroup label="Máquina específica">${machineOptions.map(([key,label]) => `<option value="machine:${key}">${esc(label)}</option>`).join('')}</optgroup></select></label></div>
      <div class="catalog-tools"><label class="choice"><input type="checkbox" id="catalog-only-favorites" ${onlyFavorites ? 'checked' : ''}> Favoritos</label><button class="mini" id="catalog-clear">Limpar filtros</button><span id="catalog-count" role="status"></span></div>
      <div id="catalog-results" class="catalog-results"></div>
      ${!onChoose?`<details class="catalog-options"><summary>Mais opções</summary><label class="choice"><input type="checkbox" id="catalog-repeated" ${allowRepeated ? 'checked' : ''}> Permitir repetir um exercício que já está neste treino</label><button class="btn secondary" id="catalog-custom">Criar exercício pessoal</button></details>`:''}
      <div class="catalog-footer"><p class="dialog-note">Adiciona os exercícios e ajusta as séries e os objetivos na ficha.</p><button class="btn" id="catalog-add" disabled>Adicionar 0 exercícios</button></div>
    </section>`);
    $('#catalog-muscle').value = muscle; $('#catalog-context').value = context;
    $('#catalog-search').oninput = event => { query = event.target.value; results(); };
    $('#catalog-muscle').onchange = event => { muscle = event.target.value; results(); };
    $('#catalog-context').onchange = event => { context = event.target.value; results(); };
    $('#catalog-only-favorites').onchange = event => { onlyFavorites = event.target.checked; results(); };
    if($('#catalog-repeated'))$('#catalog-repeated').onchange = event => { allowRepeated = event.target.checked; };
    $('#catalog-clear').onclick = () => { query = ''; muscle = ''; context = 'all'; onlyFavorites = false; renderPicker(); };
    if($('#catalog-custom'))$('#catalog-custom').onclick = () => exerciseForm();
    $('#catalog-add').onclick = add;
    results(); updateSelection(); $('#catalog-results').scrollTop = listScroll;
    $('#catalog-search').focus();
  }

  function detail(exercise) {
    modal('Detalhes do exercício', `<button class="mini" id="catalog-back">← Voltar à lista</button><h3>${esc(exercise.name)}</h3>
      <p>${esc(exercise.muscles.join(' · '))}</p><p class="dialog-note">${esc(equipmentLabel(exercise))}${exercise.level ? ' · ' + esc(({beginner:'Complexidade inicial',regular:'Complexidade intermédia',experienced:'Complexidade elevada'})[exercise.level]) : ''}</p><p>${esc(exercise.how)}</p>
      <div class="video-links"><a class="btn secondary" href="${esc(exercise.video ? 'https://www.youtube.com/watch?v=' + exercise.video : exerciseSearchURL(exercise))}" target="_blank" rel="noopener noreferrer">${exercise.video ? 'Abrir exemplo no YouTube ↗' : 'Pesquisar demonstração no YouTube ↗'}</a></div>
      <button class="btn" id="catalog-detail-select">${chosen.has(exercise.id) ? 'Retirar da seleção' : 'Selecionar exercício'}</button>`, true);
    $('#catalog-back').onclick = renderPicker;
    $('#catalog-detail-select').onclick = () => { if (chosen.has(exercise.id)) chosen.delete(exercise.id); else {if(onChoose)chosen.clear();chosen.add(exercise.id);} renderPicker(); };
  }

  function add() {
    if (!accountAccess || getPlan()?.id !== plan.id) return;
    const selected = [...chosen].map(id => items.find(e => e.id === id)).filter(Boolean);
    if(onChoose&&selected.length===1)return onChoose(selected[0]);
    const incoming = selected.filter(e => allowRepeated || !duplicate(e));
    if (plan.exercises.length + incoming.length > 100) return toast('Limite de 100 exercícios por treino. Reduz a seleção.');
    if (!incoming.length) return toast('Os exercícios selecionados já estão neste treino. Podes permitir repetições em Mais opções.');
    for (const definition of incoming) plan.exercises.push(catalog.instantiate(definition, uid()));
    state.catalogRecents = [...new Set([...incoming.map(e => e.id), ...state.catalogRecents])].slice(0,50);
    persist(); closeModal(); renderPlans();
    toast(incoming.length + (incoming.length === 1 ? ' exercício adicionado.' : ' exercícios adicionados.'));
  }

  renderPicker();
}
