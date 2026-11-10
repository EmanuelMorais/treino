# Verificação dos percursos de treino

Data: 9 de novembro de 2026. [Plano](PLANO-EXPERIENCIA-TREINO.md) · [Arquitetura](ARQUITETURA.md).

## Execução na branch

A [primeira entrega](ENTREGA-CATALOGO-EDITOR.md) acrescenta testes de contratos/catálogo/editor e um percurso real de browser com fixture local. Resultado: **80 testes Node, build, Chrome e WebKit**, com larguras de 320 a 1440 px. Não testa contas reais nem certifica Safari/iPhone físico. Esta evidência substitui apenas os pontos cobertos; a auditoria inicial abaixo fica como histórico.

Há cobertura parcial dos critérios F05–F11, F17–F20, F22, F28 e F39–F43. F42, em particular, tem apenas um relatório de lacunas do catálogo: o gerador ainda não consome o novo relatório. F24 tem contratos aditivos e fixtures sintéticas, não a migração integral planeada. Substituições com âmbito, fluxos desportivos, acesso/sincronização real no browser, acessibilidade completa e o resto da matriz continuam pendentes. Não marcar estes IDs como integralmente aprovados.

## Evidência desta entrega

| Verificação | Resultado | Alcance real |
| --- | --- | --- |
| `npm test` | **59/59 passaram** | Node, funções puras, UI simulada/VM, transporte/sync simulados, SDK com pedidos intercetados e base isolada PGlite |
| `npm run build` | **Passou** | SDK e `cloud.js` gerados sem alterar os artefactos versionados |
| Auditoria sintética adicional | **Quatro lacunas reproduzidas**, abaixo | Node/VM, sem ler ou escrever contas reais |
| Fluxos novos deste plano | **Ainda não implementados nem testados** | O desenho e a matriz não equivalem a uma implementação aprovada |
| Navegador real / iPhone físico | **Não executado nesta avaliação** | Os testes existentes não demonstram todos os percursos móveis |

O build e os 59 testes foram executados sobre a revisão `8c6416e`, antes das alterações de documentação/skill. Estas alterações não mudam a aplicação publicada.

A extensão de modalidades/fontes altera apenas documentação. Foram verificadas as ligações locais, a sequência F01–F38 e a contagem de 25 exercícios nas fontes; os novos percursos desportivos continuam por implementar/executar.

### Lacunas reproduzidas com dados fictícios

| ID | Montagem e observação | Regressão a acrescentar na correção |
| --- | --- | --- |
| A1 | Perfil sintético de força com halteres/banco: 192 ocorrências geradas, todas com `video` vazio. A UI atual só mostra exemplo quando existe `e.video` | Todo o exercício apresenta exemplo ou pesquisa; ocorrências repetidas não precisam de vídeos diferentes |
| A2 | `previousExercise` ignora uma sessão anterior na mesma data; mudar a data para o dia anterior recupera-a | Duas sessões no mesmo dia ligam a anterior e excluem apenas a atual |
| A3 | Alterar só o ID de ocorrência, mantendo `libraryId`, nome e unidade, perde a ligação ao registo do dia anterior | Semanas distintas da mesma variante usam histórico compatível; variantes diferentes não herdam cargas |
| A4 | Em `exerciseForm`, guardar a unidade `s` com uma série concluída fictícia de 10 kg × 8 repetições mantém os valores e o ID | Não reinterpretar a série realizada; preservar snapshot/bloco original e criar ocorrência adequada para a mudança |

A auditoria isolou as funções atuais por VM e comparou estados antes/depois. Reproduz decisões de código, não cliques num browser. Não foram adicionados testes que exigem manter estes erros; as correções devem criar regressões para o comportamento desejado.

Outras observações por leitura: adicionar uma série altera também `e.sets` do plano; retirar um exercício remove o seu rascunho depois da confirmação; o snapshot usa uma nota livre como `loadUnit`; o editor começa por um formulário sem pesquisa. Confirmar estes percursos no navegador ao iniciar a etapa 0.

