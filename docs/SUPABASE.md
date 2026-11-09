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

## Login por email

Em Authentication → URL Configuration:

- Site URL: `https://emanuelmorais.github.io/treino/`
- Redirect URL: `https://emanuelmorais.github.io/treino/`
- Desenvolvimento (opcional): `http://localhost:8775/`

Ativar o fornecedor Email. O cliente usa `signInWithOtp`, com criação de conta permitida e confirmação de posse do email. Depois de configurar SMTP próprio, o template de Magic Link pode usar `supabase/templates/access.html`, que inclui `{{ .Token }}` e o link de confirmação. O Supabase não permite alterar estes templates no Free enquanto se usa o serviço de email padrão; nesse caso, entrar pelo link recebido.

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
2. Abrir noutro dispositivo, entrar na mesma conta e confirmar as cargas e séries.
3. Entrar com a conta B e confirmar que não vê os dados de A.
4. Alterar offline; voltar a ligar e confirmar a gravação.
5. Editar a partir de dois dispositivos e confirmar que aparece o aviso de conflito, sem substituição automática.
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

Voltar a entrar na mesma conta retoma as alterações locais pendentes. Não apagar o armazenamento do navegador para resolver este aviso. Não conceder a `anon` acesso à função de gravação: as permissões continuam limitadas a contas autenticadas e as linhas continuam protegidas por RLS.
