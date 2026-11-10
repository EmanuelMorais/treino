# Terceira entrega — gerador e catálogo partilhado

Branch `codex/catalogo-editor-treino`, 10 de novembro de 2026. Não integrada em `main` nem publicada. Mantém a migração de compatibilidade pendente descrita na [segunda entrega](ENTREGA-SUBSTITUICOES.md).

## Alterações

O editor e o gerador usam agora as mesmas **93 definições de exercícios/variantes**. `src/data/base-exercises.js` conserva as definições iniciais, sem depender do gerador; `src/data/exercise-catalog.js` acrescenta a taxonomia editorial. Isto remove a dependência circular antes de ligar os dois consumidores.

As regras v2 selecionam um subconjunto apropriado aos modelos gerais suportados, com preferências explícitas para A/B/C ou superior/inferior. Incluem variantes novas como afundo atrás com halteres, peso morto em apoio desencontrado, remada apoiada e pranchas em segundos. As variantes de cada dia mantêm-se entre semanas; semanas leves podem mudar a dose. Não há rotação aleatória nem promessa de usar os 93 exercícios em cada programa.

O questionário distingue rack, banco inclinável, ancoragem e máquinas/polias concretas. A categoria genérica «Máquinas» não disponibiliza todas as máquinas. Removê-la limpa as seleções dessa categoria; selecionar uma máquina identifica o grupo correspondente. Respostas antigas sem inventário continuam legíveis e recebem um aviso quando não permitem saber que máquinas existem.

A altura distingue em pé, só sentado/ajoelhado com altura confirmada e sem altura confirmada. No segundo caso, o programa pode incluir shoulder press sentado/ajoelhado; não infere que essas posições cabem apenas porque o teto é baixo. A antiga resposta `lowCeiling` continua a excluir os movimentos acima da cabeça.

A cobertura da proposta mede as funções escolhidas. Sem opção de puxar com resistência, a proposta fica **limitada** e explica a lacuna; uma elevação em W não é apresentada como equivalente a remada. O limite de tempo inclui ambos os lados e unidades em segundos. Se mesmo o mínimo não couber, a proposta devolve um erro que pede mais tempo, em vez de produzir uma ficha truncada sem explicação.

`src/data/program-rules.js` identifica fontes gerais, versão e heurísticas próprias. A ativação preserva versão do catálogo/regras, fontes, cobertura, avisos e estado editorial. Os detalhes de progressão e proveniência ficam recolhidos na proposta para reduzir a informação inicial. O seletor começa por filtrar o material e espaço do perfil, incluindo máquinas concretas; limpar filtros permite explorar deliberadamente o catálogo completo. Planos anteriores e histórico mantêm-se quando se ativa outro programa.

## Fontes e limites

[ACSM 2026](https://acsm.org/resistance-training-guidelines-update-2026/) é orientação geral para treino de resistência de adultos saudáveis; [CDC](https://www.cdc.gov/healthy-weight-growth/physical-activity/) contextualiza atividade e peso. **A seleção exata, faixas, descansos, estimativa e semanas leves são decisões da aplicação**, não uma reprodução literal dessas fontes. Não foi feita revisão profissional independente do catálogo/programas. Ver [geração e fontes](GERACAO-E-FONTES.md).

Continua a ser geração geral determinística, sem IA, pesquisa automática ou análise de vídeos. Não reproduz o programa pago do Bioforceman. Não gera preparação especializada para maratona/ciclismo/padel. Limitações/exclusões declaradas continuam a exigir revisão; texto livre não é convertido em diagnóstico nem ignorado para desbloquear a proposta.

## Verificação

- `npm test`: **111 testes aprovados**. Novas regressões verificam integração do catálogo, inventário de máquinas, apoios, altura, variantes estáveis, unidades, metadados e leitura de respostas antigas. Uma matriz sintética percorre os cinco objetivos, 1–4 dias, 20/30/45/60 minutos e seis inventários, incluindo respostas limitadas e impossibilidade de encaixar no tempo.
- `npm run build` e relatório `npm run catalog:coverage`: aprovados.
- Chrome: percurso ampliado com questionário real, objetivos músculo/perder peso, equipamento e inventário concreto, press sentado confirmado, proposta, proveniência, ativação única, recarregamento e preservação de planos/registos. Acresce ao percurso de editor/substituições da entrega anterior; fixture local sem Supabase.
- WebKit continua bloqueado pelo ambiente descrito na segunda entrega; não considerar o percurso novo aprovado nesse motor. Login/sincronização online, iPhone físico e observação de usabilidade continuam pendentes.

## Trabalho restante

Revisão de conteúdo e rastreabilidade específica, maior cobertura por contexto, personalização antes da ativação, regeneração com diferenças/overrides, separação mais clara entre editor e sessão, simplificação adicional do questionário, CI que condicione Pages e a matriz integral. Os módulos desportivos mantêm-se em fases posteriores. Esta entrega não conclui as etapas 2–7 do plano.
