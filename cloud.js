/* Generated from auth-data.js and src/cloud-app.js. Run npm run build. */
/* Authenticated data requests: never fall back to visitor credentials for account data. */
(function(root){
 function required(){const error=new Error('Renova o acesso para sincronizar. Os dados continuam guardados neste navegador.');error.code='AUTH_REQUIRED';return error;}
 function create(auth){
  function matches(session,id){return !!session?.access_token&&session.user?.id===id;}
  async function refresh(id){
   const result=await auth.refreshSession();
   if(result.error){if(!result.error.status||result.error.status>=500)throw result.error;throw required();}
   if(!matches(result.data?.session,id))throw required();
   return result.data.session;
  }
  async function sessionFor(id){
   const result=await auth.getSession();const session=result.data?.session;
   if(result.error||!matches(session,id)||(session.expires_at&&session.expires_at<=Math.floor(Date.now()/1000)+30))return refresh(id);
   return session;
  }
  return {async run(id,query){
   if(!id)throw required();
   const session=await sessionFor(id);
   let result=await query(session.access_token);
   // A rejected authentication request has not executed a write. Retry once with a fresh token.
   if(result.status===401){const fresh=await refresh(id);result=await query(fresh.access_token);if(result.status===401)throw required();}
   return result;
  }};
 }
 const api={create};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.TreinoAuthData=api;
})(typeof window!=='undefined'?window:this);

