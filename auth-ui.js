/* Email/password account screens. Passwords are sent only to Supabase Auth. */
(function(root){
 function create({auth,$,modal:showModal,closeModal,onSession,redirectTo,esc,onPasswordSaved,onGuestExport}){
  const modal=(title,body)=>showModal(title,body,true);
  let generation=0;
  function open({mode='login',email='',accountId=null,guestWarning=''}={}){
   const epoch=++generation,register=mode==='register',password=mode==='password',hasPassword=register||password||mode==='login';
   const titles={login:'Entrar',register:'Criar conta',reset:'Recuperar palavra-passe',link:'Entrar por link de email',password:'Definir palavra-passe'};
   const submit={login:'Entrar',register:'Criar conta',reset:'Enviar recuperação',link:'Enviar link de acesso',password:'Guardar palavra-passe'};
   modal(titles[mode],`${guestWarning}<p class="auth-note">${password?'Define uma palavra-passe para entrares com o teu email nos próximos acessos.':register?'Cria a tua conta e confirma o email. Os teus planos e registos ficam privados.':mode==='login'?'Usa a mesma conta no computador e no telemóvel. A sessão fica guardada neste dispositivo.':mode==='reset'?'Recebe um link no email para definires uma nova palavra-passe.':'Recebe um link de acesso, sem precisares de palavra-passe.'}</p><form id="auth-form">${password?`<p class="account-name">${esc(email)}</p>`:`<label>Email<input type="email" id="auth-email" name="email" autocomplete="email" value="${esc(email)}" required maxlength="254"></label>`}${hasPassword?`<label>${password?'Nova palavra-passe':'Palavra-passe'}<input type="password" id="auth-password" name="password" autocomplete="${register||password?'new-password':'current-password'}" ${register||password?'minlength="8"':''} required></label>`:''}${register||password?'<label>Confirmar palavra-passe<input type="password" id="auth-password-confirm" name="password-confirm" autocomplete="new-password" minlength="8" required></label><p class="auth-note">Usa pelo menos 8 caracteres.</p>':''}<div class="form-actions"><button type="submit" class="btn" id="auth-submit">${submit[mode]}</button></div></form><p id="auth-message" class="auth-message" role="status"></p>${password?'':`<div class="home-actions">${mode==='login'?'<button class="btn secondary" id="auth-register">Criar conta</button><button class="btn secondary" id="auth-reset">Esqueci-me da palavra-passe</button><button class="mini" id="auth-link">Entrar por link de email</button>':'<button class="btn secondary" id="auth-login">Voltar a entrar</button>'}</div>`}`);
   const form=$('#auth-form'),message=$('#auth-message'),button=$('#auth-submit');
   if($('#guest-export'))$('#guest-export').onclick=onGuestExport;
   const current=()=>epoch===generation&&$('#auth-form')===form;
   if(!password){
    for(const next of ['login','register','reset','link']){const control=$('#auth-'+next);if(control)control.onclick=()=>open({mode:next,email:$('#auth-email').value.trim(),guestWarning});}
   }
   form.onsubmit=async event=>{
    event.preventDefault();const address=password?email:$('#auth-email').value.trim(),secret=hasPassword?$('#auth-password').value:'';
    if((register||password)&&secret!==$('#auth-password-confirm').value){message.textContent='As palavras-passe não coincidem.';return;}
    if((register||password)&&secret.length<8){message.textContent='Usa uma palavra-passe com pelo menos 8 caracteres.';return;}
    button.disabled=true;message.textContent='A processar…';
    try{
     let result;
     if(password){
      const account=await auth.getUser();if(!current())return;if(account.error||account.data?.user?.id!==accountId)throw {code:'session_not_found'};
      result=await auth.updateUser({password:secret});
     }else if(register)result=await auth.signUp({email:address,password:secret,options:{emailRedirectTo:redirectTo()}});
     else if(mode==='login')result=await auth.signInWithPassword({email:address,password:secret});
     else if(mode==='reset')result=await auth.resetPasswordForEmail(address,{redirectTo:redirectTo()});
     else result=await auth.signInWithOtp({email:address,options:{shouldCreateUser:false,emailRedirectTo:redirectTo()}});
     if(result.error)throw result.error;if(!current())return;
     if(hasPassword)$('#auth-password').value='';if(register||password)$('#auth-password-confirm').value='';
     if(password){generation++;closeModal();onPasswordSaved?.();return;}
     if(result.data?.session){generation++;closeModal();await onSession(result.data.session);return;}
     message.textContent=register?'Consulta o email e confirma a conta. Depois entra com o email e a palavra-passe.':mode==='reset'?'Se existir uma conta com este email, receberás um link de recuperação.':'Consulta o email e abre o link para entrar. Depois podes definir uma palavra-passe em A minha conta.';
    }catch(error){if(current())message.textContent=errorText(error);}
    finally{if(current())button.disabled=false;}
   };
  }
  function errorText(error){
   if(error.code==='invalid_credentials'||error.code==='invalid_login_credentials')return 'Email ou palavra-passe incorretos. Se entravas por link, usa a recuperação para definir uma palavra-passe.';
   if(error.code==='email_not_confirmed')return 'Confirma primeiro o email através do link recebido.';
   if(error.code==='session_not_found'||error.code==='reauthentication_needed')return 'Entra novamente ou pede um novo link de recuperação antes de definir a palavra-passe.';
   if(error.status===429||/rate_limit/.test(error.code||''))return 'Demasiadas tentativas. Aguarda um pouco e tenta novamente.';
   return error.message||'Não foi possível concluir. Tenta novamente.';
  }
  return {open};
 }
 const api={create};if(typeof module==='object'&&module.exports)module.exports=api;else root.TreinoAuthUI=api;
})(typeof window!=='undefined'?window:this);
