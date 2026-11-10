function exerciseSearchURL(exercise) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(exercise.name + ' exercício execução');
}

function openExerciseSearch(exercise) {
  modal('Demonstração do exercício', `<h3>${esc(exercise.name)}</h3>
    <p>Ainda não há um vídeo escolhido para este exercício. Podes procurar um exemplo ou guardar a tua ligação.</p>
    <div class="video-links"><a class="btn" href="${esc(exerciseSearchURL(exercise))}" target="_blank" rel="noopener noreferrer">Pesquisar no YouTube ↗</a></div>
    <p class="dialog-note">Os resultados da pesquisa não foram revistos pela aplicação.</p>
    <button class="btn secondary" id="exercise-add-video">Adicionar o meu vídeo</button>`, true);
  $('#exercise-add-video').onclick = () => exerciseForm(exercise);
}