/* Account-local cache + optimistic online saves. No administrator key is used. */
(function(){
 'use strict';
 const cfg=window.TREINO_CONFIG||{},rules=window.TreinoSyncRules;
 const configured=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.supabaseUrl||'')&&typeof cfg.supabasePublishableKey==='string'&&cfg.supabasePublishableKey.length>20;
 const client=configured?window.TreinoSupabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
 const dataRequests=client?window.TreinoAuthData.create(client.auth):null;
 let authNeeded=false;
 let user=null,baseRevision=0,dirty=false,sequence=0,loading=false,saving=false,conflict=false,timer,retryTimer,accountEpoch=0;
 const cacheKey=id=>'treino-account-'+id;
 const metaKey=id=>cacheKey(id)+'-sync';
 const snapshot=()=>JSON.parse(JSON.stringify(state));
 const readJSON=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
 function showStatus(title,detail,status='ok'){
  $('#sync-title').textContent=title;$('#sync-detail').textContent=detail;$('#sync-bar').dataset.status=status;
  $('#account').textContent=authNeeded?'Renovar acesso':user?'A minha conta':'Entrar';$('#sync-now').hidden=!user;$('#online-backups').hidden=!user;
 }
 function needAuth(){authNeeded=true;clearTimeout(timer);clearTimeout(retryTimer);showStatus('Renova o acesso para sincronizar','As alterações continuam guardadas neste navegador. Usa Renovar acesso; não é preciso apagar os dados.','error');}
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
 async function remoteDocument(id){
  const {data,error}=await dataRequests.run(id,token=>client.from('training_documents').select('payload,revision,updated_at').eq('user_id',id).maybeSingle().setHeader('Authorization','Bearer '+token));if(error)throw error;
  if(data&&!validState(data.payload))throw Error('A cópia online tem um formato inválido. Exporta a cópia local antes de continuar.');return data;
 }
 function usePayload(payload){loadAccountState(JSON.parse(JSON.stringify(payload)),cacheKey(user.id));cacheCurrent()}
 async function enterAccount(session){
  const next=session?.user||null;if(next?.id===user?.id){if(next&&authNeeded){authNeeded=false;if(dirty)setTimeout(flush,0);}return;}
  const epoch=++accountEpoch;clearTimeout(timer);clearTimeout(retryTimer);loading=true;$('#content').inert=true;conflict=false;saving=false;
  user=next;sequence=0;authNeeded=false;
  if(!user){dirty=false;baseRevision=0;loadAccountState(fresh(),KEY);loading=false;$('#content').inert=false;showStatus('Sessão terminada','Os dados da conta ficaram guardados; entra para os voltar a consultar.');return}
  const local=readJSON(cacheKey(user.id)),localExists=!!local&&validState(local),meta=readJSON(metaKey(user.id));
  baseRevision=Number.isSafeInteger(meta?.revision)?meta.revision:0;dirty=localExists&&(meta?.dirty!==false);
  loadAccountState(localExists?local:fresh(),cacheKey(user.id));cacheCurrent();
  showStatus('A carregar a conta','A comparar a cópia local com os dados online.');
  try{
   const remote=await remoteDocument(user.id);if(epoch!==accountEpoch)return;
   const decision=rules.decide({localExists,dirty,baseRevision,remote});
   if(decision==='conflict'){conflict=true;showStatus('Há alterações em dois dispositivos','Abre Sincronizar para escolher a versão; nenhuma será substituída automaticamente.','conflict')}
   else if(decision==='pull'){baseRevision=remote.revision;dirty=false;usePayload(remote.payload);showStatus('Tudo guardado online','Planos e registos atualizados nesta conta.')}
   else {dirty=true;showStatus('Conta pronta','A guardar os planos e registos.');}
   writeMeta();
  }catch(error){if(epoch!==accountEpoch)return;dirty=dirty||!localExists;if(error.code==='AUTH_REQUIRED')needAuth();else showStatus('Não foi possível ligar à conta',error.message||'A cópia local está disponível. Tenta sincronizar novamente.','error');writeMeta()}
  finally{if(epoch===accountEpoch){loading=false;$('#content').inert=false;if(dirty&&!conflict&&!authNeeded)flush();}}
 }
 async function flush(){
  if(!user||!client||loading||saving||conflict||authNeeded||!dirty)return;
  if(!navigator.onLine){showStatus('Sem ligação · cópia local','Os dados serão enviados quando a ligação regressar.');return}
  const target=user.id,epoch=accountEpoch,sentSequence=sequence,payload=snapshot();saving=true;
  showStatus('A guardar online','Mantém esta página aberta até aparecer a confirmação.');
  try{
   const {data,error}=await dataRequests.run(target,token=>client.rpc('save_training_document',{p_user_id:target,p_payload:payload,p_expected_revision:baseRevision}).setHeader('Authorization','Bearer '+token));
   if(epoch!==accountEpoch)return;if(error)throw error;
   if(!Number.isSafeInteger(Number(data?.revision))||Number(data.revision)<=baseRevision)throw Error('O servidor não confirmou a gravação.');
   baseRevision=Number(data.revision);dirty=rules.afterSave({sentSequence,currentSequence:sequence});writeMeta();
   if(!dirty)showStatus('Tudo guardado online','Última gravação: '+new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})+'. Cópia local disponível.');
  }catch(error){
   if(epoch!==accountEpoch)return;
   dirty=true;writeMeta();
   if(error.code==='AUTH_REQUIRED'){needAuth()}
   else if(rules.isConflict(error)){conflict=true;showStatus('Há uma versão mais recente online','Abre Sincronizar para resolver sem perder os registos locais.','conflict')}
   else{showStatus('Gravação online pendente',error.message||'A cópia local foi mantida. Tenta novamente quando houver ligação.','error');clearTimeout(retryTimer);retryTimer=setTimeout(flush,30000)}
  }finally{if(epoch===accountEpoch){saving=false;if(dirty&&!conflict&&!authNeeded) {clearTimeout(timer);timer=setTimeout(flush,30000)}}}
 }
 async function syncNow(){
  if(!user||authNeeded)return authDialog(true);if(saving)return toast('A gravação ainda está a decorrer.');
  const epoch=accountEpoch;
  try{
   const remote=await remoteDocument(user.id);if(epoch!==accountEpoch)return;
   if(remote&&dirty&&remote.revision!==baseRevision){conflict=true;return conflictDialog(remote)}
   if(!dirty&&remote){loading=true;baseRevision=remote.revision;usePayload(remote.payload);writeMeta();loading=false;showStatus('Tudo guardado online','A versão mais recente está neste dispositivo.');return}
   conflict=false;await flush();
  }catch(e){if(e.code==='AUTH_REQUIRED')needAuth();else showStatus('Não foi possível sincronizar',e.message||'Mantém a cópia local e tenta novamente.','error')}
 }
 function conflictDialog(remote){
  modal('Escolher a versão dos dados',`<p>Existem alterações locais e uma versão online mais recente. Exporta a cópia deste dispositivo antes de escolher. Os planos e registos não serão combinados automaticamente.</p><p class="auth-note">Versão online: ${esc(new Date(remote.updated_at).toLocaleString('pt-PT'))}. Ao guardar, o servidor mantém cópias das últimas 20 versões.</p><div class="home-actions"><button class="btn secondary" id="conflict-export">Exportar deste dispositivo</button><button class="btn" id="conflict-cloud">Usar a versão online</button><button class="btn secondary" id="conflict-local">Guardar esta versão online</button></div>`);
  $('#conflict-export').onclick=downloadBackup;
  $('#conflict-cloud').onclick=()=>{recoveryCopy();loading=true;baseRevision=remote.revision;dirty=false;conflict=false;usePayload(remote.payload);writeMeta();loading=false;closeModal();showStatus('Tudo guardado online','Versão online carregada. A cópia anterior deste dispositivo foi preservada localmente.')};
  $('#conflict-local').onclick=()=>{recoveryCopy();baseRevision=remote.revision;conflict=false;dirty=true;writeMeta();closeModal();flush()};
 }
 function authError(error){
  if(error.code==='email_address_not_authorized')return 'O envio de emails ainda está em configuração e não permite este endereço. Os dados locais mantêm-se guardados.';
  if(error.code==='over_email_send_rate_limit'||error.status===429)return 'Foi atingido o limite de emails de acesso. Aguarda antes de tentar novamente; os dados locais mantêm-se guardados.';
  return error.message||'Não foi possível enviar o acesso. Tenta novamente.';
 }
 function authDialog(force=false){
  if(!configured){modal('Ligação online por configurar','<p>O site já guarda planos e registos neste navegador e permite exportar uma cópia. O login e a sincronização ainda aguardam a configuração do novo projeto Supabase.</p><p class="auth-note">Quando essa ligação estiver ativa, poderás entrar na mesma conta no computador e no telemóvel. Os registos locais existentes mantêm-se disponíveis.</p>');return}
  if(user&&!force&&!authNeeded){modal('A minha conta',`<p class="account-name">${esc(user.email||'Conta pessoal')}</p><p class="auth-note">Os planos, rascunhos e registos pertencem a esta conta. Para outra pessoa, termina a sessão e usa outro email.</p><div class="home-actions"><button class="btn" id="account-sync">Sincronizar agora</button><button class="btn secondary" id="account-export">Exportar cópia</button><button class="btn secondary" id="account-signout">Terminar sessão</button></div>`);$('#account-export').onclick=downloadBackup;$('#account-sync').onclick=()=>{closeModal();syncNow()};$('#account-signout').onclick=async()=>{
    if(saving)return toast('Espera pela confirmação de gravação antes de sair.');if(dirty){await flush();if(dirty)return toast('Há registos por sincronizar. Exporta uma cópia e resolve a sincronização antes de sair.');}
    const {error}=await client.auth.signOut({scope:'local'});if(error)return toast(error.message);closeModal();await enterAccount(null);
   };return}
  modal(user?'Renovar acesso':'Entrar ou criar conta',`<p class="auth-note">Recebe um link de acesso no teu email e abre-o para entrar, sem palavra-passe. Usa o mesmo email nos teus dispositivos. Cada pessoa tem os seus dados separados.</p>${!user&&(state.history.length||state.plans.some(p=>!p.prepared&&!p.course&&!p.sourceExact))?'<p class="auth-note">Tens dados guardados sem conta. Exporta uma cópia antes de entrar e importa-a depois na conta pretendida.</p><button class="btn secondary" id="guest-export">Exportar antes de entrar</button>':''}<form id="auth-form"><label>Email<input type="email" id="auth-email" autocomplete="email" required maxlength="254"></label><div class="form-actions"><button type="submit" class="btn" id="auth-send">Enviar acesso por email</button></div></form><p id="auth-message" class="auth-message" role="status"></p><details id="otp-details" hidden><summary>O email também inclui um código?</summary><p class="auth-note">Usa esta alternativa apenas se a mensagem recebida mostrar um código. O link do email já permite entrar.</p><form id="otp-form"><label>Código recebido<input id="auth-code" inputmode="numeric" autocomplete="one-time-code" required minlength="6" maxlength="10" pattern="[0-9]{6,10}"></label><div class="form-actions"><button class="btn" type="submit" id="auth-verify">Confirmar código</button></div></form></details>`);
  if($('#guest-export'))$('#guest-export').onclick=downloadBackup;if((force||authNeeded)&&user?.email)$('#auth-email').value=user.email;let email='';$('#auth-form').onsubmit=async ev=>{ev.preventDefault();email=$('#auth-email').value.trim();$('#auth-send').disabled=true;$('#auth-message').textContent='A enviar…';const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:true,emailRedirectTo:location.origin+location.pathname}});if(!$('#auth-message'))return;$('#auth-send').disabled=false;if(error){$('#auth-message').textContent=authError(error);return}$('#auth-message').textContent='Consulta o email e abre o link de acesso. Se a mensagem incluir um código, também o podes escrever abaixo.';$('#otp-details').hidden=false;};
  $('#otp-form').onsubmit=async ev=>{ev.preventDefault();$('#auth-verify').disabled=true;const {data,error}=await client.auth.verifyOtp({email,token:$('#auth-code').value.trim(),type:'email'});if(error){$('#auth-message').textContent=error.message;$('#auth-verify').disabled=false;return}closeModal();await enterAccount(data.session)};
 }
 async function backupsDialog(){
  if(!user||authNeeded)return authDialog(true);const epoch=accountEpoch;showStatus('A consultar cópias online','Os dados locais mantêm-se disponíveis.');
  let listed;try{listed=await dataRequests.run(user.id,token=>client.from('training_backups').select('revision,created_at').eq('user_id',user.id).order('revision',{ascending:false}).limit(20).setHeader('Authorization','Bearer '+token));}catch(error){if(error.code==='AUTH_REQUIRED')needAuth();else showStatus('Não foi possível consultar as cópias',error.message,'error');return;}const {data,error}=listed;if(epoch!==accountEpoch)return;
  if(error){showStatus('Não foi possível consultar as cópias',error.message,'error');return}
  modal('Cópias de segurança online',`<p class="auth-note">Últimas 20 versões confirmadas pelo servidor. Exporta também uma cópia JSON para guardares fora do site.</p>${(data||[]).map(r=>`<div class="backup-row"><span>Versão ${r.revision}<br><small>${esc(new Date(r.created_at).toLocaleString('pt-PT'))}</small></span><button class="btn secondary" data-online-backup="${r.revision}">Recuperar</button></div>`).join('')||'<p>Ainda não há versões guardadas online.</p>'}<div class="home-actions"><button class="btn secondary" id="backup-export">Exportar dados atuais</button></div>`);
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
 $('#account').onclick=()=>authDialog();$('#sync-now').onclick=syncNow;$('#online-backups').onclick=backupsDialog;
 window.addEventListener('online',()=>{if(user){conflict?syncNow():flush()}});
 window.addEventListener('offline',()=>{if(user)showStatus('Sem ligação · cópia local',dirty?'Os dados serão enviados quando a ligação regressar.':'A última versão confirmada continua disponível neste navegador.')});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&dirty)flush();else if(document.visibilityState==='visible'&&user&&!dirty)syncNow()});
 window.addEventListener('beforeunload',event=>{if(user&&dirty){event.preventDefault();event.returnValue='';}});
 window.addEventListener('storage',event=>{if(user&&event.key===cacheKey(user.id)){conflict=true;showStatus('O treino mudou noutra janela','Sincroniza antes de continuar para escolher os registos a manter.','conflict')}});
 startApp();
 if(client){
  client.auth.onAuthStateChange((event,session)=>{if(['SIGNED_IN','SIGNED_OUT','INITIAL_SESSION','TOKEN_REFRESHED'].includes(event))setTimeout(()=>{if(event==='SIGNED_IN')closeModal();enterAccount(session)},0)});
  client.auth.getSession().then(({data,error})=>{if(error)showStatus('Não foi possível recuperar o login',error.message,'error');else if(data.session)enterAccount(data.session);else showStatus('Guardado neste navegador','Entra para sincronizar entre computador e telemóvel.')});
 }else showStatus('Guardado neste navegador','A gravação online aguarda a ligação ao novo Supabase.');
})();
