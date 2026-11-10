/* Account-local cache, optimistic saves and live updates. No administrator key is used. */
(function(){
 'use strict';
 const cfg=window.TREINO_CONFIG||{},rules=window.TreinoSyncRules;
 const configured=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.supabaseUrl||'')&&typeof cfg.supabasePublishableKey==='string'&&cfg.supabasePublishableKey.length>20;
 const clientBuild=window.TreinoRecords?.CLIENT_BUILD||9;
 // Server protocol 8 already enforces arbitrary minClientBuild values (including 9).
 const serverProtocol=8;
 const client=configured?window.TreinoSupabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{global:{headers:{'X-Client-Info':'treino/'+clientBuild}},auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
 const dataRequests=client?window.TreinoAuthData.create(client.auth):null;
 let authNeeded=false,accountVerified=false,clientUpgradeNeeded=false;
 let user=null,baseRevision=0,dirty=false,sequence=0,loading=false,saving=false,conflict=false,timer,retryTimer,accountEpoch=0;
 let liveChannel=null,pollTimer,autoTimer,autoPending=false,reading=null;
 let passwordRecovery=false;
 const authUI=client?window.TreinoAuthUI.create({auth:client.auth,$,modal,closeModal,esc,onGuestExport:downloadBackup,redirectTo:()=>location.origin+location.pathname,onSession:async session=>{await enterAccount(session);queueAutoSync()},onPasswordSaved:()=>{passwordRecovery=false;toast('Palavra-passe guardada. Já podes usá-la nos próximos acessos.');queueAutoSync()}}):null;
 const cacheKey=id=>'treino-account-'+id;
 const metaKey=id=>cacheKey(id)+'-sync';
 const snapshot=()=>JSON.parse(JSON.stringify(state));
 const readJSON=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
 function showStatus(title,detail,status='ok'){
  $('#sync-title').textContent=title;$('#sync-detail').textContent=detail;$('#sync-bar').dataset.status=status;
  $('#account').textContent=authNeeded?'Renovar acesso':user?'A minha conta':'Entrar';$('#sync-now').hidden=!user;$('#online-backups').hidden=!user;
 }
 function needAuth(){authNeeded=true;accountVerified=false;clearTimeout(timer);clearTimeout(retryTimer);stopAutoSync();setAccountAccess(false,'A sessão terminou. Entra novamente para continuar; os dados locais foram preservados.');showStatus('Renova o acesso para sincronizar','As alterações continuam guardadas neste navegador. Usa Renovar acesso; não é preciso apagar os dados.','error');}
 function writeMeta(){if(!user)return;try{localStorage.setItem(metaKey(user.id),JSON.stringify({revision:baseRevision,dirty,updatedAt:Date.now()}))}catch{showStatus('Cópia local sem espaço','Exporta uma cópia; a sincronização online será tentada.','error')}}
 function cacheCurrent(){try{localStorage.setItem(activeStorageKey,JSON.stringify(state));return true}catch{return false}}
 function recoveryCopy(){if(!user)return;try{localStorage.setItem(cacheKey(user.id)+'-recovery',JSON.stringify({date:new Date().toISOString(),payload:snapshot()}));return true}catch{return false}}
 function changed(){
  if(loading)return;
  if(!user){showStatus('Guardado neste navegador',configured?'Entra para sincronizar entre dispositivos.':'A gravação online aguarda a ligação ao novo Supabase.');return}
  dirty=true;sequence++;writeMeta();
  if(authNeeded){showStatus('Renova o acesso para sincronizar','As alterações continuam guardadas neste navegador. Usa Renovar acesso.','error');return;}
  showStatus(navigator.onLine?'Alterações por sincronizar':'Sem ligação · cópia local',navigator.onLine?'A enviar dentro de instantes.':'Os dados serão enviados quando a ligação regressar.');
  clearTimeout(timer);timer=setTimeout(flush,1300);
 }
 async function remoteDocument(id,revisionOnly=false){
  const {data,error}=await dataRequests.run(id,token=>client.from('training_documents').select(revisionOnly?'revision':'payload,revision,updated_at,client_protocol').eq('user_id',id).maybeSingle().setHeader('Authorization','Bearer '+token));
  if(error){if(['42703','PGRST204'].includes(error.code)&&String(error.message).includes('client_protocol'))throw Error('O servidor precisa da atualização de compatibilidade antes de usar esta versão. Os dados existentes não foram alterados.');throw error;}
  if(data&&!revisionOnly&&!(data.client_protocol>=serverProtocol))throw Error('O servidor ainda não suporta esta versão do Treino. Os registos foram preservados.');
  if(data&&!revisionOnly&&data.payload?.minClientBuild>clientBuild)throw Object.assign(Error('Este documento foi atualizado por uma versão mais recente. Atualiza a página para continuar; os registos locais foram preservados.'),{code:'CLIENT_UPGRADE_REQUIRED'});
  if(data&&!revisionOnly&&!validState(data.payload))throw Error('A cópia online tem um formato inválido. Exporta a cópia local antes de continuar.');return data;
 }
 function usePayload(payload,preserveView=false){loadAccountState(JSON.parse(JSON.stringify(payload)),cacheKey(user.id),{preserveView});cacheCurrent()}
 function stopAutoSync(){
  clearTimeout(pollTimer);clearTimeout(autoTimer);autoPending=false;reading=null;
  if(liveChannel){const old=liveChannel;liveChannel=null;Promise.resolve(client.removeChannel(old)).catch(()=>{});}
 }
 function queueAutoSync(){
  autoPending=true;clearTimeout(autoTimer);
  if(!user||authNeeded||loading||saving||reading||!navigator.onLine||document.visibilityState==='hidden'||$('#modal').open)return;
  autoTimer=setTimeout(()=>{autoPending=false;syncNow(true)},200);
 }
 async function startAutoSync(){
  stopAutoSync();if(!user||authNeeded)return;
  const epoch=accountEpoch,id=user.id;
  const poll=()=>{if(epoch!==accountEpoch)return;queueAutoSync();pollTimer=setTimeout(poll,30000)};
  pollTimer=setTimeout(poll,30000);
  try{
  // Finish the authenticated handshake before joining; the SDK refreshes it afterwards.
  await dataRequests.run(id,async token=>{if(epoch===accountEpoch)await client.realtime.setAuth(token);return {status:200}});
  if(epoch!==accountEpoch||authNeeded)return;
  // The row filter reduces traffic; the table's SELECT RLS policy enforces ownership.
  liveChannel=client.channel('training:'+id).on('postgres_changes',{
   event:'*',schema:'public',table:'training_documents',filter:'user_id=eq.'+id
  },event=>{
   if(epoch!==accountEpoch||event.new?.user_id!==id)return;
   if(Number(event.new.revision)>baseRevision)queueAutoSync();
  }).subscribe(status=>{
   if(epoch!==accountEpoch)return;
   if(status==='SUBSCRIBED')queueAutoSync(); // Also catches changes missed during reconnect.
  });
  }catch(error){if(epoch===accountEpoch&&error.code==='AUTH_REQUIRED')needAuth();} // Polling covers a failed socket setup.
 }
 async function enterAccount(session){
  const next=session?.user||null;if(next?.id===user?.id&&!authNeeded&&accountVerified)return;
  const epoch=++accountEpoch;stopAutoSync();clearTimeout(timer);clearTimeout(retryTimer);loading=true;$('#content').inert=true;conflict=false;saving=false;
  setAccountAccess(false,'A validar o acesso à tua conta…');let verified=false,accessError='';accountVerified=false;clientUpgradeNeeded=false;
  user=next;sequence=0;authNeeded=false;
  if(!user){dirty=false;baseRevision=0;loadAccountState(fresh(),KEY);loading=false;$('#content').inert=false;setAccountAccess(false);showStatus('Sessão terminada','Os dados da conta ficaram guardados; entra para os voltar a consultar.');return}
  const local=readJSON(cacheKey(user.id)),localExists=!!local&&validState(local),meta=readJSON(metaKey(user.id));
  baseRevision=Number.isSafeInteger(meta?.revision)?meta.revision:0;dirty=localExists&&(meta?.dirty!==false);
  if(local?.minClientBuild>clientBuild){
   clientUpgradeNeeded=true;loading=false;$('#content').inert=false;loadAccountState(fresh(),KEY);$('#gate-login').textContent='Atualizar aplicação';
   setAccountAccess(false,'Os dados locais pertencem a uma versão mais recente. Atualiza a página; a cópia local foi preservada.');showStatus('Atualizar aplicação','Os dados locais pertencem a uma versão mais recente. Não foram substituídos.','error');return;
  }
  loadAccountState(localExists?local:fresh(),cacheKey(user.id));
  showStatus('A carregar a conta','A comparar a cópia local com os dados online.');
  try{
   const remote=await remoteDocument(user.id);if(epoch!==accountEpoch)return;verified=true;
   const decision=rules.decide({localExists,dirty,baseRevision,remote});
   if(decision==='pull'){adoptRemote(remote,false);}
   else {cacheCurrent();dirty=true;showStatus('Conta pronta','A guardar os planos e registos.');}
   writeMeta();
  }catch(error){if(epoch!==accountEpoch)return;accessError=error.message||'';clientUpgradeNeeded=error.code==='CLIENT_UPGRADE_REQUIRED';if(error.code==='AUTH_REQUIRED')needAuth();else showStatus('Não foi possível ligar à conta',error.message||'A cópia local está disponível. Tenta sincronizar novamente.','error');writeMeta()}
  finally{if(epoch===accountEpoch){loading=false;$('#content').inert=false;accountVerified=verified&&!authNeeded;$('#gate-login').textContent=clientUpgradeNeeded?'Atualizar aplicação':user&&!authNeeded&&!accountVerified?'Tentar novamente':'Entrar ou criar conta';setAccountAccess(accountVerified,authNeeded?'Entra novamente para continuar.':accessError||'Não foi possível validar a sessão. Verifica a ligação e tenta entrar novamente.');if(accountVerified)startAutoSync();else stopAutoSync();if(verified&&dirty&&!conflict&&!authNeeded)flush();}}
 }
 async function flush(){
  if(!user||!client||!accountVerified||loading||saving||conflict||authNeeded||!dirty)return;
  if(!navigator.onLine){showStatus('Sem ligação · cópia local','Os dados serão enviados quando a ligação regressar.');return}
  const target=user.id,epoch=accountEpoch,sentSequence=sequence,payload=snapshot();let saved=false;saving=true;
  showStatus('A guardar online','Mantém esta página aberta até aparecer a confirmação.');
  try{
   const {data,error}=await dataRequests.run(target,token=>client.rpc('save_training_document',{p_user_id:target,p_payload:payload,p_expected_revision:baseRevision}).setHeader('Authorization','Bearer '+token));
   if(epoch!==accountEpoch)return;if(error)throw error;
   if(!Number.isSafeInteger(Number(data?.revision))||Number(data.revision)<=baseRevision)throw Error('O servidor não confirmou a gravação.');
   saved=true;baseRevision=Number(data.revision);dirty=rules.afterSave({sentSequence,currentSequence:sequence});writeMeta();
   if(!dirty)showStatus('Tudo guardado online','Última gravação: '+new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})+'. Cópia local disponível.');
  }catch(error){
   if(epoch!==accountEpoch)return;
   dirty=true;writeMeta();
   if(error.code==='AUTH_REQUIRED'){needAuth()}
   else if(rules.isConflict(error)){conflict=true;autoPending=true;showStatus('A atualizar os dados','A carregar automaticamente a versão online mais recente.');}
   else{showStatus('Gravação online pendente',error.message||'A cópia local foi mantida. Tenta novamente quando houver ligação.','error');clearTimeout(retryTimer);retryTimer=setTimeout(flush,30000)}
  }finally{if(epoch===accountEpoch){saving=false;if(dirty&&!conflict&&!authNeeded) {clearTimeout(timer);timer=setTimeout(flush,saved?1300:30000)}if(autoPending)queueAutoSync();}}
 }
 async function syncNow(automatic=false){
  if(!user||authNeeded||!accountVerified){if(!automatic)return authDialog(true);return;}
  if(loading||saving||reading||(automatic&&($('#modal').open||document.visibilityState==='hidden'))){if(automatic)autoPending=true;else toast('A sincronização ainda está a decorrer.');return;}
  if(!navigator.onLine)return;
  const epoch=accountEpoch,id=user.id;
  const task=(async()=>{try{
   const latest=await remoteDocument(id,true);if(epoch!==accountEpoch)return;
   // Own save events and the fallback poll must not re-render an unchanged workout.
   if(latest&&(Number(latest.revision)>baseRevision||(!automatic&&conflict))){
    const remote=await remoteDocument(id);if(epoch!==accountEpoch||!remote)return;
    // A local edit or save can start while either request is in flight.
    if(loading||saving||(automatic&&$('#modal').open)){autoPending=true;return;}
    if(Number(remote.revision)>baseRevision||(!automatic&&conflict)){
     adoptRemote(remote,true);return;
    }
   }
   conflict=false;
   if(!dirty){showStatus('Tudo guardado online','Planos e registos atualizados nesta conta.');return;}
   await flush();
  }catch(e){if(epoch!==accountEpoch)return;if(e.code==='AUTH_REQUIRED')needAuth();else showStatus('Não foi possível sincronizar',e.message||'Mantém a cópia local; a atualização será tentada automaticamente.','error')}
  })();
  reading=task;try{await task}finally{if(reading===task)reading=null;if(epoch===accountEpoch&&autoPending)queueAutoSync();}
 }
 function adoptRemote(remote,preserveView){
  const recovering=dirty&&Number(remote.revision)!==baseRevision;
  if(recovering&&!recoveryCopy())throw Error('Não há espaço para preservar a cópia local. Exporta os dados antes de sincronizar.');
  const previousLoading=loading;loading=true;
  try{usePayload(remote.payload,preserveView);baseRevision=Number(remote.revision);dirty=false;conflict=false;clearTimeout(timer);clearTimeout(retryTimer);writeMeta();}
  finally{loading=previousLoading;}
  showStatus('Tudo guardado online',recovering?'Versão online mais recente carregada. A cópia local anterior está disponível em Cópias online.':'Planos e registos atualizados automaticamente nesta conta.');
 }
 function authDialog(force=false){
  if(!configured){modal('Ligação online por configurar','<p>O site já guarda planos e registos neste navegador e permite exportar uma cópia. O login e a sincronização ainda aguardam a configuração do novo projeto Supabase.</p><p class="auth-note">Quando essa ligação estiver ativa, poderás entrar na mesma conta no computador e no telemóvel. Os registos locais existentes mantêm-se disponíveis.</p>');return}
  if(user&&!force&&!authNeeded&&accountVerified){modal('A minha conta',`<p class="account-name">${esc(user.email||'Conta pessoal')}</p><p class="auth-note">Os planos, rascunhos e registos pertencem a esta conta. Para outra pessoa, termina a sessão e usa outro email.</p><div class="home-actions"><button class="btn" id="account-password">Definir / alterar palavra-passe</button><button class="btn secondary" id="account-sync">Sincronizar agora</button><button class="btn secondary" id="account-export">Exportar cópia</button><button class="btn secondary" id="account-signout">Terminar sessão</button></div>`);$('#account-password').onclick=()=>authUI.open({mode:'password',email:user.email||'',accountId:user.id});$('#account-export').onclick=downloadBackup;$('#account-sync').onclick=()=>{closeModal();syncNow()};$('#account-signout').onclick=async()=>{
    if(saving)return toast('Espera pela confirmação de gravação antes de sair.');if(dirty){await flush();if(dirty)return toast('Há registos por sincronizar. Exporta uma cópia e resolve a sincronização antes de sair.');}
    const {error}=await client.auth.signOut({scope:'local'});if(error)return toast(error.message);closeModal();await enterAccount(null);
   };return}
  const guestWarning=!user&&(state.history.length||state.plans.some(p=>!p.prepared&&!p.course&&!p.sourceExact))?'<p class="auth-note">Tens dados guardados sem conta. Exporta uma cópia antes de entrar e importa-a depois na conta pretendida.</p><button class="btn secondary" id="guest-export">Exportar antes de entrar</button>':'';
  authUI.open({email:user?.email||'',guestWarning});if($('#guest-export'))$('#guest-export').onclick=downloadBackup;
 }
 async function backupsDialog(){
  if(!user||authNeeded)return authDialog(true);const epoch=accountEpoch;showStatus('A consultar cópias online','Os dados locais mantêm-se disponíveis.');
  let listed;try{listed=await dataRequests.run(user.id,token=>client.from('training_backups').select('revision,created_at').eq('user_id',user.id).order('revision',{ascending:false}).limit(20).setHeader('Authorization','Bearer '+token));}catch(error){if(error.code==='AUTH_REQUIRED')needAuth();else showStatus('Não foi possível consultar as cópias',error.message,'error');return;}const {data,error}=listed;if(epoch!==accountEpoch)return;
  if(error){showStatus('Não foi possível consultar as cópias',error.message,'error');return}
  const recovery=readJSON(cacheKey(user.id)+'-recovery');
  modal('Cópias de segurança',`<p class="auth-note">Últimas 20 versões confirmadas pelo servidor. Exporta também uma cópia JSON para guardares fora do site.</p>${validState(recovery?.payload)?`<div class="backup-row"><span>Cópia local preservada antes de uma atualização<br><small>${esc(new Date(recovery.date).toLocaleString('pt-PT'))} · disponível neste dispositivo</small></span><button class="btn secondary" id="local-recovery-export">Exportar cópia local</button></div>`:''}${(data||[]).map(r=>`<div class="backup-row"><span>Versão ${r.revision}<br><small>${esc(new Date(r.created_at).toLocaleString('pt-PT'))}</small></span><button class="btn secondary" data-online-backup="${r.revision}">Recuperar</button></div>`).join('')||'<p>Ainda não há versões guardadas online.</p>'}<div class="home-actions"><button class="btn secondary" id="backup-export">Exportar dados atuais</button></div>`);
  if($('#local-recovery-export'))$('#local-recovery-export').onclick=()=>{const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([JSON.stringify(recovery.payload,null,2)],{type:'application/json'}));link.download='treino-recuperacao-local.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),10000);};
  $('#backup-export').onclick=downloadBackup;document.querySelectorAll('[data-online-backup]').forEach(b=>b.onclick=async()=>{
   if(saving)return toast('Espera pela gravação atual.');
   let found;try{found=await dataRequests.run(user.id,token=>client.from('training_backups').select('payload').eq('user_id',user.id).eq('revision',Number(b.dataset.onlineBackup)).single().setHeader('Authorization','Bearer '+token));}catch(error){if(error.code==='AUTH_REQUIRED')needAuth();else toast('Não foi possível ler esta cópia.');return;}const {data:backup,error}=found;if(epoch!==accountEpoch)return;
   if(error||!validState(backup?.payload))return toast('Não foi possível ler esta cópia.');
   modal('Recuperar esta versão',`<p>Esta cópia tem ${backup.payload.history.length} sessões e ${backup.payload.plans.length} planos. Os dados atuais serão substituídos nesta conta.</p><div class="home-actions"><button class="btn secondary" id="restore-export">Exportar atuais primeiro</button><button class="btn" id="restore-confirm">Recuperar e guardar online</button></div>`);
   $('#restore-export').onclick=downloadBackup;$('#restore-confirm').onclick=()=>{recoveryCopy();loading=true;usePayload(backup.payload);loading=false;conflict=false;changed();closeModal();flush()};
  });
  showStatus(dirty?'Alterações por sincronizar':'Tudo guardado online','Cópias de segurança disponíveis.');
 }
 window.TreinoCloud={changed,syncNow};
 $('#gate-login').onclick=()=>clientUpgradeNeeded?location.reload():user&&!authNeeded&&!accountVerified?enterAccount({user}):authDialog(true);
 $('#account').onclick=()=>authDialog();$('#sync-now').onclick=()=>syncNow();$('#online-backups').onclick=backupsDialog;
 window.addEventListener('online',queueAutoSync);
 window.addEventListener('offline',()=>{if(user&&!conflict)showStatus('Sem ligação · cópia local',dirty?'Os dados serão enviados quando a ligação regressar.':'A última versão confirmada continua disponível neste navegador.')});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&dirty)flush();else if(document.visibilityState==='visible')queueAutoSync()});
 window.addEventListener('focus',queueAutoSync);
 window.addEventListener('pageshow',queueAutoSync);
 $('#modal').addEventListener('close',()=>{if(autoPending)queueAutoSync()});
 window.addEventListener('beforeunload',event=>{if(user&&dirty){event.preventDefault();event.returnValue='';}});
 window.addEventListener('storage',event=>{if(user&&event.key===cacheKey(user.id))queueAutoSync()});
 startApp();
 if(client){
  client.auth.onAuthStateChange((event,session)=>{
   if(event==='PASSWORD_RECOVERY')passwordRecovery=true;
   if(['SIGNED_IN','SIGNED_OUT','INITIAL_SESSION','TOKEN_REFRESHED','PASSWORD_RECOVERY'].includes(event))setTimeout(async()=>{if(event==='SIGNED_IN'&&!passwordRecovery)closeModal();await enterAccount(session);if(event==='PASSWORD_RECOVERY'&&user?.id===session?.user?.id)authUI.open({mode:'password',email:user.email||'',accountId:user.id});},0);
  });
  client.auth.getSession().then(({data,error})=>{if(error){setAccountAccess(false,'Não foi possível recuperar a sessão. Entra novamente.');showStatus('Não foi possível recuperar o login',error.message,'error');}else if(data.session)enterAccount(data.session);else setAccountAccess(false)});
 }else showStatus('Guardado neste navegador','A gravação online aguarda a ligação ao novo Supabase.');
})();