## Matriz de aceitação e regressão

**Estado inicial de todos os IDs F: planeado.** Mesmo onde existe funcionalidade parcial, falta a verificação integral definida aqui. Ao executar, registar commit, ambiente, resultado e evidência por ID. Não marcar toda a matriz como aprovada porque `npm test` passou.

Camadas: **D** domínio, **I** integração/persistência, **N** navegador real, **M** verificação manual em equipamento físico.

| ID | Percurso e resultado verificável | Camadas |
| --- | --- | --- |
| F01 | Sem sessão, abrir links diretos de plano/biblioteca/proposta/histórico: só acesso/registo; DOM não revela dados em cache | I, N |
| F02 | Registar, confirmar email, entrar, recuperar/alterar palavra-passe e sair; erros visíveis e conta nova vazia | I, N |
| F03 | Questionário com força/músculo/mobilidade/perder peso: rever, voltar, corrigir e ativar uma vez, mesmo com duplo toque | D, I, N |
| F04 | Erros em campos fechados, limitações e rede: mensagem focada, respostas conservadas e proposta antiga invalidada | D, N |
| F05 | Criar treino vazio, pesquisar nome PT/EN, aliases e acentos; resultados previsíveis, teclado e foco funcionam | D, N |
| F06 | Procurar por músculo/material, combinar/limpar filtros; filtro do perfil visível; estado vazio permite recuperação | D, N |
| F07 | Selecionar vários, abrir detalhes e voltar, confirmar; ordem/seleção conservadas, sem duplicar por duplo clique | D, N |
| F08 | Criar exercício pessoal e editar nome/dose; identidade e histórico preservados; outra conta não o vê | D, I, N |
| F09 | Adicionar/reordenar/remover; alternativas acessíveis ao arrasto; cancelar/desfazer não apaga séries realizadas | D, N |
| F10 | Editar séries/reps/segundos/passos/descanso e valores inválidos; unidades e referência da carga explícitas | D, N |
| F11 | Alterar unidade/variante/material com rascunho parcial e histórico concluído; valores antigos nunca reinterpretados | D, I, N |
| F12 | Alternativas com material indisponível, teto baixo ou restrição: respeitam condições; sem equivalente explica o resultado | D, N |
| F13 | Trocar «só hoje»: muda a sessão, conserva o plano e recalcula estimativa; cancelar não altera nada | D, I, N |
| F14 | Trocar próximas sessões/dias: preview e datas certos; sessões concluídas e outros dias não mudam | D, I, N |
| F15 | Trocar a meio das séries: bloco feito conserva identidade/unidade/carga; novo bloco só contém trabalho restante | D, I, N |
| F16 | Editar plano gerado, regenerar e restaurar: mostrar diferenças, preservar overrides escolhidos e sessões antigas | D, I, N |
| F17 | Histórico após renomear, nova semana e duas sessões no mesmo dia: dados compatíveis aparecem; variantes não herdam recordes | D, I, N |
| F18 | Iniciar, registar, marcar/desmarcar, descansar, guardar parcial, terminar, retomar e editar registo explicitamente | D, I, N, M |
| F19 | Exemplo revisto, pessoal e ausência de vídeo: ação útil sempre; fallback abre pesquisa codificada correta | D, N |
| F20 | Links YouTube normais/curtos/shorts e início/fim: pré-visualizar e preferir exemplo; rejeitar host falso/intervalo inválido | D, N |
| F21 | Embed bloqueado, vídeo privado/removido ou sem rede: abrir/pesquisar acessível e registo não bloqueado | I, N, M |
| F22 | Abrir/fechar vídeo, mudar vista/exercício e sair: só um player, sem autoplay nem áudio residual | N, M |
| F23 | Export/import de plano e cópia completa: referências portáveis, sem mistura de contas nem perda de doses/unidades/histórico | D, I, N |
| F24 | Migrar fixtures antigas com variantes/rascunhos/gerados; recuperação após falha; versão antiga não grava schema incompatível | D, I |
| F25 | Dois contextos da mesma conta: editar no PC e receber no móvel, e inverso, sem botão; incluir reordenação/trocas/séries | I, N, M |
| F26 | Offline, retorno, token expirado, edições concorrentes e logout durante pedido: revisão/cópia corretas, sem fuga entre contas | I, N, M |
| F27 | Conta A/B tentam consultar/gravar documentos e exemplos alheios: servidor rejeita, independentemente da UI | I |
| F28 | Larguras 320/390/768/1440 px, zoom 200%, teclado e rotação: confirmação/campos visíveis, sem scroll horizontal | N, M |
| F29 | Teclado, leitor de ecrã, foco de diálogos/erros, nomes dos controlos, contraste e movimento reduzido | N, M |
| F30 | Artefacto sob `/treino/`: assets, login/reset, links diretos, cache antiga e atualização de versão; percurso curto após deploy | I, N |
| F31 | Escolher condição geral, complemento desportivo ou prova: só aparecem as perguntas relevantes; mudar de percurso conserva respostas e invalida proposta incompatível | D, N |
| F32 | Perfil de maratona com calendário de corrida externo: distingue complemento de força de plano completo, respeita disponibilidade e não duplica treinos | D, I, N |
| F33 | Ciclismo sem potência/FTP conhecido e com prova: não inventa watts/zonas; unidades, dias e duração coerentes com o módulo suportado | D, N |
| F34 | Padel com jogos/torneio e objetivos combinados: calendário considerado; recomendações só do módulo revisto, sem prometer substituir treino técnico | D, N |
| F35 | Prazo incompatível, dados insuficientes, várias modalidades ou modalidade não suportada: saída explícita, sem gerar plano genérico rotulado como especializado | D, N |
| F36 | Alterar calendário, feedback ou evento depois de ativar: diferenças e âmbito visíveis, overrides respeitados e histórico intacto | D, I, N |
| F37 | Programa expõe versão/fontes/pressupostos corretos; regra sem revisão não é publicada como validada; vídeo pessoal não recebe selo científico | D, I, N |
| F38 | Migração de conta antiga sem dados desportivos, export/import e dois dispositivos: continua no percurso geral e não recebe modalidades/planos por defeito | D, I, N |
| F39 | Relatório de catálogo cruza material, padrão/direção, nível e condições; identifica lacunas/alternativas, aliases não contam como exercícios adicionais | D, I |
| F40 | Perfis sem material, só halteres sem banco, barra sem rack e elásticos sem ancoragem: seleção e pesquisa não assumem apoios/acessórios ausentes | D, N |
| F41 | Ginásio com apenas algumas máquinas identificadas: não sugere as outras; adicionar/remover uma máquina recalcula compatibilidade sem alterar histórico | D, I, N |
| F42 | Falta conteúdo para uma função obrigatória: resultado limitado ou módulo indisponível com explicação; não apresenta falsa equivalência nem proposta completa por omissão | D, N |
| F43 | Lote de catálogo revisto: identidades/aliases consistentes, unidades/requisitos/instruções/fontes presentes e ação de demonstração útil; imports e exercícios pessoais continuam compatíveis | D, I, N |

