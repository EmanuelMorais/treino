/* Loopback integration fixture. Auth endpoints are simulated; SQL/RLS are real PGlite. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
async function createServer(root){
 const db=new PGlite(),users=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'].map((id,i)=>({id,email:'fixture-'+i+'@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()}));
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
 for(const user of users)await db.query('insert into auth.users values($1)',[user.id]);
 for(const suffix of ['_training_sync.sql','_require_compatible_training_client.sql'])await db.exec(fs.readFileSync(path.join(root,'supabase/migrations',fs.readdirSync(path.join(root,'supabase/migrations')).find(name=>name.endsWith(suffix))),'utf8'));
 let serial=Promise.resolve();
 const asUser=(user,headers,operation)=>{
  const task=serial.then(async()=>{await db.exec('begin');try{await db.exec('set local role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.headers',$2,true)",[user.id,JSON.stringify(headers)]);const result=await operation(db);await db.exec('commit');return result;}catch(error){await db.exec('rollback');throw error;}});serial=task.catch(()=>{});return task;
 };
 const secret=crypto.randomBytes(32),tokens=new Map();
 const session=user=>{const enc=value=>Buffer.from(JSON.stringify(value)).toString('base64url'),unsigned=enc({alg:'HS256',typ:'JWT'})+'.'+enc({sub:user.id,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600});const token=unsigned+'.'+crypto.createHmac('sha256',secret).update(unsigned).digest('base64url');tokens.set(token,user);return {access_token:token,token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'fixture-refresh-'+user.id,user};};
 const original=fs.readFileSync(path.join(root,'index.html'),'utf8'),allowed=new Set([...original.matchAll(/(?:src|href)="([^"?]+)(?:\?[^" ]*)?"/g)].map(m=>m[1]));
 const json=(response,status,value)=>{response.writeHead(status,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS'});response.end(JSON.stringify(value));};
 const metrics={reads:0,writes:0,ownerErrors:0,clientHeaders:new Set()};
 const server=http.createServer(async(request,response)=>{
  const url=new URL(request.url,'http://localhost');
  try{
   if(url.pathname.startsWith('/__api__/')){
    if(request.method==='OPTIONS'){json(response,200,{});return;}
    let raw='';for await(const chunk of request){raw+=chunk;if(raw.length>16*1024*1024)throw Error('Fixture request too large');}const body=raw?JSON.parse(raw):{};
    const route=url.pathname.slice('/__api__'.length),token=String(request.headers.authorization||'').replace(/^Bearer /,''),user=tokens.get(token);
    if(route==='/auth/v1/token'){
     const found=url.searchParams.get('grant_type')==='refresh_token'?users.find(u=>body.refresh_token==='fixture-refresh-'+u.id):users.find(u=>u.email===body.email&&body.password==='Fixture-only-123!');
     json(response,found?200:400,found?session(found):{code:'invalid_credentials',message:'Invalid fixture credentials'});return;
    }
    if(!user){json(response,401,{code:'PGRST301',message:'Fixture authentication required'});return;}
    if(route==='/auth/v1/user'){json(response,200,user);return;}
    if(route==='/auth/v1/logout'){json(response,200,{});return;}
    metrics.clientHeaders.add(request.headers['x-client-info']);
    if(route==='/rest/v1/rpc/save_training_document'){
     const result=await asUser(user,request.headers,db=>db.query('select public.save_training_document($1,$2::jsonb,$3) as result',[body.p_user_id,JSON.stringify(body.p_payload),body.p_expected_revision]));metrics.writes++;json(response,200,result.rows[0].result);return;
    }
    if(route==='/rest/v1/training_documents'){
     const columns=(url.searchParams.get('select')||'revision').split(',');if(columns.some(c=>!['payload','revision','updated_at','client_protocol'].includes(c)))throw Error('Unsupported fixture projection');
     const requested=url.searchParams.get('user_id')?.replace(/^eq\./,'')||user.id;
     const result=await asUser(user,request.headers,db=>db.query('select '+columns.join(',')+' from public.training_documents where user_id=$1',[requested]));metrics.reads++;
     const single=String(request.headers.accept||'').includes('vnd.pgrst.object');json(response,200,single?result.rows[0]||null:result.rows);return;
    }
    json(response,404,{message:'Unsupported fixture endpoint'});return;
   }
   if(url.pathname==='/treino/'||url.pathname==='/treino/index.html'){response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});response.end(original);return;}
   const asset=url.pathname.replace(/^\/treino\//,'');
   if(asset==='config.js'){response.writeHead(200,{'Content-Type':'text/javascript'});response.end('window.TREINO_CONFIG='+JSON.stringify({supabaseUrl:'https://treino-integration.supabase.co',supabasePublishableKey:'sb_publishable_fixture_only_12345'})+';');return;}
   if(!allowed.has(asset)){response.writeHead(404);response.end();return;}
   response.writeHead(200,{'Content-Type':asset.endsWith('.css')?'text/css':'text/javascript'});response.end(fs.readFileSync(path.join(root,asset)));
  }catch(error){if(error.code==='42501')metrics.ownerErrors++;json(response,error.code==='PT409'?409:error.code==='PT426'?426:error.code==='42501'?403:400,{code:error.code||'FIXTURE_ERROR',message:error.message});}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {origin:'http://127.0.0.1:'+server.address().port,users,session,metrics,async close(){await new Promise(resolve=>server.close(resolve));await serial;await db.close();}};
}
module.exports={createServer};
