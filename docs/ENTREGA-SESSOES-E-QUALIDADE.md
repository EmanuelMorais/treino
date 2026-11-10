# Quinta entrega — ficha, sessão e preparação da publicação

Branch `codex/catalogo-editor-treino`, 10 de novembro de 2026. Integrado em `main` pelo PR #1 e publicado; ver [evidência final e limites](ENTREGA-PUBLICACAO.md). A migração de compatibilidade foi aplicada ao projeto Treino; não foram alterados planos ou registos. Continua a [entrega de propostas e revisão](ENTREGA-PROPOSTAS-E-REVISAO.md).

## Ficha e execução separadas

Abrir uma ficha mostra exercícios/dose, aquecimento e «Começar sessão» ou «Retomar sessão». O editor tem nome, notas, pesquisa, exercícios, reordenação por botões, troca, dose, descanso, cópia e exportação. Não apresenta campos para valores realizados.

«Começar» cria uma cópia de execução ligada à ficha. As séries extra e os ajustes de hoje ficam nessa cópia. Editar a ficha enquanto existe uma sessão em curso altera apenas as próximas sessões; retomar recupera os exercícios e valores que já estavam em curso. Rascunhos antigos com valores são separados antes de permitir edição da ficha. Uma correção de histórico conserva o ID/snapshot do registo.

Na sessão, o exercício atual, valores, demonstração, troca, descanso e próximo passo ficam acessíveis. Dicas, notas, alterações menos frequentes, data/duração e lista completa ficam recolhidas. Os circuitos de referência conservam a ordem por voltas através do ID da ficha de origem. A semana da mobilidade reutilizável fica fixada no arranque da sessão, mesmo que se navegue para outra semana entretanto. Os campos numéricos móveis usam 16 px e os principais controlos da sessão têm altura mínima de 44 px. A cópia de execução é removida ao guardar; uma cópia vazia pode ser descartada. Não se descartam automaticamente valores preenchidos.

Novos módulos: `src/domain/workout-session.js` e `src/ui/workout-views.js`. O editor e a execução continuam a reutilizar as regras de registos, o catálogo e a política de substituições. Não há migração de framework nem duplicação da base de dados.

## Exercícios pessoais

O formulário permite indicar zona principal, material concreto e descanso. Distingue material desconhecido, ausência de equipamento e equipamento escolhido; só mostra a lista de equipamentos quando necessária. Vídeo/pesquisa continua disponível. Mudar material, medida ou referência da carga com valores preenchidos é bloqueado; numa ficha futura sem valores, essas mudanças criam identidade pessoal própria para não herdar cargas de outra variante.

Trocar um exercício no editor só é aplicado depois de guardar o formulário de revisão. Cancelar não substitui a ficha. A opção na sessão continua a permitir o âmbito só hoje/futuro com as proteções anteriores.

## Questionário por passos

O questionário passa a mostrar apenas uma das quatro secções: objetivos, tempo/local, material e preferências. A navegação permite recuar e rever diretamente uma secção; os campos mantêm-se no mesmo formulário e não perdem respostas. Enter avança o passo atual, sem saltar diretamente para uma proposta. Consentimento visível desde o início: sem autorização, as respostas ficam apenas no formulário aberto; com autorização e respostas parciais válidas, o rascunho mantém a gravação/sincronização existente.

Continuar valida a secção atual. Ao rever a proposta, um valor inválido numa secção oculta reabre essa secção e as medições opcionais, mostra uma mensagem e dá-lhe foco. Preferências de dias incompatíveis com a frequência também são indicadas. Limitações/exclusões declaradas continuam a exigir revisão; o novo percurso não altera as regras de prescrição.

O percurso real em Chrome/WebKit verifica primeira secção incompleta, minutos inválidos, Enter, recuar sem perder material/duração, medição inválida oculta, correção, proposta e revisão do programa. Inclui o layout do questionário a 320 px. Não substitui observação com utilizadores nem iPhone físico.

## Sincronização: evidência adicional

`scripts/test-sync-browser.cjs` abre dois processos independentes: Chrome desktop e WebKit a 390 px, com armazenamento separado. Usa o **SDK publicado, `cloud.js` e a UI normais**, sob `/treino/`, com pedidos HTTP para uma fixture em loopback e PGlite a aplicar as migrações/RLS/CAS reais.

O teste confirma PC → segundo dispositivo e regresso, incluindo uma sessão guardada e alterações a fichas. Não chama callbacks de sincronização, não carrega no botão e não recarrega para receber alterações: espera pela verificação periódica real da aplicação. Confirma também que sair remove dados privados do DOM, que outra conta começa vazia e que consultas/gravações em nome de outra conta são recusadas pela base.

