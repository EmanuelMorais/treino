# Estrutura do Treino: avaliação e decisões

Data: 9 de novembro de 2026. Estado: avaliação concluída; estrutura alvo parcialmente iniciada em `src/domain`, `src/data`, `src/ui` e `src/styles`, conforme a [primeira entrega na branch](ENTREGA-CATALOGO-EDITOR.md). A [quarta entrega](ENTREGA-PROPOSTAS-E-REVISAO.md) extrai também o domínio/UI da proposta e revisão de programas; a [quinta entrega](ENTREGA-SESSOES-E-QUALIDADE.md) separa as vistas e a criação de execuções, e extrai a navegação do questionário em `src/ui/profile-steps.js`; a extração integral continua planeada. Plano: [experiência de treino](PLANO-EXPERIENCIA-TREINO.md). Evidência: [testes e auditoria](TESTES-FLUXOS.md).

## Decisão

Manter GitHub Pages e Supabase. A aplicação estática é adequada a este produto; mudar já de framework, alojamento ou base de dados não resolve os problemas de edição. Antes de ampliar o editor, separar domínio, armazenamento e apresentação, com contratos versionados e migrações testadas. Fazer a separação por fluxo, mantendo a aplicação utilizável em cada passo.

## Situação atual

| Área | O que existe | Consequência |
| --- | --- | --- |
| Interface | `app.js` e `profile-ui.js` misturam HTML, eventos, estado e gravação; CSS concentrado em linhas muito longas | Alterações pequenas atravessam muitas responsabilidades e são difíceis de rever |
| Geração | `program-engine.js` já concentra regras testáveis | Boa base para extrair catálogo e políticas; evitar duplicar regras na UI |
| Identidade | ID da ocorrência, nome e unidade usados para procurar registos anteriores | Novas semanas e nomes diferentes podem perder a ligação ao histórico do mesmo movimento |
| Plano/sessão | Algumas ações no rascunho também alteram o plano | Adicionar séries e editar unidades podem ter efeitos fora do âmbito esperado |
| Vídeos | Catálogo de fontes e exemplos pessoais; parsers e caminhos de abertura separados | Cobertura incompleta e validação/fallback inconsistentes |
| Dados online | Um documento JSON privado por conta, revisão comparada na gravação, RLS e cópias | Adequado à escala atual; conflitos substituem o documento inteiro, sem combinação por entidade |
| Build | SDK e `cloud.js` gerados, restantes fontes publicadas na raiz | Fontes e artefactos misturados; tornar explícito o que se edita e o que se publica |
| Testes | 59 testes Node, VM/DOM simulado e PGlite | Cobrem regras importantes, mas faltam percursos reais do editor e navegador móvel |

## Fronteiras propostas

```text
src/
  domain/                 catálogo, identidades, unidades, prescrições e políticas
  application/            criar plano, adicionar/trocar exercício, iniciar/concluir sessão
  data/                   validação, migrações, adapters local/Supabase, export/import
  ui/
    features/             entrada, questionário, editor, seletor, sessão, histórico, vídeos
    components/           diálogo, pesquisa, campos e mensagens acessíveis
  styles/                 base, componentes e vistas
tests/
  unit/                   regras e contratos puros
  integration/            persistência, migrações, autorização, concorrência
  e2e/                    percursos reais com dados sintéticos
docs/                     decisões, plano e evidência
.agents/skills/           regras de trabalho específicas deste produto
```

Esta árvore é um destino, parcialmente iniciado na branch; não é ainda a estrutura integral da aplicação. Continuar a extração de módulos JavaScript com contratos JSDoc e validação em runtime; usar o esbuild já existente para produzir assets compatíveis com `/treino/`. Não introduzir React nem uma migração integral para TypeScript como pré-requisito. Reavaliar TypeScript quando os contratos estiverem estáveis e houver um benefício demonstrável. Não acumular um sistema antigo e outro novo sem prazo de remoção do adapter.

### Modelo lógico mínimo

