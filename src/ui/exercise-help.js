function exerciseSearchURL(exercise) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(window.TreinoCatalogData.searchQuery(exercise));
}

function openExerciseSearch(exercise) {
  modal('Demonstração do exercício', `<h3>${esc(exercise.name)}</h3>
    <p>Ainda não há um vídeo escolhido para este exercício. Podes procurar um exemplo ou guardar a tua ligação.</p>
    <div class="video-links"><a class="btn" href="${esc(exerciseSearchURL(exercise))}" target="_blank" rel="noopener noreferrer">Pesquisar no YouTube ↗</a></div>
    <p class="dialog-note">Os resultados da pesquisa não foram revistos pela aplicação.</p>
    <button class="btn secondary" id="exercise-add-video">Adicionar o meu vídeo</button>`, true);
  $('#exercise-add-video').onclick = () => exerciseForm(exercise);
}

function exerciseGuideHTML(exercise) {
  const steps = window.TreinoCatalogData.guide(exercise);
  return `<details class="session-technique"><summary>Como fazer</summary>${steps.length ? `<dl class="guide-steps">${steps.map(([label, text]) => `<div><dt>${esc(label)}</dt><dd>${esc(text)}</dd></div>`).join('')}</dl>` : '<p class="how">Ainda não há descrição para este exercício. Usa o vídeo de exemplo ou edita o exercício para a acrescentar.</p>'}<a class="guide-video" href="${esc(exerciseSearchURL(exercise))}" target="_blank" rel="noopener noreferrer">▶ Ver exemplos em vídeo no YouTube ↗</a></details>`;
}
