# Treino

Página de planos de treino, execução guiada e histórico de séries, cargas, repetições, passos e duração. HTML/CSS/JavaScript estáticos, alojados no GitHub Pages.

**Endereço:** https://emanuelmorais.github.io/treino/

## Estado

- Página e modelo de 12 semanas com rotinas públicas do Bioforceman.
- Criação e edição de fichas próprias; importação e exportação JSON.
- Gravação local imediata de planos, rascunhos e sessões.
- Login com email e palavra-passe, registo com confirmação de email e recuperação de palavra-passe. Contas que usavam links podem definir uma palavra-passe sem mudar de conta nem perder registos; o link de acesso continua disponível como alternativa.
- Atualização automática entre dispositivos com a mesma conta: Realtime, recuperação ao regressar à página e verificação de revisão a cada 30 segundos enquanto a página está visível.
- **Base de dados Supabase ligada e migrações aplicadas.** SMTP Brevo configurado para os emails de acesso, com limite de 30 envios por hora no Supabase. A entrega de email e o primeiro login por link já foram confirmados no projeto real.
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

Os documentos são privados por `auth.uid()` e protegidos por RLS. A gravação compara a revisão conhecida com a revisão online, impedindo que um dispositivo desatualizado substitua uma versão online mais recente. Ao detetar revisões diferentes, a página carrega automaticamente a versão mais recente confirmada no servidor. Se havia alterações locais pendentes, preserva primeiro uma cópia local, exportável em **Cópias online** nesse dispositivo. Não tenta combinar duas versões do documento. A função de gravação cria também cópias das últimas 20 versões online.

As alterações são enviadas automaticamente cerca de 1,3 segundos depois da última edição e recebidas pelas outras páginas abertas na mesma conta. Uma atualização mantém a vista e o treino selecionado, a posição de leitura e o campo focado. Formulários abertos são preservados; as novidades são verificadas ao fechar o formulário. Quando a página fica em segundo plano (incluindo bloqueio do iPhone), a atualização é retomada ao regressar. Se a ligação Realtime falhar, é verificada apenas a revisão a cada 30 segundos, evitando descarregar os planos sem alterações.

**Sincronizar** continua disponível para tentar imediatamente; não é necessário escolher versões ao entrar ou voltar à página. **Cópias online** permite recuperar uma das últimas 20 versões e exportar a última cópia local preservada antes de uma substituição automática. As cópias locais não sincronizam entre dispositivos.

## Entrar com palavra-passe

- Conta existente: entrar pelo link de email, abrir **A minha conta → Definir / alterar palavra-passe** e escolher uma palavra-passe com pelo menos 8 caracteres. O email e os registos mantêm-se.
- Novos acessos: usar email e palavra-passe. A sessão é persistida e renovada pelo SDK; um acesso expirado ou revogado continua a exigir autenticação.
- Conta nova: **Entrar → Criar conta** e confirmar o email recebido.
- Recuperação: **Entrar → Esqueci-me da palavra-passe**. O link recebido abre o formulário de nova palavra-passe numa sessão autenticada.

Palavras-passe são processadas pelo Supabase Auth; não ficam nos documentos de treino, exports, código ou armazenamento local da aplicação. O navegador pode disponibilizar o seu próprio gestor de palavras-passe.

Sem internet, a cópia local continua disponível num navegador já usado. Para abrir a página de raiz é necessária ligação; esta versão não inclui uma PWA offline.

## Desenvolvimento

Requer Node.js 20+ e Python 3 para o servidor de desenvolvimento.

```sh
npm ci
npm run build
npm test
npm run dev
```

Abrir `http://localhost:8775`. O bundle Supabase fica em `vendor/supabase.js`. O código em `auth-data.js`, `auth-ui.js` e `src/cloud-app.js` gera `cloud.js` no mesmo build, reunindo validação de sessão, formulários de conta e sincronização. O Pages serve os ficheiros estáticos sem compilação remota.

Os testes incluem isolamento entre duas contas, bloqueio a visitantes sem login, conflito de revisão e retenção das últimas 20 cópias, usando Postgres local em memória. A sincronização tem testes de atualização nos dois sentidos, perda de ligação, reconexão, formulários abertos, alterações durante pedidos e troca de conta. A entrega Realtime e o isolamento foram também verificados no Supabase real com contas temporárias; a interface foi verificada em duas sessões independentes, incluindo registo de séries e atualização do histórico sem recarregar. Estes testes não substituem a verificação de login/email.

## Publicação

O GitHub Pages publica a raiz do ramo `main`. Alterações enviadas com `git push` atualizam o mesmo endereço. Não é necessário comprar um domínio.

Código e modelos são públicos. Dados preenchidos pelo utilizador não são enviados ao GitHub; ficam no navegador e, depois de configurado, no Supabase da conta autenticada. Não incluir segredos ou cópias pessoais neste repositório.
