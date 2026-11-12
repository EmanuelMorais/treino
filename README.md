# Treino

Página de planos de treino, execução guiada e histórico de séries, cargas, repetições, passos e duração. HTML/CSS/JavaScript estáticos, alojados no GitHub Pages.

**Endereço:** https://emanuelmorais.github.io/treino/

## Novidades e plano

**Equilíbrio por grupo muscular:** cada semana do programa e cada proposta gerada mostram um gráfico de barras com as séries por grupo muscular, comparadas com um alvo que depende do objetivo. Um exercício conta uma série para o músculo principal e meia para os restantes; as sessões de mobilidade ficam de fora. Fichas anteriores ao catálogo são classificadas pelo nome e assinaladas como estimativa. Os peso-mortos romenos passam a ter os posteriores da coxa como músculo principal.

**Gerador v3 e novo ecrã de treino:** o questionário aceita 1–6 dias e até 90 minutos, com divisões comuns (corpo inteiro, tronco/pernas, push/pull/legs, um grupo por dia), ênfase por zona e o objetivo «Tonificar e estar em forma». Repetições, séries e descanso mudam com o objetivo principal; a mobilidade como prioridade gera sessões que começam por mobilidade. O ecrã inicial tem modelos que pré-preenchem o questionário. Cada exercício mostra «Como fazer» (posição, movimento, atenção) e uma ligação para exemplos em vídeo; o descanso começa sozinho ao marcar uma série. Novo ícone e favicon em `assets/`. Compilação 11 do cliente.

**Em preparação (PR desta entrega):** «Continuar» abre o próximo treino da sequência (uma sessão parcial conta), com «Próximo» depois de guardar; cronómetro da sessão que preenche a duração e avisa quando o núcleo acaba; programas de 4 sessões semanais (A–D); e associação do resumo do Apple Watch através de um Atalho do iPhone ([como configurar](docs/APPLE-WATCH-ATALHO.md)). Compilação 10 do cliente: documentos atualizados deixam de abrir em compilações anteriores.

**Publicado em 10 de novembro de 2026:** catálogo/editor, substituições, propostas personalizáveis e revisão de programas, ficha separada da sessão e questionário em quatro passos. Há 93 definições para edição; as regras automáticas selecionam um subconjunto por material e condições de execução. A [entrega e publicação](docs/ENTREGA-PUBLICACAO.md) reúne versão, verificações, limites e próximas prioridades. A migração de compatibilidade está aplicada; Pages publica apenas o artefacto aprovado pelos testes.

O [novo plano de experiência de treino](docs/PLANO-EXPERIENCIA-TREINO.md) define pesquisa de exercícios, filtros, edição e substituições em planos manuais/gerados, demonstrações e uma sessão com menos informação. Inclui referências oficiais a Hevy, Fitbod, Boostcamp e Strong. A implementação é faseada; consultar o estado da entrega acima.

A [avaliação da arquitetura](docs/ARQUITETURA.md) separa catálogo, prescrição, sessão e histórico antes de ampliar o editor. A [matriz de testes](docs/TESTES-FLUXOS.md) regista a verificação atual, lacunas reproduzidas e os percursos a validar. As regras específicas estão no skill `.agents/skills/treino-product-workflow/`, indicado em `AGENTS.md`.

O plano inclui ainda preparação complementar por modalidade e, posteriormente, módulos completos para provas/corrida/ciclismo, com calendário e fontes específicos. [Como funciona o gerador atual e quais são as fontes](docs/GERACAO-E-FONTES.md): regras locais, sem IA nem consulta automática de vídeos; a preparação desportiva especializada ainda não existe.

A [entrega de segurança e contexto desportivo](docs/ENTREGA-SEGURANCA-E-CALENDARIO.md) acrescenta análise automática de credenciais e modalidade/prova/calendário privado. Está em validação no PR #2; a geração desportiva especializada continua indisponível. [Política de credenciais e comandos](SECURITY.md).

## Estado

- Aplicação privada: sessão validada antes de abrir treinos, biblioteca e histórico. Contas novas começam sem planos.
- Questionário privado e gerador por regras, com proposta e ativação explícita de 4, 8 ou 12 semanas. Inclui o objetivo perder peso.
- O programa pessoal de 12 semanas permanece na conta do titular; não é incluído nos dados públicos nem distribuído a outras contas.
- Exemplos YouTube privados por zona muscular, material, variante e intervalo, associados a exercícios sem modificar os registos.
- Acompanhamento inicial de esforço, recuperação, peso opcional e caminhadas.
- Criação e edição de fichas próprias; importação e exportação JSON.
- Gravação local imediata de planos, rascunhos e sessões.
- Login com email e palavra-passe, registo com confirmação de email e recuperação de palavra-passe. Contas que usavam links podem definir uma palavra-passe sem mudar de conta nem perder registos; o link de acesso continua disponível como alternativa.
- Atualização automática entre dispositivos com a mesma conta: Realtime, recuperação ao regressar à página e verificação de revisão a cada 30 segundos enquanto a página está visível.
- **Base de dados Supabase ligada e migrações de produção aplicadas.** A migração de compatibilidade de protocolo 8 também foi aplicada, sem alterar planos ou registos. SMTP Brevo configurado para os emails de acesso, com limite de 30 envios por hora no Supabase. A entrega de email e o primeiro login por link já foram confirmados no projeto real.
- [Plano da segunda fase: personalização por questionário](docs/FASE-2.md).

