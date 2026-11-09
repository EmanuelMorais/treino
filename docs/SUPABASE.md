# Configuração da gravação online

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

Ativar o fornecedor Email. O cliente usa `signInWithOtp`, com criação de conta permitida e confirmação de posse do email. Para disponibilizar entrada por código, o template de Magic Link deve incluir `{{ .Token }}`; pode manter também o link de confirmação.

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
