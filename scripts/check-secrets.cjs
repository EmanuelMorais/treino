/* Never print matches, tokens or scanner excerpts; scan only Git-owned files. */
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync,spawnSync}=require('node:child_process');
const git=(root,args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
function privatePath(name){return /(^|\/)(?:\.env(?:\..+)?|[^/]+\.(?:pem|key|p12|pfx))$/i.test(name)&&!/(^|\/)\.env\.example$/.test(name);}
function privilegedJWT(source){
 for(const match of source.matchAll(/\beyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+\b/g))try{if(['service_role','supabase_admin'].includes(JSON.parse(Buffer.from(match[1],'base64url')).role))return true;}catch{}
 return false;
}
function scanRepository({root=process.cwd(),staged=false,binary=process.env.GITLEAKS_BINARY||path.join(__dirname,'../work/security-tools/gitleaks')}={}){
 root=path.resolve(root);const config=path.join(__dirname,'../.gitleaks.toml');
 if(!fs.existsSync(binary))throw Error('Instala o scanner com npm run security:install.');
 const files=git(root,['ls-files','-z']).split('\0').filter(Boolean);
 const forbidden=files.filter(privatePath);
 if(forbidden.length)throw Error('Ficheiros privados versionados: '+forbidden.join(', '));
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'treino-public-scan-'));
 function detect(args){
  const result=spawnSync(binary,[...args,'--config',config,'--redact=100','--no-banner','--log-level','error'],{cwd:root,encoding:'utf8',maxBuffer:1024*1024});
  if(result.error)throw Error('Não foi possível executar o scanner.');
  if(result.status!==0)throw Error('Verificação de segredos recusada. Não publiques; revê os ficheiros localmente com saída redigida.');
 }
 try{
  for(const name of files){
   const source=path.join(root,name);if(!fs.existsSync(source))continue;
   const stat=fs.lstatSync(source);if(!stat.isFile())throw Error('A verificação não aceita ligações simbólicas: '+name);
   const bytes=fs.readFileSync(source);if(privilegedJWT(bytes.toString('utf8')))throw Error('JWT administrativo encontrado em '+name);
   const target=path.join(directory,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
  }
  detect(['dir',directory]);
  detect(['git',...(staged?['--staged']:['--log-opts=--all --full-history']),root]);
  return {trackedFiles:files.length,scope:staged?'working tree and staged changes':'working tree and all available Git refs'};
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
}
module.exports={scanRepository,privatePath,privilegedJWT};
if(require.main===module)try{console.log('PASS: no secrets detected. '+JSON.stringify(scanRepository({staged:process.argv.includes('--staged')})));}catch(error){console.error(error.message);process.exitCode=1;}
