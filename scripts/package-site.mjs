/* Only browser assets enter the deployment artifact. Private/local files stay out. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function publicConfig(source){
 const read=name=>source.match(new RegExp('\\b'+name+'\\s*:\\s*([\'\"])([^\'\"]+)\\1'))?.[2];
 const supabaseUrl=read('supabaseUrl'),supabasePublishableKey=read('supabasePublishableKey');
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl||''))throw Error('Public Supabase URL missing or invalid');
 let safe=supabasePublishableKey?.startsWith('sb_publishable_');
 if(!safe&&/^[\w-]+\.[\w-]+\.[\w-]+$/.test(supabasePublishableKey||''))try{safe=JSON.parse(Buffer.from(supabasePublishableKey.split('.')[1],'base64url')).role==='anon';}catch{}
 if(!safe)throw Error('Only a publishable/anon key may enter the browser artifact');
 return {supabaseUrl,supabasePublishableKey};
}
export async function packageSite(root=project){
 const out=path.join(root,'dist'),marker=path.join(out,'.treino-public-build');
 let exists=false;try{await fs.access(out);exists=true;}catch(error){if(error.code!=='ENOENT')throw error;}
 if(exists){let owned=false;try{owned=await fs.readFile(marker,'utf8')==='treino-static-v1';}catch{}if(!owned)throw Error('Unmanaged dist directory');await fs.rm(out,{recursive:true});}
 await fs.mkdir(out,{recursive:true});await fs.writeFile(marker,'treino-static-v1');
 const index=await fs.readFile(path.join(root,'index.html'),'utf8');
 const assets=new Set(['index.html',...[...index.matchAll(/(?:src|href)="([^"?]+)(?:\?[^" ]*)?"/g)].map(match=>match[1]).filter(name=>!/^https?:|^data:|^#/.test(name))]);
 for(const asset of assets){
  if(!/\.(?:html|js|css|svg|png|jpe?g|webp|ico|woff2?)$/.test(asset)||asset.split('/').some(part=>part.startsWith('.'))||path.isAbsolute(asset))throw Error('Invalid public asset path: '+asset);
  const source=await fs.realpath(path.join(root,asset));if(!source.startsWith(await fs.realpath(root)+path.sep))throw Error('Asset escapes the project');
  await fs.mkdir(path.dirname(path.join(out,asset)),{recursive:true});
  if(asset==='config.js')await fs.writeFile(path.join(out,asset),'window.TREINO_CONFIG='+JSON.stringify(publicConfig(await fs.readFile(source,'utf8')))+';\n');
  else await fs.copyFile(source,path.join(out,asset));
 }
 return {out,assets:assets.size};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await packageSite()));
