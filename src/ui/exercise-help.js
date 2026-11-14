// One sheet per exercise — the animated demonstration, the muscles, the steps
// and where to see a real video — used by the session, the review and the catalogue.
function exerciseSearchURL(exercise) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(window.TreinoCatalogData.searchQuery(exercise));
}

function exerciseMuscles(exercise) {
  if (Array.isArray(exercise.muscles) && exercise.muscles.length) return exercise.muscles;
  const definition = window.TreinoCatalogData.exercises.find(e => e.id === (exercise.libraryId || exercise.id));
  return Array.isArray(definition?.muscles) ? definition.muscles : [];
}

// The routine video is a long session filmed by the source channel; it stays
// available, but as "the original routine", not as the demonstration.
function exerciseVideoLinksHTML(exercise) {
  const routine = /^[\w-]{11}$/.test(exercise.video || '') ? `<button class="btn secondary" data-routine-video="${esc(exercise.video)}" data-routine-start="${Number.isFinite(exercise.start) ? exercise.start : 0}">Ver na rotina original${Number.isFinite(exercise.start) && exercise.start ? ' · ' + Math.floor(exercise.start / 60) + ':' + String(exercise.start % 60).padStart(2, '0') : ''}</button>` : '';
  const own = exercise.video && !routine ? '' : '<button class="btn secondary" data-own-video="1">Guardar o meu vídeo</button>';
  return `<div class="home-actions exercise-videos"><a class="btn secondary" href="${esc(exerciseSearchURL(exercise))}" target="_blank" rel="noopener noreferrer">Vídeos deste exercício no YouTube ↗</a>${routine}${own}</div>`;
}

// Two photographed frames alternating show the movement; the drawn figure is
// the fallback for the exercises with no honest photographic match.
function exerciseDemoHTML(exercise) {
  const photos = window.TreinoPhotos ? window.TreinoPhotos.photosFor(exercise) : null;
  if (!photos) return window.TreinoDemos ? window.TreinoDemos.demoHTML(exercise) : '';
  const still = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return `<figure class="demo demo-photo${still ? ' is-still' : ''}"><div class="demo-frames">
    <img src="${esc(photos[0])}" alt="Posição inicial de ${esc(exercise.name)}" loading="lazy" decoding="async" width="520" height="390">
    <img class="demo-frame-end" src="${esc(photos[1])}" alt="Posição final de ${esc(exercise.name)}" loading="lazy" decoding="async" width="520" height="390">
    </div><figcaption>${still ? 'Início e fim do movimento' : 'Início e fim, em repetição'}</figcaption></figure>`;
}

function exerciseSheetHTML(exercise, { heading = true, muscles: showMuscles = true } = {}) {
  const steps = window.TreinoCatalogData.guide(exercise);
  const muscles = exerciseMuscles(exercise);
  const demo = exerciseDemoHTML(exercise);
  return `${heading ? `<h3 class="sheet-title">${esc(exercise.name)}</h3>` : ''}${showMuscles && muscles.length ? `<p class="sheet-muscles">${muscles.map(m => `<span>${esc(m)}</span>`).join('')}</p>` : ''}${demo}${steps.length ? `<dl class="guide-steps">${steps.map(([label, text]) => `<div><dt>${esc(label)}</dt><dd>${esc(text)}</dd></div>`).join('')}</dl>` : '<p class="how">Ainda não há descrição para este exercício. Vê um vídeo ou edita o exercício para a acrescentar.</p>'}${exerciseVideoLinksHTML(exercise)}<p class="dialog-note">A figura é um esquema do movimento; os vídeos do YouTube não foram revistos pela aplicação.</p>`;
}

function bindExerciseSheet(exercise) {
  document.querySelectorAll('[data-routine-video]').forEach(b => b.onclick = () => openVideo(b.dataset.routineVideo, Number(b.dataset.routineStart) || 0));
  if (exercise) document.querySelectorAll('[data-own-video]').forEach(b => b.onclick = () => exerciseForm(exercise));
}

function openExerciseHow(exercise) {
  if (!exercise) return;
  modal('Como fazer', exerciseSheetHTML(exercise), true);
  bindExerciseSheet(exercise);
}

function openExerciseSearch(exercise) {
  modal('Demonstração do exercício', exerciseSheetHTML(exercise), true);
  bindExerciseSheet(exercise);
}

// Inline version for the workout review: the same sheet behind a disclosure.
function exerciseGuideHTML(exercise) {
  return `<details class="session-technique"><summary>Como fazer</summary>${exerciseSheetHTML(exercise, { heading: false })}</details>`;
}
