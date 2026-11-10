/* Release and checksums are pinned; no global installation or shell interpolation. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const version='8.30.1',platform=process.platform+'-'+process.arch;
const releases={
 'darwin-arm64':['darwin_arm64','b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5'],
 'linux-x64':['linux_x64','551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb']
};
if(!releases[platform])throw Error('Unsupported Gitleaks platform: '+platform);
const [suffix,checksum]=releases[platform],directory=await fs.mkdtemp(path.join(os.tmpdir(),'treino-scanner-'));
try{
 const response=await fetch(`https://github.com/gitleaks/gitleaks/releases/download/v${version}/gitleaks_${version}_${suffix}.tar.gz`,{signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw Error('Gitleaks download failed: HTTP '+response.status);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==checksum)throw Error('Gitleaks checksum mismatch');
 const archive=path.join(directory,'release.tar.gz');await fs.writeFile(archive,bytes);
 execFileSync('tar',['-xzf',archive,'-C',directory,'gitleaks']);
 const target=path.resolve('work/security-tools/gitleaks');await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(directory,'gitleaks'),target);await fs.chmod(target,0o700);
 console.log(`Installed Gitleaks ${version}; pinned SHA-256 verified.`);
}finally{await fs.rm(directory,{recursive:true,force:true});}
