import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
fs.writeFileSync(path.join(root,'cloud.js'),'/* Generated from auth-data.js and src/cloud-app.js. Run npm run build. */\n'+['auth-data.js','src/cloud-app.js'].map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n'));
