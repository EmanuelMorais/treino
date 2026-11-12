/* Horizontal bars for the weekly volume report. The target band is drawn on each bar. */
function volumeChartHTML(report,{title='Séries por grupo muscular',note=''}={}){
 if(!report.rows.length)return `<p class="dialog-note">Ainda não há séries suficientes para calcular o equilíbrio desta semana.</p>`;
 const scale=Math.max(report.peak,1),pct=value=>Math.min(100,value/scale*100),bar=value=>value>0?Math.max(2,pct(value)):0;
 const label={low:'abaixo do alvo',ok:'dentro do alvo',high:'acima do alvo'};
 const bars=report.rows.map(row=>`<div class="volume-row ${row.status}">
   <span class="volume-name">${esc(row.muscle)}</span>
   <span class="volume-track" role="img" aria-label="${esc(`${row.muscle}: ${row.effective} séries efetivas${row.sessions?` em ${row.sessions} dias`:', só trabalho indireto'}, alvo ${row.low} a ${row.high}, ${label[row.status]}`)}">
     <span class="volume-band" style="left:${pct(row.low)}%;width:${Math.max(1,pct(row.high)-pct(row.low))}%"></span>
     <span class="volume-fill" style="width:${bar(row.effective)}%"></span>
   </span>
   <span class="volume-value">${row.effective}<small>${row.sessions?` · ${row.sessions}×`:' · indireto'}</small></span>
  </div>`).join('');
 const low=report.rows.filter(r=>r.major&&r.status==='low').map(r=>r.muscle);
 const high=report.rows.filter(r=>r.status==='high').map(r=>r.muscle);
 const once=report.rows.filter(r=>r.major&&r.sessions===1&&r.status!=='low').map(r=>r.muscle);
 const notes=[
  report.missing.length?`Sem trabalho nenhum: ${report.missing.join(', ')}.`:'',
  low.length?`Abaixo do alvo: ${low.join(', ')}.`:'',
  high.length?`Acima do alvo: ${high.join(', ')}.`:'',
  once.length?`Treinado só num dia da semana: ${once.join(', ')}. Repartir por dois dias costuma render mais.`:'',
  report.rows.filter(r=>r.major&&r.direct===0).length?`Só com trabalho indireto: ${report.rows.filter(r=>r.major&&r.direct===0).map(r=>r.muscle).join(', ')}. Nenhum exercício os tem como músculo principal.`:'',
  report.unknown.length?`Sem grupo muscular identificado: ${report.unknown.join(', ')}.`:'',
  report.estimated.length?`Classificados pelo nome, por serem anteriores ao catálogo: ${report.estimated.slice(0,4).join(', ')}${report.estimated.length>4?` e mais ${report.estimated.length-4}`:''}. Trata essas séries como estimativa.`:''
 ].filter(Boolean);
 return `<div class="volume-chart"><div class="volume-head"><b>${esc(title)}</b><span>${report.totalSets} séries na semana</span></div>
  ${bars}
  <p class="volume-legend">Barra cheia: séries efetivas da semana. Um exercício conta 1 série para o músculo principal e meia para os restantes. A faixa clara é o alvo para o objetivo escolhido; «2×» é o número de dias em que o músculo é o principal.</p>
  ${notes.length?`<ul class="volume-notes">${notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:'<p class="volume-notes">Semana equilibrada para o objetivo escolhido.</p>'}
  ${note?`<p class="dialog-note">${esc(note)}</p>`:''}</div>`;
}
