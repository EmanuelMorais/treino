const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {scanRepository}=require('../scripts/check-secrets.cjs');
const binary=path.resolve('work/security-tools/gitleaks');
function fixture(run){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'treino-security-test-'));
 const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
 try{git(['init','-q']);git(['config','user.name','Synthetic fixture']);git(['config','user.email','fixture@example.invalid']);git(['config','core.hooksPath','/dev/null']);return run({root,git,write:(name,value)=>fs.writeFileSync(path.join(root,name),value)});}finally{fs.rmSync(root,{recursive:true,force:true});}
}
test('scanner rejects ignored private files if they are force-added to Git without exposing content',()=>fixture(({root,git,write})=>{
 write('.env.production','SMTP_PASSWORD='+'synthetic-value');git(['add','-f','.env.production']);
 assert.throws(()=>scanRepository({root,binary,staged:true}),error=>error.message.includes('.env.production')&&!error.message.includes('synthetic-value'));
}));
test('scanner accepts browser publishable configuration but rejects an administrative JWT',()=>fixture(({root,git,write})=>{
 write('config.js',"window.config={key:'sb_publishable_fixture_public_value'}");git(['add','config.js']);git(['commit','-qm','public fixture']);
 assert.equal(scanRepository({root,binary}).trackedFiles,1);
 const enc=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
 const token=enc({alg:'HS256'})+'.'+enc({role:'service_role'})+'.'+Buffer.from('synthetic-signature').toString('base64url');
 write('config.js',token);
 assert.throws(()=>scanRepository({root,binary}),error=>error.message.includes('JWT administrativo')&&!error.message.includes(token));
}));
test('a staged server key is blocked even when the working file has already been cleaned',()=>fixture(({root,git,write})=>{
 const token=['sb','secret','synthetic'.repeat(5)].join('_');write('config.js',token);git(['add','config.js']);write('config.js','// clean working file');
 assert.throws(()=>scanRepository({root,binary,staged:true}),error=>/recusada/.test(error.message)&&!error.message.includes(token));
}));
test('deleting a server key from the current tree does not hide it from a full-history scan',()=>fixture(({root,git,write})=>{
 const token=['xsmtpsib','synthetic'.repeat(5)].join('-');write('config.js',token);git(['add','config.js']);git(['commit','-qm','synthetic history fixture']);
 write('config.js','// removed');git(['add','config.js']);git(['commit','-qm','clean current fixture']);
 assert.throws(()=>scanRepository({root,binary}),error=>/recusada/.test(error.message)&&!error.message.includes(token));
}));
test('scanner refuses symlinks so it cannot read an ignored private file through a tracked link',()=>fixture(({root,git,write})=>{
 write('private.txt','synthetic-private-content');fs.symlinkSync(path.join(root,'private.txt'),path.join(root,'link.txt'));git(['add','link.txt']);
 assert.throws(()=>scanRepository({root,binary,staged:true}),/ligações simbólicas/);
}));
test('commit messages are scanned even when file contents are clean',()=>fixture(({root,git,write})=>{
 const token=['sb','secret','synthetic'.repeat(5)].join('_');write('clean.txt','public fixture');git(['add','clean.txt']);git(['commit','-qm',token]);
 assert.throws(()=>scanRepository({root,binary}),error=>/recusada/.test(error.message)&&!error.message.includes(token));
}));
test('a private environment file removed from the latest tree still blocks publication',()=>fixture(({root,git,write})=>{
 write('.env.production','# no value required');git(['add','-f','.env.production']);git(['commit','-qm','synthetic private path fixture']);git(['rm','-q','.env.production']);git(['commit','-qm','remove private path']);
 assert.throws(()=>scanRepository({root,binary}),/ficheiro privado no histórico/);
}));
test('an inline allow comment cannot silence a staged credential',()=>fixture(({root,git,write})=>{
 const token=['sb','secret','synthetic'.repeat(5)].join('_');write('config.js',token+' // gitleaks:allow');git(['add','config.js']);
 assert.throws(()=>scanRepository({root,binary,staged:true}),/recusada/);
}));
