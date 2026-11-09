# Fase 2 — programas personalizados por questionário

## Objetivo

Permitir que qualquer pessoa crie uma conta, preencha um questionário e receba um programa de treino adequado à sua experiência, objetivos, tempo disponível, material e limitações declaradas. A pessoa pode seguir o programa, registar a execução e rever o plano com base no progresso.

Este documento é um plano de implementação. A geração automática e o registo público de produção ainda não estão entregues nesta fase.

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
| Objetivos | Prioridade entre força, massa muscular, mobilidade, condição física e composição corporal; objetivos secundários | Escolha de volume, exercícios e métricas |
| Experiência | Tempo de prática, regularidade, movimentos conhecidos, cargas/repetições atuais e nível de esforço | Ponto de partida e complexidade dos movimentos |
| Disponibilidade | Dias por semana, dias preferidos, minutos por sessão, horário e duração do ciclo | Calendário e orçamento de tempo |
| Local | Casa, ginásio, exterior ou combinação; espaço para caminhar e treinar | Compatibilidade dos movimentos |
| Material | Halteres e carga por haltere, discos totais, barra, banco e inclinação, suportes, elásticos, máquinas, barra de elevações e outros | Variantes executáveis e progressão realista |
| Tolerância e limitações | Movimentos que incomodam, restrições indicadas por profissional, limitações de amplitude e exercícios a evitar; resposta opcional e privada | Ajustes de variante, dose e necessidade de revisão humana |
| Preferências | Exercícios preferidos/evitados, formato guiado, alternativas e mobilidade nos intervalos | Adesão e escolha entre opções equivalentes |
| Recuperação | Sono, atividade diária, tempo sentado, outros desportos e esforço percebido | Dose inicial e ajustes conservadores |

Distinguir sempre kg por haltere, kg totais da barra, peso corporal, segundos e passos. Não inferir diagnósticos a partir das respostas nem exigir medições de gordura corporal.

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

Separar os dados do questionário, a proposta, o programa ativado e os registos de execução. Evoluir o documento sincronizado da fase 1 para entidades próprias:

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
| 2.1 | Questionário privado e editável | Rascunho, validação, consentimentos e isolamento entre contas verificados |
| 2.2 | Biblioteca de exercícios, exemplos YouTube e gerador por regras | Vídeos classificados por zona muscular e ligados ao exercício; cenários de material, duração e nível passam nos testes; fontes e doses rastreáveis |
| 2.3 | Pré-visualização e ativação do programa | Alterações explícitas e versões anteriores recuperáveis |
| 2.4 | Revisão baseada nos registos | Ajustes explicados, sem aumentos impostos por calendário |
| 2.5 | Abertura ao público | Email de produção, proteção contra abuso, custos/limites, monitorização, privacidade e recuperação verificados |
| 2.6 | Apoio opcional de IA | Validação estruturada, avaliação de qualidade e custos, sem chaves no cliente |

## Testes de aceitação

- Três dias de 30–45 minutos em casa com halteres desmontáveis.
- Dois dias de 20 minutos sem material.
- Quatro dias em ginásio com máquinas e pesos livres.
- Banco sem inclinação e ausência de suporte para barra.
- Cargas limitadas e necessidade de progressão sem mais discos.
- Respostas incompletas, incompatíveis ou que exigem avaliação antes de prescrever.
- Unidades de carga ambíguas e exercícios unilaterais.
- Conta nova sem histórico, importação de plano anterior e mudança de objetivos.
- Duas contas sem acesso cruzado; dispositivos offline; conflito e recuperação de cópias.
- Alterar ou gerar um plano nunca apaga sessões já realizadas.

- Adicionar um vídeo de shoulder press e encontrá-lo pelo filtro “ombros”; associá-lo ao exercício do plano.
- Guardar exemplos para peito e bíceps, incluindo etiquetas secundárias, e editar a classificação.
- Associar excertos diferentes do mesmo vídeo a exercícios e zonas diferentes, abrindo cada um no seu ponto de início.
- Acrescentar ou substituir uma demonstração sem alterar as doses nem os registos existentes.
- Vídeos pessoais sem acesso cruzado entre contas; conteúdo partilhado apenas após ação explícita e revisão.
