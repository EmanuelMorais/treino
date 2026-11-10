const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
test('deployment packaging includes referenced public assets and excludes local credentials/tests',async()=>{
 const {packageSite}=await import('../scripts/package-site.mjs'),root=await fs.mkdtemp(path.join(os.tmpdir(),'treino-site-'));
 try{
  await fs.writeFile(path.join(root,'index.html'),'<script src="config.js"></script><script src="app.js?v=1"></script>');
  await fs.writeFile(path.join(root,'config.js'),"window.TREINO_CONFIG={supabaseUrl:'https://fixture.supabase.co',supabasePublishableKey:'sb_publishable_fixture',ignored:'private sentinel'};");
  await fs.writeFile(path.join(root,'app.js'),'// public fixture');await fs.writeFile(path.join(root,'.env.smtp.local'),'private sentinel');await fs.writeFile(path.join(root,'test.cjs'),'private sentinel');
  const result=await packageSite(root);assert.equal(result.assets,3);assert.equal((await fs.readdir(result.out)).includes('.env.smtp.local'),false);assert.equal((await fs.readFile(path.join(result.out,'config.js'),'utf8')).includes('private sentinel'),false);
  await packageSite(root); // reproducible rebuild of its own generated directory
  await fs.writeFile(path.join(root,'index.html'),'<script src="../outside.js"></script>');await assert.rejects(packageSite(root),/Invalid public asset/);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('service-role keys cannot be packaged as client configuration',async()=>{
 const {publicConfig}=await import('../scripts/package-site.mjs'),enc=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
 assert.throws(()=>publicConfig("{supabaseUrl:'https://fixture.supabase.co',supabasePublishableKey:'"+enc({alg:'HS256'})+'.'+enc({role:'service_role'})+".signature'}"),/Only a publishable/);
 assert.throws(()=>publicConfig("{supabaseUrl:'https://fixture.supabase.co',supabasePublishableKey:'sb_secret_fixture'}"),/Only a publishable/);
});

test('an unrelated output directory is never uploaded or removed as a generated artifact',async()=>{
 const {packageSite}=await import('../scripts/package-site.mjs'),root=await fs.mkdtemp(path.join(os.tmpdir(),'treino-dist-'));
 try{await fs.mkdir(path.join(root,'dist'));await fs.writeFile(path.join(root,'dist','private.txt'),'sentinel');await assert.rejects(packageSite(root),/Unmanaged dist/);assert.equal(await fs.readFile(path.join(root,'dist','private.txt'),'utf8'),'sentinel');}finally{await fs.rm(root,{recursive:true,force:true});}
});
