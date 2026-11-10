# Quarta entrega — propostas editáveis e revisão de programas

Branch `codex/catalogo-editor-treino`, 10 de novembro de 2026. Implementado e verificado localmente; não integrado em `main`, não publicado e sem alterações ao Supabase real. Complementa a [integração do catálogo no gerador](ENTREGA-GERADOR-CATALOGO.md). Mantém a preparação de compatibilidade do servidor descrita na [segunda entrega](ENTREGA-SUBSTITUICOES.md).

## Proposta antes da ativação

Abrir uma proposta passa a mostrar o rascunho guardado, em vez de executar novamente o gerador. Cada sessão tem «Personalizar»: trocar/adicionar/retirar exercícios, reordenar por botões, editar séries, objetivo, descanso e ligação YouTube própria. O catálogo é o mesmo do editor, incluindo exercícios pessoais já existentes na biblioteca; não se alteram fichas ativas nesta fase.

As alterações aplicam-se ao mesmo dia da proposta em todas as semanas. A escolha de séries refere-se às semanas normais; as semanas leves ficam reduzidas a uma série. O tipo de medida pertence à variante escolhida. Trocar um exercício não transporta kg ou séries realizadas; o formulário apresenta uma dose editável para rever.

A estimativa e a cobertura são recalculadas. Material/espaço incompatíveis, lacunas e excesso de tempo produzem avisos que precisam de confirmação antes da ativação; objetivos em falta bloqueiam a ativação. Uma pesquisa YouTube permanece identificada como pesquisa, sem escolher automaticamente um vídeo ou iniciar áudio. Uma ligação inválida dá erro visível mesmo quando os campos opcionais estão recolhidos.

Corrigir respostas invalida a proposta antiga para ativação. Se estava personalizada, conserva uma cópia privada para comparar e recuperar os ajustes na proposta nova. A recuperação mantém as respostas novas e obriga a rever os avisos; não contorna a revisão de limitações. Se mudar o número de dias/semanas, a recuperação automática fica indisponível e a cópia continua no backup completo para adaptação manual. «Apagar respostas ativas» elimina também esta cópia da proposta; as cópias online anteriores seguem a retenção já documentada.

## Atualizar um programa existente

A proposta permite escolher entre ativar um **programa novo** ou **rever alterações ao programa atual**. A revisão mostra a semana inicial, as fichas a alterar, diferenças atual/proposta e os motivos para conservar outras fichas.

- «Manter as minhas personalizações» é a opção inicial. A base original permite detetar alterações de movimento, dose, ordem, notas e vídeo, incluindo escolhas feitas antes da ativação.
- «Substituir pela proposta revista» é explícito e mostra as fichas personalizadas nas diferenças. Não desbloqueia a alteração de fichas com registos ou valores em curso.
- Fichas anteriores à semana escolhida, com sessões guardadas ou com qualquer valor numa sessão em curso são preservadas. Inclui cópias temporárias de execução ligadas à ficha original e valores ainda não marcados como realizados.
- Programas antigos sem base original são tratados conservadoramente como personalizados. Não se presume que estão intactos nem se infere uma correspondência por nome.
- Alterar a quantidade de dias ou semanas exige criar outro programa. A revisão atual não apaga dias nem inventa correspondências entre estruturas diferentes.

A revisão mantém IDs das fichas e cria ocorrências próprias para as prescrições novas. Não reescreve snapshots do histórico nem copia cargas. Guarda versão/fontes/avisos, IDs afetados e referência ao questionário da revisão. Há limites explícitos de revisões/questionários; uma falha deixa o documento anterior intacto.

O âmbito de preservação é **a ficha inteira**: nesta entrega não se combinam automaticamente apenas alguns exercícios de uma ficha personalizada com o resto da proposta. A UI explica quais ficam mantidas. Também avisa quando fichas mantidas deixam de corresponder ao novo material/espaço.

## Estrutura e compatibilidade

- `src/domain/programme-proposal.js`: contratos, edição pura, base original, comparação, ativação, recuperação e revisão atómica.
- `src/ui/programme-proposal.js`: extração do preview de `profile-ui.js`, editor da proposta e diálogos de comparação/revisão.
- `src/domain/document-contract.js`: valida propostas atuais/anteriores, bases e revisões; envelopes antigos sem estes campos continuam aceites.
- `src/ui/exercise-picker.js`: reutilização do catálogo na proposta, sem exigir uma ficha ativa como destino.

Os dados continuam no documento privado da conta. A revisão não combina documentos concorrentes: se a conta/proposta/dados mudarem depois de abrir a comparação, o botão recusa aplicar uma decisão desatualizada e pede nova revisão. Uma falha de armazenamento conserva a proposta/estado anterior em memória. O callback antigo de ativação não consegue duplicar um programa após a primeira confirmação.

## Evidência reproduzível

```sh
npm test
npm run build
npm run test:browser
TREINO_TEST_BROWSER=webkit npm run test:browser
```

- **128 testes Node aprovados**: edição e identidade, unidades/doses, isolamento entre dias, semanas leves, bases originais, preservação de fichas personalizadas/legadas, sessões concluídas/em curso, revisões, recuperação após corrigir respostas, contrato/export completo, callbacks desatualizados, troca de conta e falha de armazenamento.
- Build, sintaxe e `git diff --check` aprovados.
- **Chrome e WebKit aprovados** no percurso local ampliado: questionário → editar proposta → trocar/reordenar/adicionar/retirar → dose/vídeo e erro visível → fechar/recarregar → corrigir respostas/comparar/recuperar → ativar → guardar sessão → gerar proposta revista → comparar políticas → aplicar → recarregar. Confirma preservação de escolhas e registos com fixtures sintéticas.
- Verificação de overflow do editor da proposta a 320 px, além das larguras 320/390/768/1440 do catálogo. Capturas em `output/playwright/`, ignorado pelo Git.

O bloqueio de cliques WebKit das entregas anteriores **não se reproduziu na execução atual**; não foi identificada uma causa nem feita uma correção específica do motor. A evidência atual substitui essa pendência para o percurso local executado.

Esta entrega cobre partes adicionais de F03/F04, F09/F10, F16, F19/F20, F23/F24 e F28. Não marca a matriz inteira como concluída: não testa login/SMTP nem sincronização Supabase real entre dispositivos, iPhone físico, leitor de ecrã ou usabilidade observada com pessoas.

## Pendências do plano

Separar melhor editor de plano e execução, simplificar mais o questionário, criar exercícios pessoais com metadados completos, completar revisão de conteúdo/fontes, testar os percursos online e configurar a publicação condicionada aos testes. A criação de exercícios pessoais novos continua no editor de fichas; a proposta reutiliza os já disponíveis. Os módulos desportivos permanecem planeados e indisponíveis para geração especializada. Ver [plano faseado](PLANO-EXPERIENCIA-TREINO.md) e [matriz de testes](TESTES-FLUXOS.md).
