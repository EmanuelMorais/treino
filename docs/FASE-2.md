# Fase 2 — programas personalizados por questionário

## Objetivo

Permitir que qualquer pessoa crie uma conta, preencha um questionário e receba um programa de treino adequado à sua experiência, objetivos, tempo disponível, material e limitações declaradas. A pessoa pode seguir o programa, registar a execução e rever o plano com base no progresso.

## Estado da implementação — 9 de novembro de 2026

Entregue a primeira versão funcional das etapas 2.1–2.3, com acompanhamento inicial da 2.4:

- Acesso à aplicação só depois de validar a sessão no servidor. Sem login, só há entrada, registo e recuperação; treinos, biblioteca e histórico não são apresentados.
- Contas novas começam vazias. O programa pessoal de 12 semanas não é um modelo comum nem é incluído no ficheiro público de dados. As fichas existentes do titular mantêm-se na conta privada.
- Questionário privado, rascunho com autorização de gravação e versões das respostas ao ativar programas.
- Objetivos explícitos: **perder peso**, ganhar força, ganhar massa muscular, melhorar mobilidade e condição física. Podem combinar-se, com uma prioridade.
- Gerador determinístico com material declarado, experiência, dias, duração, espaço acima da cabeça e limite de tempo estimado. Propostas de 4, 8 ou 12 semanas, sempre revistas e ativadas pela pessoa.
- Exemplos YouTube privados: zona principal e secundárias, material, notas de variante, início/fim; pesquisa, filtros, edição e associação a exercícios, sem mudar doses ou histórico.
- Registos de evolução e revisão inicial por esforço/recuperação, sem aumentos automáticos de carga ou diagnóstico a partir das notas.

O MVP usa o documento privado já protegido por RLS e pelo controlo de revisão. A normalização em várias entidades, o acompanhamento avançado, o papel de treinador por convite, os procedimentos completos de privacidade/eliminação e a IA opcional continuam planeados. Não há envio de respostas a um fornecedor de IA.

## Acesso e propriedade dos planos

O login é obrigatório em todas as áreas funcionais. Uma cópia em cache não basta para abrir uma conta numa página nova: é validada uma leitura autenticada no servidor. Terminar sessão remove os dados da vista e limpa o estado ativo; as cópias privadas no navegador continuam disponíveis apenas quando a conta volta a entrar.

Não criar planos a partir de conteúdo pessoal no carregamento, no login, numa conta nova ou numa atualização de versão. Importar uma ficha de outra pessoa é uma ação explícita. O código público contém apenas o catálogo de referências e as regras gerais; os exercícios e doses do programa pessoal ficam no documento do titular.

## Fluxo proposto

1. Criar conta e confirmar email; aceitar os termos e a informação de privacidade.
2. Responder ao questionário, com gravação de rascunho e explicação do motivo de cada dado relevante.
3. Rever as respostas e corrigir incompatibilidades.
4. Receber um resumo da proposta: dias, duração, material, exercícios, progressão e adaptações.
5. Confirmar o programa antes de o ativar. Um plano novo nunca elimina o histórico anterior.
6. Executar sessões, registar séries e dar feedback breve sobre esforço, tempo e tolerância.
7. Fazer revisão periódica. A proposta de alterações apresenta o motivo e preserva as versões anteriores.

## Questionário

| Área | Dados a recolher | Uso no programa |
| --- | --- | --- |
| Perfil | Nome de apresentação, idade ou faixa etária; altura e peso opcionais quando relevantes | Apresentação, contexto e acompanhamento; recolher apenas o necessário |
| Objetivos | Prioridade entre **perder peso**, força, massa muscular, mobilidade e condição física; objetivos secundários | Escolha de volume, exercícios, atividade complementar e métricas |
| Experiência | Tempo de prática, regularidade, movimentos conhecidos, cargas/repetições atuais e nível de esforço | Ponto de partida e complexidade dos movimentos |
| Disponibilidade | Dias por semana, dias preferidos, minutos por sessão, horário e duração do ciclo | Calendário e orçamento de tempo |
| Local | Casa, ginásio, exterior ou combinação; espaço para caminhar e treinar | Compatibilidade dos movimentos |
| Material | Halteres e carga por haltere, discos totais, barra, banco e inclinação, suportes, elásticos, máquinas, barra de elevações e outros | Variantes executáveis e progressão realista |
| Tolerância e limitações | Movimentos que incomodam, restrições indicadas por profissional, limitações de amplitude e exercícios a evitar; resposta opcional e privada | Ajustes de variante, dose e necessidade de revisão humana |
| Preferências | Exercícios preferidos/evitados, formato guiado, alternativas e mobilidade nos intervalos | Adesão e escolha entre opções equivalentes |
| Recuperação | Sono, atividade diária, tempo sentado, outros desportos e esforço percebido | Dose inicial e ajustes conservadores |

