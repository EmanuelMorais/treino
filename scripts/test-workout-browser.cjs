/* Browser checks use an isolated local fixture. No Supabase credentials/accounts. */
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { execFile } = require('node:child_process'), { promisify } = require('node:util');
const run = promisify(execFile), root = path.resolve(__dirname, '..');
const cli = path.join(root, 'node_modules/.bin/playwright-cli');
const browser = process.env.TREINO_TEST_BROWSER || 'chrome';
const session = 'treino-check-' + process.pid, storageKey = 'treino-browser-fixture';
const original = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const fixture = original.replace('<head>', '<head><base href="/"><link rel="icon" href="data:,">')
  .replace(/<script src="(?:config\.js|vendor\/supabase\.js|cloud\.js(?:\?[^"]*)?)"><\/script>/g, '')
  .replace('</body>', `<script>
    const fixtureKey=${JSON.stringify(storageKey)};
    const stored=localStorage.getItem(fixtureKey);
    const fixture=stored?JSON.parse(stored):{version:1,plans:[{id:'fixture-plan',name:'Treino fictício',note:'Teste local',exercises:[]}],history:[],drafts:{},favorites:[]};
    loadAccountState(fixture,fixtureKey);setAccountAccess(true);
  </script></body>`);
const allowed = new Set([...original.matchAll(/(?:src|href)="([^"?]+)(?:\?[^" ]*)?"/g)].map(match => match[1]));
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname.slice(1);
  if (pathname === '__test__/workout') { response.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); return response.end(fixture); }
  if (!allowed.has(pathname)) { response.writeHead(404); return response.end(); }
  response.writeHead(200, {'Content-Type': pathname.endsWith('.css') ? 'text/css' : 'text/javascript'});
  response.end(fs.readFileSync(path.join(root, pathname)));
});
async function command(args) {
  let stdout;
  try { ({stdout} = await run(cli, ['-s=' + session, ...args], {cwd:root,maxBuffer:2*1024*1024})); }
  catch (error) { throw Error(error.stdout || error.stderr || error.message); }
  if (stdout.includes('### Error')) throw Error(stdout);
  return stdout;
}

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/__test__/workout';
  fs.mkdirSync(path.join(root, 'output/playwright'), {recursive:true});
  let opened = false;
  try {
    await command(['open', url, '--browser', browser]);
    opened = true;
    await command(['snapshot']);
    await command(['run-code', `async page => {
      page.setDefaultTimeout(5000);
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      const check=(condition,message)=>{if(!condition)throw Error(message)};
      await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({contentType:'text/html',body:'<html><body>Test player</body></html>'}));
      await page.getByRole('button',{name:/^Treino fictício/}).click();
      await page.getByRole('button',{name:'Adicionar exercício',exact:true}).click();
      await page.getByLabel('Pesquisar exercício',{exact:true}).fill('dumbbell romanian deadlift');
      await page.getByRole('checkbox',{name:/^Peso morto romeno com halteres/}).check();
      await page.getByLabel('Pesquisar exercício',{exact:true}).fill('remada');
      await page.getByLabel('Material / contexto',{exact:true}).selectOption('dumbbells');
      check(await page.locator('[data-catalog-select]').count()===2,'Only-dumbbell row filter is wrong');
      await page.getByRole('checkbox',{name:/^Remada com um haltere/}).check();
      await page.getByRole('button',{name:'Favorito: Remada com um haltere',exact:true}).click();
      await page.getByRole('button',{name:'Detalhes de Remada com um haltere',exact:true}).click();
      await page.getByRole('button',{name:'← Voltar à lista',exact:true}).click();
      check(await page.getByLabel('Pesquisar exercício',{exact:true}).inputValue()==='remada','Detail lost search');
      check(await page.getByRole('checkbox',{name:/^Remada com um haltere/}).isChecked(),'Detail lost selection');
      await page.getByRole('button',{name:'Adicionar 2 exercícios',exact:true}).click();
      await page.getByRole('button',{name:'Ver todos os exercícios',exact:true}).click();
      const first=page.locator('article.exercise').filter({has:page.getByRole('heading',{name:'Peso morto romeno com halteres',exact:true})});
      await page.getByLabel('Carga, Peso morto romeno com halteres, série 1',{exact:true}).fill('10');
      await page.getByLabel('Repetições, Peso morto romeno com halteres, série 1',{exact:true}).fill('8');
      await page.getByRole('button',{name:'Concluir série 1 de Peso morto romeno com halteres',exact:true}).click();
      await first.getByRole('button',{name:'+ Adicionar série',exact:true}).click();
      await first.getByRole('button',{name:'Editar',exact:true}).click();
      await page.getByLabel('Medida',{exact:true}).selectOption('s');
      await page.getByRole('button',{name:'Guardar exercício',exact:true}).click();
      check((await page.locator('#exercise-error').innerText()).includes('séries preenchidas'),'Unit conversion was not blocked visibly');
      await page.getByRole('button',{name:'Cancelar',exact:true}).click();
      await first.getByRole('button',{name:'Retirar Peso morto romeno com halteres',exact:true}).click();
      check((await page.locator('#toast').innerText()).includes('séries preenchidas'),'Filled exercise removal was not blocked');
      await page.getByRole('button',{name:/Guardar sessão no histórico/}).click();
      const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),${JSON.stringify(storageKey)});
      check(saved.history.length===1,'Session was not saved');
      check(saved.plans[0].exercises[0].sets===2,'Extra set changed plan dose');
      check(saved.history[0].exercises[0].loadReference==='per_dumbbell','Load reference missing');
      check(saved.history[0].exercises[0].rows[0].kg==='10','Performed value changed');
      check(await page.evaluate(key=>validState(JSON.parse(localStorage.getItem(key))),${JSON.stringify(storageKey)}),'Saved document does not pass import validation');
      await page.getByRole('navigation').getByRole('button',{name:'Os meus treinos',exact:true}).click();
      await page.getByRole('button',{name:/^Treino fictício/}).click();
      check(await page.getByText(/Último registo/).count()>0,'Same-day history missing');
      await page.getByRole('button',{name:'Pesquisar demonstração ↗',exact:true}).first().click();
      const search=page.getByRole('link',{name:'Pesquisar no YouTube ↗',exact:true});
      check((await search.getAttribute('href')).includes('results?search_query='),'Demo search missing');
      await page.getByRole('button',{name:'Adicionar o meu vídeo',exact:true}).click();
      await page.locator('#e-video').fill('https://youtu.be/ACyCx_s15ME');
      await page.getByRole('button',{name:'Guardar exercício',exact:true}).click();
      await page.getByRole('button',{name:'▶ Ver demonstração',exact:true}).click();
      check(await page.locator('iframe').count()===1,'Demo player missing');
      check(!(await page.locator('iframe').getAttribute('src')).includes('autoplay=1'),'Autoplay was enabled');
      await page.getByRole('button',{name:'Fechar janela',exact:true}).click();
      check(await page.locator('iframe').count()===0,'Closed player remains mounted');
      await page.reload();
      await page.getByRole('button',{name:/^Treino fictício/}).click();
      await page.getByRole('button',{name:'Adicionar exercício',exact:true}).click();
      for(const width of [320,390,768,1440]){
        await page.setViewportSize({width,height:900});
        check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow at '+width);
        await page.screenshot({path:'output/playwright/catalog-'+${JSON.stringify(browser)}+'-'+width+'.png'});
      }
      await page.getByLabel('Pesquisar exercício',{exact:true}).fill('does not exist');
      check(await page.getByRole('heading',{name:'Não encontrámos exercícios.',exact:true}).isVisible(),'Empty search has no recovery state');
      await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();
      await page.getByLabel('Material / contexto',{exact:true}).selectOption('machine:machine_leg_press');
      check(await page.locator('[data-catalog-select]').count()===1,'Machine inventory filter is wrong');
      await page.getByRole('checkbox',{name:/^Leg press/}).check();
      await page.getByRole('button',{name:'Adicionar 1 exercício',exact:true}).click();
      check(errors.length===0,errors.join('; '));
    }`]);
    console.log('PASS ['+browser+']: search, equipment/machine filters, selection/details, favorite, partial session, protected edits/removal, dose isolation, same-day history, local reload, personal demo/player cleanup, empty state and 320–1440 px layouts.');
    console.log('Fixture only: no live authentication, Supabase sync or physical-device audio/keyboard verification.');
  } catch (error) {
    if (opened) try { fs.writeFileSync(path.join(root, 'output/playwright/failure-' + browser + '.txt'), await command(['snapshot'])); } catch {}
    throw error;
  } finally {
    try { if (opened) await command(['close']); } catch {} finally { server.close(); }
  }
}
main().catch(error=>{console.error(error.message);server.close();process.exitCode=1});