## Como testar

1. **Domínio:** invariantes com perfis sintéticos variados, não snapshots que copiem a implementação. Combinar material, dias, minutos e objetivos, incluindo perder peso; incompatibilidades produzem resultados explícitos.
2. **Integração:** adapters, migrações, RLS, revisão, cópias e recuperação numa base isolada. Fixtures nunca são exports de utilizadores reais.
3. **Navegador:** percursos visíveis em Chromium e WebKit, com gravação/recarregamento e seletores acessíveis. Uma fixture autenticada serve o editor, mas não substitui testar login real.
4. **Sincronização:** contextos com armazenamento separado, primeiro da mesma conta e depois de contas diferentes. Verificar conteúdo/revisão, não apenas «Tudo guardado online».
5. **Equipamento:** Safari num iPhone real para teclado, áudio, background/retorno e rede. WebKit com viewport móvel não certifica estes comportamentos físicos.
6. **Usabilidade:** observar uma pessoa iniciante a criar/seguir uma sessão e uma experiente a adaptar um programa, sem explicar os controlos. Registar pedidos de ajuda, erros e perda de contexto; medir a linha de base antes de fixar metas de tempo.

Provocar também gravação recusada, resposta lenta/fora de ordem, pesquisa vazia, vídeo indisponível, schema inválido e perda de ligação. Cada caso precisa de saída clara e conservação do trabalho possível. Usar contas/email de teste controlados, sem envios repetidos nem credenciais em traces/artefactos.

