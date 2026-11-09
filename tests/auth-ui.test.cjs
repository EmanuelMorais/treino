const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../auth-ui.js');
function screen(auth){
 const elements=new Map(),sessions=[];let title,html,closed=0,saved=0;
 const $=id=>elements.get(id)||null;
 const ui=create({auth,$,modal:(name,body)=>{title=name;html=body;elements.clear();for(const match of body.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g))elements.set('#'+match[1],{value:match[0].match(/\bvalue="([^"]*)"/)?.[1]||'',textContent:'',disabled:false})},closeModal:()=>{closed++;elements.clear()},onSession:async session=>sessions.push(session),onPasswordSaved:()=>saved++,redirectTo:()=> 'https://example.invalid/treino/',esc:x=>String(x)});
 return {ui,$,sessions,get title(){return title},get html(){return html},get closed(){return closed},get saved(){return saved},submit:()=>$('#auth-form').onsubmit({preventDefault(){}})};
}
test('password login authenticates the existing account without sending an email',async()=>{
 let received;const session={user:{id:'existing-account'}};
 const s=screen({signInWithPassword:async args=>{received=args;return {data:{session}}}});
 s.ui.open({email:'test@example.invalid'});assert.match(s.html,/autocomplete="current-password"/);
 s.$('#auth-password').value='test-password';await s.submit();
 assert.deepEqual(received,{email:'test@example.invalid',password:'test-password'});assert.deepEqual(s.sessions,[session]);assert.equal(s.closed,1);
});
test('registration requires matching passwords and requests email confirmation before signing in',async()=>{
 let received;const s=screen({signUp:async args=>{received=args;return {data:{session:null}}}});
 s.ui.open({mode:'register',email:'new@example.invalid'});s.$('#auth-password').value='password-123';s.$('#auth-password-confirm').value='different';await s.submit();assert.equal(received,undefined);
 s.$('#auth-password-confirm').value='password-123';await s.submit();
 assert.equal(received.options.emailRedirectTo,'https://example.invalid/treino/');assert.match(s.$('#auth-message').textContent,/confirma a conta/);assert.equal(s.sessions.length,0);assert.equal(s.$('#auth-password').value,'');
});
test('reset uses a recovery email and does not reveal whether an account exists',async()=>{
 let received;const s=screen({resetPasswordForEmail:async(...args)=>{received=args;return {data:{}}}});
 s.ui.open({mode:'reset',email:'test@example.invalid'});await s.submit();
 assert.deepEqual(received,['test@example.invalid',{redirectTo:'https://example.invalid/treino/'}]);assert.match(s.$('#auth-message').textContent,/Se existir uma conta/);
});
test('an existing magic-link account can define a password without changing its identity',async()=>{
 let received;const s=screen({getUser:async()=>({data:{user:{id:'owner'}}}),updateUser:async args=>{received=args;return {data:{user:{id:'owner'}}}}});
 s.ui.open({mode:'password',email:'test@example.invalid',accountId:'owner'});s.$('#auth-password').value='new-password-123';s.$('#auth-password-confirm').value='new-password-123';await s.submit();
 assert.deepEqual(received,{password:'new-password-123'});assert.equal(s.saved,1);assert.equal(s.closed,1);assert.equal(s.sessions.length,0);
});
test('password changes reject an account mismatch and a short or mismatching password',async()=>{
 let reads=0,updates=0;const s=screen({getUser:async()=>{reads++;return {data:{user:{id:'someone-else'}}}},updateUser:async()=>{updates++;return {data:{}}}});
 s.ui.open({mode:'password',accountId:'owner'});s.$('#auth-password').value='short';s.$('#auth-password-confirm').value='short';await s.submit();assert.equal(reads,0);
 s.$('#auth-password').value='long-password';s.$('#auth-password-confirm').value='long-password';await s.submit();assert.equal(updates,0);assert.match(s.$('#auth-message').textContent,/Entra novamente/);
});
test('magic link remains an optional way into existing accounts',async()=>{
 let received;const s=screen({signInWithOtp:async args=>{received=args;return {data:{}}}});
 s.ui.open({mode:'link',email:'test@example.invalid'});await s.submit();assert.equal(received.options.shouldCreateUser,false);assert.match(s.$('#auth-message').textContent,/define|definir/);
});
test('a delayed login result cannot alter another account form or start a session',async()=>{
 let release;const s=screen({signInWithPassword:()=>new Promise(resolve=>release=resolve)});
 s.ui.open({email:'test@example.invalid'});s.$('#auth-password').value='test-password';const waiting=s.submit();
 s.ui.open({mode:'reset',email:'test@example.invalid'});release({data:{session:{user:{id:'old'}}}});await waiting;
 assert.equal(s.title,'Recuperar palavra-passe');assert.equal(s.sessions.length,0);assert.equal(s.closed,0);
});
test('login errors leave the form usable and explain passwordless accounts',async()=>{
 const s=screen({signInWithPassword:async()=>({error:{code:'invalid_credentials'}})});
 s.ui.open({email:'test@example.invalid'});s.$('#auth-password').value='test-password';await s.submit();assert.match(s.$('#auth-message').textContent,/Email ou palavra-passe incorretos/);assert.equal(s.$('#auth-submit').disabled,false);
});