Distinguir sempre kg por haltere, kg totais da barra, peso corporal, segundos e passos. Não inferir diagnósticos a partir das respostas nem exigir medições de gordura corporal.

Para perder peso, combinar uma proposta de força com sugestões de atividade regular e acompanhamento opcional da tendência do peso e minutos de caminhada. Não prometer perda de gordura abdominal localizada, prescrever défices calóricos automaticamente ou tratar o peso como a única medida de progresso. Peso e altura são opcionais e não condicionam a geração.

Na primeira versão, nome, confirmação de maioridade, objetivos, experiência, disponibilidade, material e condições de espaço são estruturados. Observações livres não são interpretadas por IA. Limitações atuais ou exercícios a evitar suspendem a geração para permitir revisão; a pessoa pode guardar o perfil e usar uma ficha própria/importada. Sono, atividade diária e revisão assistida mais detalhada ficam para a expansão do questionário.

## Biblioteca de vídeos de exercícios do YouTube

Adicionar uma forma de guardar vídeos do YouTube como exemplos de execução e associá-los às zonas musculares que trabalham.

### Adicionar e classificar um exemplo

- Colar o link do YouTube e indicar o exercício demonstrado, com um título e notas opcionais.
- Escolher uma zona principal e, quando fizer sentido, zonas secundárias: peito, ombros, bíceps, tríceps, costas, abdominais/core, glúteos, quadríceps, posteriores da coxa e gémeos. Um exemplo pode ter várias etiquetas.
- Indicar opcionalmente o minuto/segundo de início e fim do exemplo. Um vídeo com vários exercícios pode originar vários exemplos, cada um com o seu intervalo e classificação.
- Associar material e variante relevantes, como halteres, barra, elástico, sentado, em pé ou ajoelhado, aproveitando os dados da biblioteca de exercícios.
- Pré-visualizar o vídeo no ponto escolhido antes de guardar; permitir corrigir a classificação mais tarde.

### Consultar e usar nos planos

- Pesquisar por exercício e filtrar por zona muscular, material e variante, por exemplo “ombros + halteres + sentado”.
- Associar um ou vários exemplos a um exercício do plano e escolher qual é a demonstração principal.
- Abrir a demonstração diretamente na ficha e no momento relevante do vídeo, mantendo o progresso da sessão.
- Distinguir o exemplo técnico da dose prescrita no plano: adicionar um vídeo não altera automaticamente séries, repetições, cargas ou progressão.
- Manter a classificação editável; não atribuir zonas musculares apenas a partir do título do vídeo sem revisão.
- Guardar os exemplos pessoais na conta de quem os adicionou. A publicação numa biblioteca comum será uma ação explícita e sujeita a revisão.

Guardar os links e os intervalos de referência. Prever um aviso e uma alternativa quando um vídeo deixar de estar disponível.

## Motor de personalização

Começar com regras verificáveis e uma biblioteca de exercícios revista. Usar IA, se for adicionada, para apoiar a proposta e a explicação, com validação antes de mostrar o resultado.

Cada exercício precisa de: identificação estável, padrão de movimento, material, dificuldade, execução, variantes, faixas de dose, unidades, descansos, tempo estimado, fonte e condições para revisão. Não depender apenas de nomes ou de uma lista produzida livremente pelo modelo.

A proposta deve cumprir:

- Material e cargas compatíveis com o que a pessoa declarou.
- Tempo estimado que inclui aquecimento, descansos, trocas de material e ambos os lados dos movimentos unilaterais.
- Distribuição coerente de movimentos, recuperação entre sessões e volume compatível com a experiência.
- Progressão por desempenho e tolerância, com critérios claros para manter, aumentar ou reduzir a dose.
- Alternativas identificadas, sem substituir silenciosamente o exercício original.
- Sem promessas de resultados garantidos, perda de gordura localizada ou tratamento de lesões.
- Revisão humana quando as respostas não permitem construir uma proposta adequada com segurança. Um aviso isolado não substitui esse encaminhamento.

## Dados e arquitetura

