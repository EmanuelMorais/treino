# Segunda entrega — substituições e sessões recuperáveis

Branch `codex/catalogo-editor-treino`, 10 de novembro de 2026. Implementação local; não integrada em `main`, não publicada e sem alterações ao Supabase real. Complementa a [primeira entrega](ENTREGA-CATALOGO-EDITOR.md); não conclui todas as etapas do [plano](PLANO-EXPERIENCIA-TREINO.md).

## Comportamento entregue

- «Trocar» abre alternativas por função, material, nível e espaço, com acesso ao catálogo completo. Escolher outro movimento exige rever a dose; as cargas começam vazias. Objetivos compatíveis podem manter os valores de cada ficha ou receber um novo objetivo explícito; percentagens/1RM não transitam.
- Âmbito «só nesta sessão», próximas sessões do mesmo dia ou de todo o programa, com lista de impacto antes de aplicar. Fichas já registadas e outros rascunhos preenchidos ficam excluídos. Fichas legadas sem identidade inequívoca não são ligadas por semelhança de nomes.
- A sessão ajustada é uma cópia temporária da prescrição. Séries preenchidas conservam o bloco original; apenas o restante recebe a nova variante. A dose da ficha original fica intacta numa troca só de hoje.
- Desfazer imediato conserva o estado anterior e recusa eliminar alterações posteriores. Uma cópia de sessão vazia pode ser descartada; se houver valores, é preciso guardar a sessão primeiro.
- Guardar mantém um snapshot da prescrição inteira, incluindo exercícios ainda não feitos. Valores preenchidos mas não marcados ficam separados das séries realizadas e regressam ao retomar. Corrigir/retomar mantém o ID do registo, sem duplicar sessões; cópias temporárias são removidas ao concluir.
- Validação do documento extraída para `src/domain/document-contract.js`; export/import em `src/data/backup-format.js`. O formato de plano `treino-plan-v2` exclui dados de execução e é deliberadamente recusado pelos leitores antigos; o novo leitor continua a aceitar planos v1.

## Compatibilidade antes de publicar

O documento continua a usar o envelope v1, enriquecido com `minClientBuild: 8`, identidades e snapshots. Um cliente antigo não pode regravar estes dados como se os compreendesse.

A migração **`20261110001347_require_compatible_training_client.sql` está apenas no repositório**, testada em PGlite isolado. Mantém a autorização por JWT, RLS, CAS/revisões e 20 cópias; exige versão de escritor compatível através de `x-client-info` e responde PT426 quando for necessário atualizar. O header é um controlo de compatibilidade, não uma credencial nem uma fronteira de autorização.

A nova aplicação confirma `client_protocol` numa leitura autenticada antes de desbloquear escrita. Se a migração faltar ou os dados exigirem uma versão mais recente, bloqueia a edição com mensagem recuperável e conserva o cache original. Não testar esta branch com dados reais antes da preparação do servidor.

Ordem de publicação a ensaiar num ambiente separado: aplicar migração → executar verificações de segurança/advisors e testar cliente antigo/novo, login e dados sintéticos → publicar assets compatíveis → teste curto sob `/treino/` e dois dispositivos. Uma reversão de frontend para um leitor antigo não é um rollback seguro depois de gravar o novo formato. Manter o controlo de compatibilidade e restaurar uma versão que compreenda os dados.

## Evidência desta revisão

- `npm test`: **103 testes aprovados**, incluindo substituições, retomada parcial, snapshots, export/import, transporte autenticado, acesso/cache incompatível e migração/RLS/CAS/cópias na base isolada.
- `npm run build` e `git diff --check`: aprovados.
- `npm run test:browser`: Chrome aprovado com fixture local sintética: catálogo, persistência/reload, vídeo pessoal e remoção do iframe, larguras 320/390/768/1440, substituição a meio, desfazer, futuro sem alterar hoje, correção/retomada do histórico e limpeza da sessão temporária.
- **WebKit bloqueado neste ambiente**: cliques são rejeitados com «html intercepts pointer events», também reproduzido num documento `about:blank` com um único botão, sem código da aplicação. O percurso ampliado não foi aprovado neste motor. A primeira entrega tinha passado num teste anterior; isso não valida estas alterações.

A evidência cobre partes de F05–F07, F10–F15, F17–F24 e F28, em níveis diferentes. Não marca esses percursos integrais como concluídos. Login e sincronização real entre dispositivos, Safari físico, leitor de ecrã, rede/áudio e usabilidade com pessoas continuam por verificar. Regeneração com diferenças/overrides, separação completa editor/sessão e modalidades desportivas permanecem planeadas.