## Usar e migrar registos

1. Na página antiga, usar **Exportar cópia**. Guardar esse JSON num local seguro.
2. No novo site, entrar com a conta pessoal quando o login estiver ativo.
3. Usar **Importar** e selecionar o JSON. A importação substitui os dados dessa conta; exportar antes os atuais.
4. Esperar pelo estado **Tudo guardado online** antes de trocar de dispositivo.
5. Noutra pessoa/dispositivo, entrar com o email correspondente. Os dados de contas diferentes são privados e separados.

A opção **Exportar só este plano**, em **Editar ficha → Notas, cópia e exportação**, exporta apenas essa ficha, sem histórico ou séries realizadas. Pode ser importada por outra pessoa sem substituir os seus registos.

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

Com a página já autenticada, perder a ligação mantém a sessão de treino em memória e permite voltar a sincronizar. Uma abertura nova valida o acesso no servidor antes de mostrar dados em cache, pelo que exige internet. Esta versão não inclui uma PWA offline. Sem sessão válida, a aplicação não mostra dados de treino.

## Personalização e dados privados

O botão **Preencher questionário** recolhe objetivos (incluindo **Perder peso**), experiência, tempo, local, material e condições relevantes. O rascunho só é guardado depois de autorizar a gravação privada. A proposta inclui orçamento de tempo e progressão por desempenho, sem cargas inventadas ou promessas de emagrecimento. Limitações/exclusões declaradas requerem revisão antes da geração. As regras gerais apoiam-se nas recomendações [ACSM 2026](https://acsm.org/resistance-training-guidelines-update-2026/) e [CDC](https://www.cdc.gov/healthy-weight-growth/physical-activity/).

Ativar adiciona fichas com IDs próprios e uma versão do programa; não remove planos nem sessões anteriores. Na biblioteca, os exemplos pessoais podem ser pesquisados por exercício/variante e filtrados por zona muscular e material. Associar um exemplo só altera a referência de demonstração.

O MVP guarda estes dados no documento privado da conta existente, com RLS, revisão e backups. Não usa IA nem envia respostas para outro fornecedor. A normalização das entidades, revisão avançada e preparação para distribuição alargada estão descritas em [FASE-2.md](docs/FASE-2.md).

## Desenvolvimento

Requer Node.js 20+ e Python 3 para o servidor de desenvolvimento.

```sh
npm ci
npm run build
npm test
npm run dev
```

Abrir `http://localhost:8775`. O bundle Supabase fica em `vendor/supabase.js`. O código em `auth-data.js`, `auth-ui.js` e `src/cloud-app.js` gera `cloud.js` no mesmo build, reunindo validação de sessão, formulários de conta e sincronização. O workflow compila, testa e empacota os assets públicos em `dist/`; Pages serve esse artefacto estático.

Os testes incluem isolamento entre duas contas, bloqueio a visitantes sem login, conflito de revisão e retenção das últimas 20 cópias, usando Postgres local em memória. A sincronização tem testes de atualização nos dois sentidos, perda de ligação, reconexão, formulários abertos, alterações durante pedidos e troca de conta. A entrega Realtime e o isolamento foram também verificados no Supabase real com contas temporárias; a interface foi verificada em duas sessões independentes, incluindo registo de séries e atualização do histórico sem recarregar. Estes testes não substituem a verificação de login/email.

## Publicação

Pages usa GitHub Actions. Cada integração em `main` (merge de um PR ou push) executa **Publish verified Treino** automaticamente; também pode ser executado à mão (`gh workflow run publish.yml --ref main`). O workflow repete os testes, exige `TREINO_SERVER_PROTOCOL=8` e publica só `dist/`; se os testes falharem ou o protocolo não corresponder, nada é publicado. Uma alteração que exija nova migração no Supabase deve ter a migração aplicada e a variável atualizada antes do merge. Não é necessário comprar um domínio.

Para verificar localmente o artefacto: `npm run build`, `npm test`, `npm run package:site`, `TREINO_SITE_ROOT=dist npm run test:browser`, `TREINO_SITE_ROOT=dist TREINO_TEST_BROWSER=webkit npm run test:browser` e `TREINO_SITE_ROOT=dist npm run test:sync-browser`. Os testes de browser requerem os browsers do Playwright CLI instalados.

Código e modelos são públicos. Dados preenchidos pelo utilizador não são enviados ao GitHub; ficam no navegador e, depois de configurado, no Supabase da conta autenticada. Não incluir segredos ou cópias pessoais neste repositório.
