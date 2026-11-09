import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const privateFile = path.join(root, '.env.smtp.local');
if (!fs.existsSync(privateFile)) {
  console.error('Falta o ficheiro privado .env.smtp.local. Consulta docs/SUPABASE.md.');
  process.exit(1);
}
const values = {};
for (const line of fs.readFileSync(privateFile, 'utf8').split(/\r?\n/)) {
  if (!line.trim() || line.trim().startsWith('#')) continue;
  const split = line.indexOf('=');
  if (split < 1) continue;
  let value = line.slice(split + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  values[line.slice(0, split).trim()] = value;
}
for (const key of ['TREINO_SMTP_USER', 'TREINO_SMTP_FROM', 'TREINO_SMTP_PASSWORD']) {
  if (!values[key] || /COLAR|PREENCHER/.test(values[key])) {
    console.error('Preenche ' + key + ' no ficheiro privado antes de continuar.');
    process.exit(1);
  }
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.TREINO_SMTP_FROM) || !/^[^\s@]+@smtp-brevo\.com$/.test(values.TREINO_SMTP_USER)) {
  console.error('Confirma o remetente e o utilizador SMTP do Brevo.');
  process.exit(1);
}
// Credentials go only to the child environment. Never print the CLI's configuration diff.
const result = spawnSync('supabase', ['config', 'push', '--project-ref', 'jvjqyvjzyhmteznnjqrq', '--yes'], {
  cwd: root,
  env: { ...process.env, ...values },
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  maxBuffer: 4 * 1024 * 1024,
});
if (result.status !== 0) {
  const output = String(result.stdout || '') + String(result.stderr || '');
  const status = output.match(/unexpected status (\d{3})/)?.[1];
  console.error('Não foi possível guardar o SMTP' + (status ? ' (HTTP ' + status + ')' : '') + '. As credenciais não foram mostradas.');
  if (/not logged in|access token|Unauthorized/i.test(output)) console.error('É necessário autenticar a CLI Supabase.');
  if (/failed to parse|unknown field|config.*invalid/i.test(output)) console.error('Revê a estrutura de supabase/config.toml.');
  process.exit(1);
}
console.log('Configuração SMTP guardada no projeto Treino. Falta confirmar a entrega de um email.');