| Objeto | Identidade e conteúdo | Regra |
| --- | --- | --- |
| `ExerciseDefinition` | `catalogId`, nomes/aliases PT/EN, variante, músculos, padrão/direção, material, execução, unidade, referência da carga, media | O catálogo descreve o movimento, sem dose pessoal nem histórico |
| `ExercisePrescription` | `prescriptionId`, `catalogId` ou definição pessoal, séries, intervalo, descanso, esforço e âmbito | Uma ocorrência num plano; não é a definição do exercício |
| `PlanVersion` | `planId`, versão, sessões/dias, origem, alterações pessoais e data de efeito | Alterar o futuro não reescreve versões concluídas |
| `WorkoutSession` | `sessionId`, versão de origem, início/data e ocorrências próprias | Começa como cópia da prescrição; edições só afetam esta sessão por defeito |
| `PerformedSet` | variante, valores e unidades explícitas, instante/ordem, snapshot de apresentação | Não reinterpretar uma série por mudança posterior do catálogo/plano |
| `ExerciseMedia` | ID, origem pública/pessoal, URL/ID validado, início/fim, estado de revisão | Exemplo pessoal privado pode sobrepor o exemplo do catálogo |
| `AthleteContext` / calendário | Modalidade principal/secundárias, objetivo/evento, linha de base, sessões externas, disponibilidade e origem | Extensão planeada: distinguir tempo de força e da modalidade, sem somar ou duplicar sessões em silêncio |
| `SportSessionPrescription` | Tipo de sessão, duração/distância/intensidade e unidades próprias, módulo e fase | Extensão planeada: corrida/bicicleta/jogo não são representados artificialmente como séries de musculação |
| Registo de evidência/regras | Fontes, âmbito/população, `ruleId`, versão, pressupostos e revisão | Separar demonstração, fundamentação da prescrição e referência de UX; ver [geração e fontes](GERACAO-E-FONTES.md) |

Definições pessoais têm IDs estáveis próprios; editar apenas o nome não cria um exercício novo. Mudar material, variante ou medida pode exigir outra identidade. Uma migração não deve juntar dois exercícios apenas por terem nomes parecidos. Quando não houver correspondência segura com o catálogo, manter uma definição legada privada e as suas unidades originais.

Histórico: procurar a variante e a referência de carga compatíveis; excluir a sessão atual pelo ID, não todas as sessões da mesma data. Conservar snapshots antigos. Não recalcular recordes de uma variante a partir das cargas de outra.

### Persistência e migração

1. Introduzir `schemaVersion` e contratos/DTOs explícitos no documento atual antes de alterar a estrutura gravada.
2. Criar migrações puras com fixtures de documentos antigos, incluindo planos manuais, gerados, variantes, rascunhos parciais e histórico editado. A leitura não pode destruir dados; validar antes de guardar.
3. Testar export completo e export só de plano. Este último inclui referências de demonstração portáveis, sem IDs privados pendentes, respostas pessoais ou séries realizadas.
4. Preservar RLS, revisão/CAS e backups. Uma falha de migração bloqueia a gravação desse documento e oferece recuperação/export; não substituir por uma conta vazia.
5. Só migrar a escrita depois de verificar ida e volta sem perda. Definir recuperação compatível: se uma versão antiga não entender o novo schema, impedir que grave, em vez de a servir como rollback cego.

Por agora, manter a política existente de adotar automaticamente a revisão mais recente do servidor, preservando antes uma cópia local de alterações pendentes. Explicar a recuperação discretamente. Combinar alterações concorrentes por entidade é uma decisão futura própria, com testes de conflito entre dispositivos; não alterar a política silenciosamente durante o editor. Normalizar tabelas quando houver necessidade de consultas, colaboração ou concorrência que justifique a migração, não apenas por organização de pastas.

### Build e publicação

Separar as fontes dos assets publicados e usar nomes com versão/hash para evitar JS/CSS incompatíveis em cache. Preservar `/treino/`, links diretos, recuperação de acesso e redirecionamentos. Ensaiar estas transições em preview antes de mudar o build de produção.

A publicação atual a partir do branch não fica protegida apenas por acrescentar um workflow de testes. A fase de qualidade deve configurar GitHub Pages via Actions e publicar o artefacto validado só depois das verificações obrigatórias; até lá, não afirmar que o CI bloqueia uma publicação com falhas.

## Skill específico: sim, um só

Criado em `.agents/skills/treino-product-workflow/`: regras de identidade, âmbito de edição, unidades, vídeo e seleção dos testes. Não criar skills separados para cada ecrã, para Supabase ou para ferramentas de navegador que já têm orientação própria. `AGENTS.md` indica fontes, comandos e documentos; o skill contém as invariantes específicas do produto.

O âmbito do skill é este repositório, versionado com o código. A localização `.agents/skills` é suportada para descoberta de skills locais pelo Codex. [Documentação oficial](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills).
