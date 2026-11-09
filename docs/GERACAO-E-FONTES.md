# Como se geram os planos e de onde vêm as regras

Verificado nas fontes do repositório em 9 de novembro de 2026. Este documento descreve o gerador geral atual, não audita o conteúdo dos programas privados de cada conta. [Plano de evolução](PLANO-EXPERIENCIA-TREINO.md).

Na [primeira entrega da branch](ENTREGA-CATALOGO-EDITOR.md), o editor passa a ter 93 entradas para escolha manual. O gerador abaixo continua com as 25 entradas anteriores; os dois catálogos têm âmbitos distintos nesta fase.

## O que acontece hoje

O gerador está em `program-engine.js`, na função `generate`. É **um motor determinístico de regras escritas no código**, executado no navegador. Não chama um modelo de IA, não pesquisa na internet e não analisa automaticamente vídeos quando alguém responde ao questionário. O YouTube é uma origem de exemplos/referências, não o motor de prescrição.

1. Valida as respostas. Limitações declaradas ou texto em exercícios a evitar suspendem a geração e pedem revisão; não são interpretados por IA.
2. Seleciona de um catálogo interno de 25 exercícios, com nome, material, músculo, padrão e instrução curta. A ordem de preferência das variantes está fixa no código, filtrada pelo material disponível e por algumas condições, como espaço acima da cabeça e experiência inicial.
3. Usa modelos predefinidos: corpo inteiro para 1–3 dias ou divisão superior/inferior para 4 dias. Não cria exercícios novos nem inventa uma nova estratégia de treino para cada pessoa.
4. Atribui a dose por regras simples: em geral 8–12 repetições; 6–10 para prioridade de força com carga externa e experiência não inicial; doses próprias de mobilidade. Normalmente duas séries, três em certas sessões mais longas para pessoas não iniciantes. O descanso varia com essa decisão.
5. Estima o tempo com aquecimento, execução, descanso, transições e lados. Reduz séries se necessário para encaixar no limite, ou devolve um erro explícito quando não consegue.
6. Repete a estrutura pelas semanas, com volume reduzido em certas semanas. A progressão de carga é uma orientação escrita para a pessoa aplicar com base no desempenho/recuperação, não uma adaptação automática que analise os seus registos e prescreva novos kg.
7. Mostra uma proposta para confirmar. A ativação em `profile-ui.js` cria as fichas privadas e regista a versão das regras; não distribui o programa pessoal de outra conta.

Nem todos os campos mudam a escolha: observações livres são guardadas com um aviso de que não são interpretadas; cargas máximas produzem uma orientação para respeitar o material, sem cálculo automático de pesos iniciais. Vários objetivos partilham a mesma estrutura de base. Portanto, «personalizado» nesta versão significa uma adaptação limitada por regras, não uma avaliação individual completa nem preparação desportiva especializada.

O catálogo atual do gerador, com 25 entradas, limita a diversidade por equipamento. A [ampliação planeada](PLANO-EXPERIENCIA-TREINO.md#cobertura-do-catálogo-requisito-para-disponibilizar-o-gerador) exige cobertura por contexto, alternativas e relatório de lacunas. A branch introduz o relatório e o catálogo ampliado para o editor, sem os integrar ainda nas regras automáticas. A categoria genérica de máquinas do questionário/gerador precisa de maior detalhe; o filtro manual do editor já distingue máquinas concretas.

## Fontes que o código referencia

| Fonte | Papel real | Limite |
| --- | --- | --- |
| [ACSM, atualização de treino de resistência de 2026](https://acsm.org/resistance-training-guidelines-update-2026/) | Referência geral de treino de resistência para adultos saudáveis | Não é um programa pronto nem a origem literal de cada escolha, intervalo ou semana leve do código. A própria comunicação distingue a preparação específica de atletas |
| [CDC, atividade física, peso e saúde](https://www.cdc.gov/healthy-weight-growth/physical-activity/) | Contexto geral de atividade regular e controlo do peso | Não fornece as variantes, doses ou planos de desempenho de corrida, ciclismo ou padel |

As páginas foram confirmadas nesta data. São referências gerais declaradas pelo código. **As regras exatas são decisões da implementação**: hoje não há uma referência científica ligada a cada exercício, parâmetro ou decisão. O comentário do catálogo usa a palavra «Reviewed», mas isso não documenta, por si só, uma revisão independente por profissional.

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
