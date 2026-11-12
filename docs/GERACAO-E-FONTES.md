# Como se geram os planos e de onde vêm as regras

Verificado na branch `codex/catalogo-editor-treino` em 10 de novembro de 2026. Este documento descreve o gerador geral desta branch, não audita o conteúdo dos programas privados de cada conta. [Plano de evolução](PLANO-EXPERIENCIA-TREINO.md).

A [terceira entrega](ENTREGA-GERADOR-CATALOGO.md) liga o gerador e o editor às mesmas **93 definições**. As preferências automáticas usam um subconjunto apropriado aos modelos suportados; não prescrevem todas as entradas nem todos os contextos só por existirem no catálogo. Esta versão não está publicada: o gerador de produção continua na versão anterior até integração e preparação do servidor.

## O que acontece hoje

O gerador está em `program-engine.js`, na função `generate`. É **um motor determinístico de regras escritas no código**, executado no navegador. Não chama um modelo de IA, não pesquisa na internet e não analisa automaticamente vídeos quando alguém responde ao questionário. O YouTube é uma origem de exemplos/referências, não o motor de prescrição.

1. Valida as respostas. Limitações declaradas ou texto em exercícios a evitar suspendem a geração e pedem revisão; não são interpretados por IA.
2. Seleciona variantes do catálogo partilhado em `src/data/exercise-catalog.js`. As preferências por dia estão explícitas no código, filtradas por material/acessórios concretos, espaço e complexidade; as variantes de complexidade elevada não são escolhidas para iniciantes. Máquinas genéricas não desbloqueiam um ginásio inteiro. O inventário identifica as máquinas/polias; banco inclinável satisfaz também o requisito de banco plano, mas barra não implica rack e elástico não implica ancoragem. A altura distingue em pé, só sentado/ajoelhado depois de confirmação e sem altura confirmada.
3. Usa modelos predefinidos: corpo inteiro para 1–3 dias ou divisão superior/inferior para 4 dias. Não cria exercícios novos nem inventa uma nova estratégia de treino para cada pessoa.
4. Atribui a dose por regras simples: em geral 8–12 repetições; 6–10 para prioridade de força com carga externa e experiência não inicial; doses próprias de mobilidade e posições em segundos, sem converter as unidades em repetições. Normalmente duas séries, três em certas sessões mais longas para pessoas não iniciantes. O descanso varia com essa decisão.
5. Estima o tempo com aquecimento, execução, descanso, transições e lados. Reduz séries se necessário para encaixar no limite, ou devolve um erro explícito quando não consegue.
6. Repete a estrutura pelas semanas, com volume reduzido em certas semanas. A progressão de carga é uma orientação escrita para a pessoa aplicar com base no desempenho/recuperação, não uma adaptação automática que analise os seus registos e prescreva novos kg.
7. Mostra uma proposta guardada, personalizável antes de confirmar, conforme a [quarta entrega](ENTREGA-PROPOSTAS-E-REVISAO.md). A ativação em `profile-ui.js` cria as fichas privadas e regista a versão das regras; não distribui o programa pessoal de outra conta.

Nem todos os campos mudam a escolha: observações livres são guardadas com um aviso de que não são interpretadas; cargas máximas produzem uma orientação para respeitar o material, sem cálculo automático de pesos iniciais. Vários objetivos partilham a mesma estrutura de base. Portanto, «personalizado» nesta versão significa uma adaptação limitada por regras, não uma avaliação individual completa nem preparação desportiva especializada.

