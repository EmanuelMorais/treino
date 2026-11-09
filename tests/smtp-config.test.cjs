const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

test('SMTP setup never prints a credential echoed by the underlying CLI',()=>{
 const work=path.resolve('work');fs.mkdirSync(work,{recursive:true});
 const dir=fs.mkdtempSync(path.join(work,'smtp-test-'));
 try{
  fs.mkdirSync(path.join(dir,'scripts'));fs.mkdirSync(path.join(dir,'bin'));
  fs.copyFileSync('scripts/configure-smtp.mjs',path.join(dir,'scripts/configure-smtp.mjs'));
  const key='smtp-test-private-value-123456789';
  fs.writeFileSync(path.join(dir,'.env.smtp.local'),'TREINO_SMTP_USER=test@smtp-brevo.com\nTREINO_SMTP_FROM=test@example.com\nTREINO_SMTP_PASSWORD='+key+'\n');
  fs.writeFileSync(path.join(dir,'bin/supabase'),'#!/bin/sh\nprintf "%s" "$TREINO_SMTP_PASSWORD"\nprintf "%s" "$TREINO_SMTP_PASSWORD" >&2\nexit 1\n',{mode:0o700});
  const result=spawnSync(process.execPath,[path.join(dir,'scripts/configure-smtp.mjs')],{env:{...process.env,PATH:path.join(dir,'bin')+path.delimiter+process.env.PATH},encoding:'utf8'});
  assert.equal(result.status,1);assert.equal((result.stdout+result.stderr).includes(key),false);
  assert.match(result.stderr,/credenciais não foram mostradas/);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
