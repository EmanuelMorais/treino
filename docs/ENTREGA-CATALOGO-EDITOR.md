# Primeira entrega — catálogo e proteção dos registos

Branch: `codex/catalogo-editor-treino`. Estado: implementado e verificado localmente; **não integrado em `main` nem publicado no site de produção**. Esta é uma entrega parcial do [plano faseado](PLANO-EXPERIENCIA-TREINO.md).

## Alterações

- Domínio de registos em `src/domain/workout-records.js`: identidade estável separada do ID da ocorrência, referência estruturada de carga, snapshots e procura de registos anteriores compatíveis, incluindo sessões do mesmo dia.
- Leitura de documentos v1 enriquecida com metadados, sem mudar nomes, unidades, doses ou valores realizados. Só se liga um registo antigo à definição quando a correspondência é conservadora; casos ambíguos ficam separados. Não se juntam exercícios apenas pelo nome.
- Séries extra ficam na sessão e deixam de modificar a dose do plano. A edição/remoção de um exercício com valores preenchidos bloqueia mudanças destrutivas e dá uma mensagem visível; vídeos/notas podem ser ajustados sem perder as séries extra.
- Editor extraído de `app.js` para `src/ui/exercise-editor.js`. Referência da carga explícita no formulário e na grelha de registo.
- Catálogo de edição em `src/data/exercise-catalog.js`: **93 exercícios/variantes**, incluindo as 25 entradas iniciais. Metadados editoriais próprios: aliases PT/EN, material concreto, músculos, padrão/direção, complexidade e uma instrução curta. Não foi feita revisão profissional independente das 93 entradas.
- Pesquisa/filtros em `src/domain/exercise-catalog.js` e seletor em `src/ui/exercise-picker.js`: seleção múltipla, favoritos/recentes, detalhes com regresso à pesquisa, procura por zona e contextos de equipamento. Quando existe um inventário do perfil que corresponde exatamente a um preset conhecido, esse filtro é pré-selecionado e pode ser alterado.
- Banco plano/inclinável, rack, ancoragem e máquinas específicas são requisitos distintos. Um exercício pessoal com material desconhecido não é classificado como «sem equipamento».
- Repetições acidentais são evitadas; duplicar intencionalmente exige ativar a opção em «Mais opções». As novas ocorrências mantêm IDs próprios.
- Todos os exercícios na ficha têm uma ação de demonstração: vídeo escolhido ou pesquisa YouTube identificada como pesquisa. Há opção para guardar um vídeo pessoal. Alterar vídeo/intervalo substitui a associação anterior sem eliminar o exemplo da biblioteca.
- O player não tem autoplay e é removido ao fechar/navegar. Os testes confirmam a remoção do iframe; áudio real e teclados móveis exigem equipamento físico.

## Catálogo de edição e gerador são diferentes

**O gerador automático mantém as 25 entradas e as regras anteriores.** As novas entradas são escolhas manuais do editor e não passam a recomendações automáticas só por estarem no catálogo. Adicionar no editor cria linhas de registo com objetivo em branco para ajustar; não transforma uma seleção livre num programa individual revisto.

`contentStatus: editorial` e `provenance: treino-catalogue-1` identificam o conteúdo da aplicação; não são um selo de validação científica. Não foram importadas imagens/animações ou uma base de dados de terceiros. [ACE](https://www.acefitness.org/resources/everyone/exercise-library/) e [NHS](https://www.nhs.uk/live-well/exercise/strength-exercises/) foram consultados como referências públicas de conteúdo e apresentação; não são apresentados como autores/revisores de todas as entradas. A rastreabilidade por regra e a revisão especializada continuam planeadas em [geração e fontes](GERACAO-E-FONTES.md).

## Verificação reproduzível

```sh
npm ci
npm test
npm run build
npm run catalog:coverage
npm run test:browser
TREINO_TEST_BROWSER=webkit npm run test:browser
```

O CLI Playwright está fixado nas dependências de desenvolvimento. Chrome tem de estar instalado; para preparar o segundo motor, usar `node_modules/.bin/playwright-cli install-browser webkit`. O teste abre e fecha apenas a sua própria sessão, arranca um servidor em `127.0.0.1` numa porta livre e serve uma fixture sintética isolada. Não usa credenciais Supabase nem altera contas reais. Capturas ficam em `output/playwright/`, ignorado pelo Git.

Evidência desta entrega:

- 80 testes Node: contratos, pesquisa/cobertura, handlers do editor e regressões anteriores de acesso, sincronização e base isolada.
- Compilação e verificação de sintaxe/diff.
- Percurso de navegador em Chrome e WebKit: seleção por nome/alias e material, favoritos/detalhes, sessão parcial, bloqueio de unidade/remoção, dose isolada, registo do mesmo dia, persistência/reload, vídeo pessoal, remoção do player, pesquisa vazia e máquina específica.
- Capturas/ausência de scroll horizontal em 320, 390, 768 e 1440 px. Não é verificação de Safari num iPhone real, leitor de ecrã ou sincronização online ponta a ponta.

O relatório de cobertura conta cinco funções gerais e expõe, por exemplo, a ausência de puxar com resistência no contexto sem equipamento. É diagnóstico do catálogo, não certificação de um programa completo nem da adequação clínica de uma variante.

## Próximas entregas

Continuam por fazer: separação completa entre editor de plano e execução, substituições livres com âmbito «só hoje/futuro» e preservação dos blocos já feitos, regras de geração sobre o catálogo ampliado, inventário detalhado no questionário, revisão do conteúdo/fontes, reformulação do questionário/execução, migração completa/recuperação, verificações de sincronização real e preparação desportiva.

A solução temporária para uma troca destrutiva com séries preenchidas é guardar primeiro a sessão. Não é ainda a experiência final de trocar a meio e conservar os dois blocos. A publicação condicionada aos testes, os restantes percursos da matriz e os testes com pessoas iniciantes/experientes também estão pendentes. Não marcar as etapas 0–2 nem F01–F43 como integralmente concluídas por causa desta entrega.