**Limite:** Auth e o adapter HTTP são simulados; os browsers/SDK/SQL/RLS são reais. O socket Realtime é deliberadamente fechado para testar o fallback periódico. Isto não valida Supabase alojado, SMTP, subscrições Realtime reais, rede móvel, Safari/iPhone físico ou notificações em background. Não usa credenciais/contas reais nem altera LifeHub/Treino online.

## Testes e artefacto público

Comandos:

```sh
npm test
npm run build
npm run test:browser
TREINO_TEST_BROWSER=webkit npm run test:browser
npm run test:sync-browser
npm run package:site
```

- **136 testes Node aprovados**, incluindo isolamento ficha/sessão, rascunhos antigos, ordem, preservação de snapshots e empacotamento público.
- Build e `git diff --check` aprovados.
- Chrome e WebKit: percurso ampliado do editor/proposta/histórico, incluindo editar uma ficha sem alterar a execução preenchida e criar um exercício pessoal com zona/material/descanso.
- Integração HTTP com os dois browsers e SQL/RLS isolado: percurso descrito acima.
- `dist/` gerado com os 28 assets referidos pelo HTML. Não copia o repositório inteiro, testes, documentos, migrações ou `.env.smtp.local`. A configuração é reconstruída só com URL e chave pública/anon; chaves secretas/service role são rejeitadas. Um diretório `dist` alheio não é removido/reutilizado como artefacto. `dist/` fica ignorado no Git.

Fixtures e capturas são sintéticas. Resultados de CI remoto, quando executado, devem ser consultados no workflow do commit; testes locais não provam por si só a execução em Linux/GitHub.

## Workflows preparados

`.github/workflows/verify.yml` executa Node, build, verificação de artefactos gerados, Chrome, WebKit, integração de sincronização e empacotamento. No CI, os browsers recebem `TREINO_SITE_ROOT=dist` e exercitam os mesmos assets do artefacto, sob `/treino/`, com a configuração Auth substituída apenas pela fixture. As Actions estão fixadas por commit; Node 22 e dependências npm fixadas no lockfile. O runner usa uma imagem Playwright/Noble fixada por digest para fornecer bibliotecas do sistema; o CLI do lockfile instala os seus próprios browsers compatíveis.

O container de CI corre como root: apenas nesse job, a sandbox Chromium é desativada para os browsers que visitam fixtures sintéticas. Esta definição não altera a aplicação publicada nem os browsers dos utilizadores.

`.github/workflows/publish.yml` só permite execução manual em `main`, depende integralmente da verificação e publica o artefacto que passou os testes. Exige a variável de repositório `TREINO_SERVER_PROTOCOL=8`, já definida depois da verificação da migração no servidor. Não pede nem usa uma chave administrativa Supabase no CI.

**GitHub Pages usa `build_type: workflow`**, confirmado pela API. O frontend foi integrado e publicado pelo workflow manual, que repetiu os checks e publicou o artefacto aprovado. O [relatório de publicação](ENTREGA-PUBLICACAO.md) identifica revisão, execução e teste posterior no endereço público. Um push em `main` não ativa por si só uma publicação.

## Preparação do servidor Treino

Confirmado que a configuração pública da aplicação corresponde ao projeto Treino conectado. Aplicada a migração `20261110085319_require_compatible_training_client.sql` com o SQL previamente ensaiado em PGlite. O timestamp local foi alinhado com o registo retornado pelo servidor; o conteúdo da migração mantém-se.

Verificação remota sem consultar os documentos dos utilizadores: coluna de protocolo gerada presente, RLS ativo nas duas tabelas, função `security invoker`, execução permitida a `authenticated` e recusada a `anon`. Testes transacionais com identificadores fictícios, terminados por rollback, confirmaram rejeição de escritor incompatível (PT426), comparação de revisão (PT409) e rejeição de titular incorreto (42501). Não foram criados utilizadores nem guardados treinos de teste no projeto real.

Advisors de segurança antes/depois: sem novos avisos de tabelas/permissões; permanece o aviso preexistente de [proteção contra palavras-passe comprometidas desativada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Não foi alterada a política Auth nesta entrega. Esta verificação de esquema não substitui um teste alojado de login/Realtime com dois clientes.

## O que falta

- Verificar Auth, Realtime e dois clientes contra Supabase alojado num ambiente de teste separado; completar o teste autenticado sob `/treino/`. A publicação e o gate anónimo já foram verificados. A preparação do esquema do projeto Treino descrita acima está concluída.
- iPhone físico, acessibilidade completa e observação com pessoas iniciantes/experientes.
- Observação do questionário por passos e revisão de conteúdo/fontes/cobertura. As regras editoriais não passaram a revisão profissional por ter mais testes.
- Modalidades e provas continuam no plano, sem geração desportiva especializada ativa.

A matriz [F01–F43](TESTES-FLUXOS.md) mantém estes níveis e pendências; não considerar o conjunto integralmente concluído.