## Condição de publicação

- Cada entrega passa as regressões e os casos novos relevantes; não adiar o teste do percurso alterado para o fim.
- Histórico, privacidade, migração e séries preenchidas são critérios bloqueantes nas alterações que os afetem.
- Antes de entregar o conjunto, executar F01–F30, registar exceções por ambiente e decidir explicitamente quais impedem publicar.
- Para as extensões desportivas e de proveniência, executar também F31–F38 antes de as entregar. Continuam planeados e não foram executados nesta atualização de documentação.
- A ampliação do catálogo/editor exige F39–F43 antes de concluir a etapa 2. Foram acrescentados ao plano; ainda não foram executados. A sequência planeada passa a F01–F43.
- Guardar resultados/versionamento e evidência sem dados pessoais. Não prometer ausência total de erros.
- Configurar Pages por workflow dependente dos checks; um workflow paralelo à publicação por branch não impede publicar com falhas.
- Repetir um percurso curto no artefacto publicado. Nesta entrega, os novos fluxos e a matriz permanecem por implementar/executar.

## Atualização de implementação — 10 de novembro de 2026

A [segunda entrega](ENTREGA-SUBSTITUICOES.md) regista 103 testes Node e o percurso ampliado em Chrome. WebKit está bloqueado por uma falha de interação reproduzida também sem a aplicação; não considerar o novo percurso aprovado neste motor. A matriz acima continua a definir a aceitação integral, incluindo sincronização real, equipamento físico e usabilidade, ainda pendentes.

A [terceira entrega](ENTREGA-GERADOR-CATALOGO.md) eleva a suite a 111 testes e acrescenta geração sobre o catálogo partilhado e o percurso real de questionário/proposta/ativação em Chrome. Inclui partes de F03/F04 e F39–F43, sem substituir os critérios integrais, revisão de conteúdo, outros motores ou dispositivos reais.

A [quarta entrega](ENTREGA-PROPOSTAS-E-REVISAO.md) regista 128 testes Node e o percurso ampliado em Chrome **e WebKit**, incluindo edição persistente da proposta, recuperação após corrigir respostas e revisão de programas. O bloqueio WebKit anterior não se reproduziu nesta execução. Continuam pendentes sincronização real, dispositivos físicos, acessibilidade completa, usabilidade observada e os restantes critérios da matriz.

A [quinta entrega](ENTREGA-SESSOES-E-QUALIDADE.md) acrescenta isolamento de execução/edição, metadados pessoais, questionário por passos, 136 testes Node e integração de dois browsers com HTTP/SDK/SQL/RLS isolados, incluindo propagação sem botão ou reload e separação de contas. Auth/HTTP são fixtures: não equiparar a sincronização Supabase alojada nem a um iPhone físico. A migração de compatibilidade foi aplicada ao Treino sem alterar documentos e Pages foi configurado para Actions. O CI Linux aprovou o artefacto anterior ao questionário por passos em Chrome/WebKit e na integração de dois browsers; a execução do commit exato fica no PR. A publicação do frontend e os restantes percursos continuam pendentes.
