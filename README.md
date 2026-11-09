# Treino

Página de planos de treino, execução guiada e histórico de séries, cargas, repetições, passos e duração. HTML/CSS/JavaScript estáticos, alojados no GitHub Pages.

**Endereço:** https://emanuelmorais.github.io/treino/

## Estado

- Página e modelo de 12 semanas com rotinas públicas do Bioforceman.
- Criação e edição de fichas próprias; importação e exportação JSON.
- Gravação local imediata de planos, rascunhos e sessões.
- Integração de login Supabase e sincronização privada por conta implementada.
- **Base de dados Supabase ligada e migração aplicada.** SMTP Brevo configurado para os emails de acesso, com limite de 30 envios por hora no Supabase. O email de teste foi entregue pelo Brevo e a receção confirmada pelo destinatário. O primeiro login por link de email e a criação do documento privado da conta já foram confirmados no projeto real. A edição a partir de dois dispositivos deve ser verificada após importação dos registos.
- [Plano da segunda fase: personalização por questionário](docs/FASE-2.md).

## Usar e migrar registos

1. Na página antiga, usar **Exportar cópia**. Guardar esse JSON num local seguro.
2. No novo site, entrar com a conta pessoal quando o login estiver ativo.
3. Usar **Importar** e selecionar o JSON. A importação substitui os dados dessa conta; exportar antes os atuais.
4. Esperar pelo estado **Tudo guardado online** antes de trocar de dispositivo.
5. Noutra pessoa/dispositivo, entrar com o email correspondente. Os dados de contas diferentes são privados e separados.

A opção **Exportar só este plano**, em “Notas e ajustes pessoais” da ficha, exporta apenas essa ficha, sem histórico ou séries realizadas. Pode ser importada por outra pessoa sem substituir os seus registos.

A opção global **Exportar cópia** inclui fichas, rascunhos e histórico. Guardá-la fora do repositório; nunca fazer commit de dados pessoais.

## Configurar Supabase

Ver [instalação e verificação](docs/SUPABASE.md). O ficheiro `config.js` recebe apenas o URL e a chave **publicável** do novo projeto. Nunca colocar chaves `secret` ou `service_role` no frontend.

Os documentos são privados por `auth.uid()` e protegidos por RLS. A gravação compara a revisão conhecida com a revisão online, impedindo uma substituição silenciosa quando dois dispositivos alteram os dados. A função de gravação cria cópias das últimas 20 versões e permite recuperação pela interface.

Sem internet, a cópia local continua disponível num navegador já usado. Para abrir a página de raiz é necessária ligação; esta versão não inclui uma PWA offline.

## Desenvolvimento

Requer Node.js 20+ e Python 3 para o servidor de desenvolvimento.

```sh
npm ci
npm run build
npm test
npm run dev
```

Abrir `http://localhost:8775`. O bundle Supabase fica em `vendor/supabase.js`; o Pages serve os ficheiros estáticos sem compilação remota.

Os testes incluem isolamento entre duas contas, bloqueio a visitantes sem login, conflito de revisão e retenção das últimas 20 cópias, usando Postgres local em memória. Não substituem a verificação de login/email no projeto Supabase real.

## Publicação

O GitHub Pages publica a raiz do ramo `main`. Alterações enviadas com `git push` atualizam o mesmo endereço. Não é necessário comprar um domínio.

Código e modelos são públicos. Dados preenchidos pelo utilizador não são enviados ao GitHub; ficam no navegador e, depois de configurado, no Supabase da conta autenticada. Não incluir segredos ou cópias pessoais neste repositório.
