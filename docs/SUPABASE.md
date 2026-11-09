# Configuração da gravação online

Estado: projeto Treino ligado; migração aplicada e RLS verificada. O primeiro login por link de email e a primeira gravação privada já foram confirmados. O SMTP Brevo está configurado; a entrega do email de teste foi confirmada no Brevo e pelo destinatário. O servidor de envio foi autorizado no Brevo, mantendo o bloqueio dos outros IPs.

## Projeto separado

Criar o projeto na organização/conta Supabase escolhida para este produto. Não reutilizar bases de dados de outras aplicações. Confirmar custos antes de criar recursos pagos.

Para a configuração assistida, ligar o plugin Supabase à conta que contém o projeto novo. Não enviar palavras-passe, access tokens ou chaves secretas no chat.

## Base de dados

Aplicar o SQL gerado em `supabase/migrations/20261109123953_training_sync.sql` no projeto vazio. A migração cria:

- `training_documents`: planos, rascunhos, histórico e revisão da conta.
- `training_backups`: últimas 20 versões confirmadas da conta.
- `save_training_document`: gravação com controlo de revisão e cópia automática.

Todas as tabelas têm RLS. O papel `anon` não tem acesso. As políticas e a função restringem os dados ao `auth.uid()` da sessão; a função usa `security invoker` e verifica explicitamente a conta pedida. Existem concessões explícitas ao papel `authenticated`, necessárias nos projetos Supabase atuais.

Executar os advisors de segurança do projeto e verificar os testes com duas contas antes de considerar a sincronização ativa.

### Atualizações automáticas

Aplicar também `supabase/migrations/20261109191626_training_realtime.sql` (já aplicada no projeto Treino). Adiciona apenas `training_documents` à publicação `supabase_realtime`, mantendo as políticas e permissões existentes. Os backups não são publicados.

O cliente subscreve as alterações dessa tabela com `user_id=eq.<conta>`. O filtro reduz tráfego; a autorização é feita pela política SELECT com `auth.uid()`. Ao sair ou mudar de conta, o canal anterior e os temporizadores são removidos. O SDK renova o token do Realtime juntamente com a sessão de autenticação.

Cada aviso provoca uma consulta autenticada da revisão. O documento completo só é lido quando necessário; revisões já confirmadas não voltam a renderizar o treino. A mesma verificação corre ao voltar à página, recuperar a internet e a cada 30 segundos enquanto a página está visível. Leituras atrasadas nunca substituem alterações locais pendentes, uma gravação em curso ou dados de outra conta.

## Login com email e palavra-passe

Em Authentication → URL Configuration:

- Site URL: `https://emanuelmorais.github.io/treino/`
- Redirect URL: `https://emanuelmorais.github.io/treino/`
- Desenvolvimento (opcional): `http://localhost:8775/`

Manter o fornecedor Email e a confirmação de email ativos. O cliente usa `signInWithPassword` para entrar, `signUp` para registar e `resetPasswordForEmail` para recuperar. O evento `PASSWORD_RECOVERY` abre o formulário que usa `updateUser({password})` na conta autenticada. Uma conta que usava apenas links pode definir a palavra-passe através do mesmo formulário em **A minha conta**, conservando o `user_id` e os dados existentes.

`signInWithOtp` permanece como alternativa para contas existentes (`shouldCreateUser:false`). O template de Magic Link pode usar `supabase/templates/access.html`, que inclui `{{ .Token }}` e o link de confirmação. Os templates de confirmação de conta e de recuperação devem manter os links de confirmação oficiais do Supabase. Nunca guardar palavras-passe em tabelas da aplicação ou passar chaves de administrador para o browser.

**Configurar SMTP de produção** antes de dar acesso a emails externos à equipa: o serviço de email padrão do Supabase tem restrições de destinatários e limites baixos. Não desligar a confirmação de email para contornar essas restrições. Não commitar credenciais SMTP.

## Frontend

Preencher `config.js` com:

```js
window.TREINO_CONFIG = {
  supabaseUrl: 'https://PROJECT_REF.supabase.co',
  supabasePublishableKey: 'sb_publishable_...'
};
```

URL e chave publicável são configuração pública, não credenciais de administrador. A proteção dos dados é assegurada pelo login e pelas políticas RLS.

## Verificação antes de usar

1. Entrar com a conta A, criar uma ficha e guardar uma sessão. Esperar por “Tudo guardado online”.
2. Manter a página aberta noutro dispositivo, na mesma conta. Editar cargas, séries e notas no primeiro e confirmar que aparecem no segundo sem recarregar nem usar Sincronizar; repetir no sentido inverso.
3. Entrar com a conta B e confirmar que não vê os dados de A.
4. Alterar offline; voltar a ligar e confirmar a gravação.
5. Entrar num dispositivo com uma cópia local desatualizada e confirmar que recebe a versão online mais recente, sem escolha manual. Se existiam alterações pendentes, confirmar que a cópia local anterior pode ser exportada em Cópias online nesse dispositivo.
6. Exportar uma cópia JSON, importar numa conta de teste e recuperar uma versão online.

## Limites

A exportação JSON é a cópia independente do fornecedor. As últimas 20 versões online são histórico de recuperação da aplicação, não um substituto de uma política de backup da base de dados. A disponibilidade e retenção do projeto dependem do plano Supabase escolhido.

## Aplicar o SMTP Brevo sem expor a chave

1. No Brevo → SMTP & API, criar uma chave SMTP específica para esta aplicação.
2. Criar `.env.smtp.local` na raiz (ignorado pelo Git), com `TREINO_SMTP_USER`, `TREINO_SMTP_FROM` e `TREINO_SMTP_PASSWORD`. O utilizador SMTP é o Login mostrado pelo Brevo, não necessariamente o email da conta.
3. Executar `node scripts/configure-smtp.mjs`. O script passa os valores à CLI pelo ambiente e não imprime o diff com a palavra-passe.
4. Confirmar a receção de um email de acesso e o registo de entrega no Brevo.

Não executar `supabase config push` com as credenciais no ambiente numa sessão que publique o seu output: o diff da CLI pode mostrar campos privados. Nunca colocar a chave SMTP em `config.js`, no chat, num commit ou num ficheiro de cópia de dados.

## Diagnosticar falhas de envio

- Erro SMTP `525 5.7.1 Unauthorized IP address`: verificar o IP bloqueado no Brevo e correlacionar com o teste realizado. Autorizar apenas o servidor reconhecido, com aprovação do titular; manter o bloqueio dos outros endereços.
- Erro `535`: verificar Login SMTP, chave SMTP (não chave API), validade e estado da chave.
- Não mostrar chaves, códigos ou links de autenticação em logs de diagnóstico.
- “Envio aceite” confirma a aceitação SMTP; confirmar a entrega nos Logs transacionais do Brevo sem abrir o corpo do email de acesso.

## Sessão expirada durante uma gravação

A interface pode ter uma conta em memória enquanto a sessão do SDK já não está disponível. Cada leitura e gravação de dados privados valida agora a sessão da conta e envia explicitamente o seu JWT. Um erro 401 permite uma única tentativa com token renovado; se não houver sessão válida, a sincronização pára e mostra “Renovar acesso”.

Voltar a entrar na mesma conta retoma automaticamente a sincronização. Se a revisão online já avançou, a versão confirmada no servidor prevalece e os dados locais pendentes são preservados numa cópia de recuperação exportável. Não apagar o armazenamento do navegador para resolver este aviso. Não conceder a `anon` acesso à função de gravação: as permissões continuam limitadas a contas autenticadas e as linhas continuam protegidas por RLS.