O MVP separa logicamente `profile`, `questionnaireVersions`, `proposal`, `programVersions`, `plans`, `history`, `exerciseExamples` e `checkIns` dentro do documento privado da conta. Os exemplos têm IDs estáveis e os exercícios mantêm `exampleIds` e `primaryExample`. Questionários não são enviados a outras contas; gerar ou ativar não substitui o histórico.

As respostas ativas podem ser limpas pela interface. As versões anteriores podem permanecer nas últimas 20 cópias de segurança até estas rodarem; esta retenção é explicada na confirmação. Exportar inclui os dados da própria conta. A eliminação completa de conta e o prazo formal de retenção precisam de uma entrega própria.

Evoluir posteriormente para entidades próprias:

- `profiles` e `questionnaire_versions`: respostas e consentimentos versionados, com data.
- `exercise_library`: conteúdo revisto e compatibilidades.
- `exercise_videos` e `exercise_video_links`: referências YouTube, zonas musculares, intervalos de demonstração, titular e associação aos exercícios; permitir vários exemplos por exercício e vários excertos por vídeo.
- `programs`, `program_versions`, `sessions` e `prescriptions`: programa e doses planeadas.
- `workout_logs`, `set_logs` e `check_ins`: o que foi realmente feito e feedback.
- `generation_jobs` e `generation_audit`: versão das regras/modelo, validações, resultado e motivo das alterações.

Aplicar RLS por titular a todas as entidades privadas. Uma função de treinador para atribuir planos à Joana ou a outras pessoas exige convite e acesso explícito; conhecer o email não dá acesso aos dados. Utilizadores só veem os seus dados, salvo partilha autorizada.

Qualquer chave de IA fica no servidor. Não enviar dados pessoais ou de saúde a um fornecedor de IA sem necessidade, informação e fundamento adequados. Definir retenção, exportação, eliminação de conta, recuperação e tratamento de incidentes antes de abrir o registo ao público. Rever os requisitos aplicáveis de proteção de dados e as condições de uso com apoio apropriado ao lançamento.

## Etapas de entrega

| Etapa | Resultado | Critério para avançar |
| --- | --- | --- |
| 2.1 | MVP entregue: questionário privado e editável | Rascunho autorizado, validação, login obrigatório e isolamento por conta |
| 2.2 | MVP entregue: biblioteca, exemplos YouTube e gerador por regras | Material, duração, nível, etiquetas e associações cobertos por verificações |
| 2.3 | MVP entregue: proposta e ativação explícita | Fichas anteriores e histórico preservados; versões de programa e respostas guardadas |
| 2.4 | Base entregue: check-ins e orientação por esforço; continuar revisão por desempenho | Acrescentar sugestões por exercício e comparação de registos, sempre confirmadas |
| 2.5 | Pendente: preparação para distribuição alargada | Proteção contra abuso, limites, monitorização, política de privacidade, eliminação completa e revisão humana operacional |
| 2.6 | Opcional e pendente: apoio de IA | Validação estruturada, avaliação de qualidade e custos, sem chaves no cliente |

## Testes de aceitação

- Três dias de 30–45 minutos em casa com halteres desmontáveis.
- Dois dias de 20 minutos sem material.
- Quatro dias em ginásio com máquinas e pesos livres.
- Banco sem inclinação e ausência de suporte para barra.
- Cargas limitadas e necessidade de progressão sem mais discos.
- Respostas incompletas, incompatíveis ou que exigem avaliação antes de prescrever.
- Unidades de carga ambíguas e exercícios unilaterais.
- Conta nova sem histórico, importação de plano anterior e mudança de objetivos.
- Visitante e sessão rejeitada sem acesso à aplicação; conta nova sem programa de 12 semanas.
- Perder peso como objetivo principal ou secundário, sem exigir peso/altura e sem promessas de perda localizada.
- Duas contas sem acesso cruzado; dispositivos offline; conflito e recuperação de cópias.
- Alterar ou gerar um plano nunca apaga sessões já realizadas.

- Adicionar um vídeo de shoulder press e encontrá-lo pelo filtro “ombros”; associá-lo ao exercício do plano.
- Guardar exemplos para peito e bíceps, incluindo etiquetas secundárias, e editar a classificação.
- Associar excertos diferentes do mesmo vídeo a exercícios e zonas diferentes, abrindo cada um no seu ponto de início.
- Acrescentar ou substituir uma demonstração sem alterar as doses nem os registos existentes.
- Vídeos pessoais sem acesso cruzado entre contas; conteúdo partilhado apenas após ação explícita e revisão.
