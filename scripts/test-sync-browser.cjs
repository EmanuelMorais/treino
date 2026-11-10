/* Two independent browser processes, shipped SDK/cloud code, HTTP fixture and SQL/RLS. */
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const {createServer}=require('../tests/fixtures/sync-http-server.cjs'),root=path.resolve(__dirname,'..'),run=promisify(execFile),cli=path.join(root,'node_modules/.bin/playwright-cli');
const names=['sync-pc-'+process.pid,'sync-mobile-'+process.pid],opened=[];
async function command(session,args){const {stdout}=await run(cli,['-s='+session,...args],{cwd:root,maxBuffer:2*1024*1024});if(stdout.includes('### Error'))throw Error(stdout);return stdout;}
const code=(session,body)=>command(session,['run-code',body]);
async function main(){
 const fixture=await createServer(root,{siteRoot:path.resolve(root,process.env.TREINO_SITE_ROOT||'.')}),url=fixture.origin+'/treino/';fs.mkdirSync(path.join(root,'output/playwright'),{recursive:true});
 try{
  for(let i=0;i<2;i++){
   const name=names[i];await command(name,['open','about:blank','--browser',i===0?'chrome':'webkit']);opened.push(name);await command(name,['snapshot']);
   await code(name,`async page=>{
    page.setDefaultTimeout(10000);await page.setViewportSize({width:${i===0?1440:390},height:900});
    await page.routeWebSocket('wss://treino-integration.supabase.co/**',ws=>ws.close());
    await page.route('https://treino-integration.supabase.co/**',async route=>{const original=new URL(route.request().url());const response=await route.fetch({url:${JSON.stringify(fixture.origin)}+'/__api__'+original.pathname+original.search});await route.fulfill({response});});
    await page.goto(${JSON.stringify(url)});await page.getByRole('button',{name:'Entrar ou criar conta',exact:true}).click();
    await page.locator('#auth-email').fill('fixture-0@example.invalid');await page.locator('#auth-password').fill('Fixture-only-123!');await page.locator('#auth-submit').click();
    await page.waitForFunction(()=>document.body.dataset.auth==='ready');await page.waitForFunction(()=>document.querySelector('#sync-title').textContent==='Tudo guardado online');
   }`);
  }
  await code(names[0],`async page=>{
   await page.getByRole('button',{name:'+ Criar plano',exact:true}).click();await page.locator('#new-name').fill('Treino sincronizado fictício');await page.getByRole('button',{name:'Criar treino',exact:true}).click();
   await page.getByRole('button',{name:'Adicionar exercício',exact:true}).click();await page.getByLabel('Pesquisar exercício',{exact:true}).fill('Curl martelo com halteres');await page.getByRole('checkbox',{name:/^Curl martelo com halteres/}).check();await page.getByRole('button',{name:'Adicionar 1 exercício',exact:true}).click();
   await page.getByRole('button',{name:'Concluir edição',exact:true}).click();await page.getByRole('button',{name:'Começar sessão',exact:true}).click();
   await page.getByLabel('Carga, Curl martelo com halteres, série 1',{exact:true}).fill('5');await page.getByLabel('Repetições, Curl martelo com halteres, série 1',{exact:true}).fill('8');await page.getByRole('button',{name:'Concluir série 1 de Curl martelo com halteres',exact:true}).click();await page.getByRole('button',{name:'Guardar sessão no histórico',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('#sync-title').textContent==='Tudo guardado online');
  }`);
  // No sync button, reload, app callbacks or accelerated timers: wait for the real fallback poll.
  await code(names[1],`async page=>{
   await page.getByRole('navigation').getByRole('button',{name:'Histórico',exact:true}).click();
   await page.waitForFunction(()=>document.querySelectorAll('.history-item').length===1,undefined,{timeout:45000});
   if(!(await page.locator('.history-item').innerText()).includes('Treino sincronizado fictício'))throw Error('PC session did not arrive on the second device');
   await page.getByRole('navigation').getByRole('button',{name:'Os meus treinos',exact:true}).click();await page.getByRole('button',{name:'+ Criar plano',exact:true}).click();await page.locator('#new-name').fill('Criado no segundo dispositivo');await page.getByRole('button',{name:'Criar treino',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#sync-title').textContent==='Tudo guardado online');
  }`);
  await code(names[0],`async page=>{
   await page.getByRole('navigation').getByRole('button',{name:'Os meus treinos',exact:true}).click();
   await page.getByRole('button',{name:/^Criado no segundo dispositivo/}).waitFor({timeout:45000});
   await page.getByRole('button',{name:/^Criado no segundo dispositivo/}).click();
   await page.locator('#plan-name').fill('Nome atualizado sem sair do campo');
   await page.waitForFunction(()=>document.querySelector('#sync-title').textContent==='Tudo guardado online');
   await page.getByRole('button',{name:'A minha conta',exact:true}).click();await page.getByRole('button',{name:'Terminar sessão',exact:true}).click();
   await page.waitForFunction(()=>document.body.dataset.auth==='locked');if(await page.locator('#content').innerText())throw Error('Private cached data remained in the signed-out DOM');
   await page.getByRole('button',{name:'Entrar ou criar conta',exact:true}).click();await page.locator('#auth-email').fill('fixture-1@example.invalid');await page.locator('#auth-password').fill('Fixture-only-123!');await page.locator('#auth-submit').click();
   await page.waitForFunction(()=>document.body.dataset.auth==='ready');await page.waitForFunction(()=>document.querySelector('#sync-title').textContent==='Tudo guardado online');
   if(await page.locator('[data-home-plan]').count())throw Error('A second account received the first account plans');
   await page.screenshot({path:'output/playwright/sync-private-account.png'});
  }`);
  await code(names[1],`async page=>{await page.waitForFunction(()=>document.querySelector('#plan-name')?.value==='Nome atualizado sem sair do campo',undefined,{timeout:45000});}`);
  const token=fixture.session(fixture.users[1]).access_token,headers={Authorization:'Bearer '+token,'X-Client-Info':'treino/8','Content-Type':'application/json'};
  const foreign=await fetch(fixture.origin+'/__api__/rest/v1/training_documents?select=payload&user_id=eq.'+fixture.users[0].id,{headers});assert.deepEqual(await foreign.json(),[]);
  const denied=await fetch(fixture.origin+'/__api__/rest/v1/rpc/save_training_document',{method:'POST',headers,body:JSON.stringify({p_user_id:fixture.users[0].id,p_payload:{version:1},p_expected_revision:1})});assert.equal(denied.status,403);assert.equal((await denied.json()).code,'42501');
  assert.ok(fixture.metrics.reads>=4&&fixture.metrics.writes>=3);assert.ok([...fixture.metrics.clientHeaders].every(header=>header==='treino/8'));
  console.log('PASS: Chrome → HTTP/SDK → isolated SQL/RLS → WebKit, and back, without sync/reload; logout hides cache; another account stays empty; foreign reads/writes rejected.');
  console.log('Fixture Auth and HTTP adapter, real shipped clients and PGlite policies. No hosted Supabase, SMTP, Realtime socket or physical iPhone verification.');
 }catch(error){for(const name of opened)try{fs.writeFileSync(path.join(root,'output/playwright/'+name+'-failure.txt'),await command(name,['snapshot']));}catch{}throw error;}
 finally{await Promise.allSettled(opened.map(name=>command(name,['close'])));await fixture.close();}
}
main().catch(error=>{console.error(error.stdout||error.message);process.exitCode=1});