A proposta guarda cobertura das funções gerais e apresenta estado limitado se faltar puxar com resistência; uma elevação em W continua identificada como controlo escapular. O relatório do catálogo mede opções disponíveis, enquanto a cobertura do gerador mede as escolhidas. Nenhum dos dois certifica volume ótimo, equilíbrio individual ou adequação clínica. A [ampliação e revisão planeada](PLANO-EXPERIENCIA-TREINO.md#cobertura-do-catálogo-requisito-para-disponibilizar-o-gerador) continua a exigir melhor cobertura e revisão editorial/profissional.

## Fontes que o código referencia

| Fonte | Papel real | Limite |
| --- | --- | --- |
| [ACSM, atualização de treino de resistência de 2026](https://acsm.org/resistance-training-guidelines-update-2026/) | Referência geral de treino de resistência para adultos saudáveis | Não é um programa pronto nem a origem literal de cada escolha, intervalo ou semana leve do código. A própria comunicação distingue a preparação específica de atletas |
| [CDC, atividade física, peso e saúde](https://www.cdc.gov/healthy-weight-growth/physical-activity/) | Contexto geral de atividade regular e controlo do peso | Não fornece as variantes, doses ou planos de desempenho de corrida, ciclismo ou padel |

As páginas foram confirmadas em 10 de novembro de 2026. São referências gerais. **As regras exatas são decisões da implementação**. `src/data/program-rules.js` identifica seleção, dose, estimativa e progressão como heurísticas da aplicação, com referências gerais e limites; não apresenta todos os parâmetros como recomendações literais. A ativação conserva versão, IDs das regras, fontes, cobertura e avisos. O estado `editorial_not_independently_reviewed` não representa revisão profissional independente. Ainda falta rastreabilidade científica específica por variante/parâmetro e revisão qualificada.

O gerador geral não está ligado ao catálogo privado de um programa pago do Bioforceman, nem reproduz automaticamente os treinos desse canal. Planos pessoais importados/editados podem ter outras origens; não as deduzir do gerador. Hevy, Fitbod, Boostcamp e Strong são referências de interação no plano de UX, não fornecedores do conteúdo ou das regras atuais.

## Evolução: conteúdo e decisões rastreáveis

Separar três tipos de fonte:

- **Execução:** instruções e demonstração de uma variante, com origem e revisão. Um vídeo pessoal é uma escolha da pessoa, não uma validação técnica.
- **Prescrição:** regra que decide seleção, volume, intensidade, descanso, progressão, distribuição e substituição; indicar a população e o contexto a que se aplica.
- **Experiência de utilização:** referências de pesquisa, filtros e edição. Uma boa interface não valida a prescrição.

Introduzir um registo de evidência e revisão: `sourceId`, URL/DOI, título, entidade/autoria, data/versão, população/modalidade, conclusão aplicável, limitações e responsável/estado/data da revisão. Cada regra guarda `ruleId`, `ruleVersion`, referências e distinção entre recomendação documentada, aproximação da aplicação e preferência pessoal. Não apresentar uma ligação genérica como prova de todos os parâmetros.

Para cada programa gerado, preservar versão das regras/módulo, fontes aplicadas, pressupostos, avisos e alterações confirmadas pela pessoa. Disponibilizar um resumo simples em «Como foi criado este plano?», com detalhes só quando abertos. A ligação ao conteúdo deve permitir rever uma regra sem alterar silenciosamente prescrições já ativadas ou registos concluídos.

Para módulos desportivos, selecionar orientações de entidades competentes e literatura relevante para a modalidade, população e objetivo; documentar a transferência para as regras e obter revisão qualificada antes de disponibilizar geração especializada. Esta seleção/revisão **ainda não foi feita** para maratona, ciclismo ou padel. Não usar apenas as duas referências gerais existentes nem um vídeo isolado como base de um plano completo.

Uma eventual IA futura pode ajudar na explicação ou pesquisa de conteúdo, mas não é pré-requisito. Se for introduzida, deve ficar identificada, usar apenas conteúdo aprovado para prescrição, passar pelas mesmas validações de regras e não inventar citações, cargas ou equivalências.


## Regras v3 (novembro de 2026)

- **Divisão:** escolhida pela pessoa ou automática (corpo inteiro até 3 dias, tronco/pernas com 4, híbrido com 5, push/pull/legs com 6). Cada divisão só aceita as frequências que suporta; o bro split inclui um aviso sobre treinar cada grupo uma vez por semana.
- **Dose por objetivo:** força 4–6 ou 5–8 repetições nos compostos bilaterais com 150 s de descanso (nunca para principiantes); massa muscular 8–12 / 10–15; tonificar, condição física e perder peso 12–15 com 45 s; core 8–12; mobilidade 6–8 ou 20–30 s.
- **Ênfase:** a zona escolhida recebe mais uma série (não em principiantes) e a outra fica limitada a duas.
- **Tempo:** corta séries dos acessórios primeiro, depois retira os últimos acessórios; os exercícios são os mesmos em todas as semanas.
- Continuam a ser heurísticas da aplicação, sem IA e sem revisão independente. As descrições por padrão de movimento são texto editorial próprio; a ligação de vídeo é uma pesquisa no YouTube, não um vídeo revisto.

## Relatório de volume (novembro de 2026)

`src/domain/volume-report.js` conta séries efetivas por grupo muscular numa semana: 1 por série para o primeiro músculo do exercício e 0,5 para cada um dos restantes. Exclui mobilidade. A origem dos músculos é, por ordem: o próprio exercício, o catálogo (por `libraryId` ou `exerciseKey`) e, por último, uma classificação pelo nome — esta última é assinalada como estimativa e os exercícios são listados.

Os alvos por objetivo são heurísticas da aplicação, não uma prescrição: massa muscular 10–20 séries efetivas por semana nos grupos grandes, força e os restantes objetivos 6–14, mobilidade 4–12; grupos pequenos (bíceps, tríceps, gémeos, core, pescoço) usam faixas mais baixas. A referência de partida são as recomendações ACSM de 2026 (cerca de 10 séries por grupo e cada grupo pelo menos 2 vezes por semana).

O mesmo relatório calcula o volume **realizado** a partir do histórico (`performedVolume`), contando apenas as séries marcadas como feitas numa janela de datas. A ênfase escolhida passa os grupos da zona não enfatizada para uma faixa de manutenção (massa muscular 6–14 em vez de 10–20).
