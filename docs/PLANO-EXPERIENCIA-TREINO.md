# Plano: criar, adaptar e seguir treinos com facilidade

Data: 9 de novembro de 2026. Plano de trabalho faseado. A [primeira entrega na branch `codex/catalogo-editor-treino`](ENTREGA-CATALOGO-EDITOR.md) implementa parte das bases e do catálogo/editor; não está integrada em `main` nem publicada. A [segunda entrega](ENTREGA-SUBSTITUICOES.md) acrescenta substituições e retomada de sessões; o documento respetivo regista a verificação e os limites. A [terceira entrega](ENTREGA-GERADOR-CATALOGO.md) integra o catálogo no gerador e detalha material/altura. A [quarta entrega](ENTREGA-PROPOSTAS-E-REVISAO.md) permite personalizar propostas antes de ativar e rever fichas futuras com preservação das personalizações. A [quinta entrega](ENTREGA-SESSOES-E-QUALIDADE.md) separa ficha/sessão, acrescenta metadados pessoais, questionário em quatro passos, integração de dois browsers e workflows. Os restantes fluxos continuam planeados. Este documento ordena as alterações de criação/edição previstas na [fase 2](FASE-2.md), sem dar essa fase como concluída.

Objetivo: uma pessoa sem experiência consegue obter uma proposta compreensível e começar; uma pessoa experiente consegue construir e adaptar o plano, incluindo os gerados, sem perder o histórico. Durante a sessão, a interface concentra-se no exercício, na série e no próximo passo.

## Referências analisadas

Consulta da documentação oficial; não foi feita uma auditoria autenticada de todas as aplicações nem um estudo independente de usabilidade. São referências relevantes de produto, não um ranking de quota de mercado. As decisões para o Treino abaixo são propostas nossas.

| Produto | Padrão documentado | Aplicação proposta no Treino |
| --- | --- | --- |
| [Hevy](https://help.hevyapp.com/hc/en-us/articles/35688251991575-Hevy-Exercise-Library-400-Exercises-and-Custom-Exercises) | Pesquisa, filtros por músculo/material, rotinas reutilizáveis distintas de sessões, instruções/demonstração e exercícios pessoais com tipo de medida | Um seletor comum a todos os editores e uma definição estável por variante |
| [Fitbod](https://help.fitbod.me/hc/en-us/articles/360006335593-Editing-Workouts-in-Fitbod) | Criar do zero, adicionar/substituir/reordenar; pesquisa por músculo/categorias e filtros opcionais de material | Geração como ponto de partida editável; alternativas contextuais e acesso ao catálogo completo |
| [Boostcamp](https://www.boostcamp.app/features/swap-exercises) | Alternativas recomendadas ou livres; troca só nesta sessão ou também nas futuras; percentagens recalculadas pela referência do exercício novo | Mostrar o âmbito de uma troca e não transportar cargas/recordes de outro movimento |
| [Strong](https://www.strong.app/) | Posicionamento de caderno de treino simples, com registo e evolução | Ecrã de execução reduzido ao essencial; detalhes técnicos fora do percurso principal |

Não copiar catálogos, animações ou vídeos destes produtos. Reutilizar padrões de interação e construir conteúdo com origem/licença e revisão próprias. Não apresentar um exemplo YouTube como aprovado só por aparecer na pesquisa.

## Prioridades descobertas no código

O alojamento estático serve o produto; a organização interna precisa de melhorar antes de ampliar o editor. A [arquitetura](ARQUITETURA.md) separa catálogo, prescrição, sessão e registos realizados.

Na auditoria desta data, os 59 testes existentes e o build passaram, mas foram confirmadas lacunas: exercícios gerados sem vídeo, histórico dependente de IDs por ocorrência/nome, sessões anteriores do mesmo dia ignoradas, e mudança de unidade que conserva valores já preenchidos no rascunho. São prioridades de correção, não comportamentos a preservar. Ver [evidência e limites](TESTES-FLUXOS.md).

## Experiência proposta

### 1. Começar sem precisar de saber programar treino

Na conta vazia, duas ações: **«Ajuda-me a criar um plano»** e **«Criar o meu treino»**. A pessoa pode alternar livremente; não fica presa a um modo iniciante/avançado.

O percurso guiado apresenta perguntas por passos curtos: objetivos (incluindo perder peso), experiência, dias/minutos, local/material, espaço e restrições. Só pedir informação necessária; peso/altura opcionais. Guardar rascunho com autorização e mostrar progresso. Um erro abre o passo relevante, foca a mensagem e conserva as respostas.

A proposta resume dias, tempo estimado, exercícios e motivo das escolhas, com uma explicação curta da progressão. Cada exercício permite **«Ver execução»** e **«Trocar»** antes de ativar. Não exigir que a pessoa conheça siglas ou escolha séries/cargas sem contexto. Usar valores iniciais conservadores e editáveis, sem cargas inventadas a partir de idade/peso.

Os objetivos orientam as regras e o acompanhamento; não constituem uma garantia de resultado. Escolher um músculo não basta para produzir um programa equilibrado. O gerador valida padrões cobertos, volume, complexidade, material, espaço e orçamento de tempo. Preservar o comportamento de revisão das limitações até existir um percurso de revisão adequado; não interpretar texto livre como diagnóstico. Distinguir exercício de que não gosta de movimento que provoca dor/restrição. As regras de prescrição mantêm referências próprias, separadas da pesquisa de UX.

### 2. Adicionar um exercício

O botão **«Adicionar exercício»** abre o catálogo, com pesquisa focada, em vez de abrir logo um formulário vazio.

- Pesquisa por nomes PT/EN, aliases e termos comuns, tolerante a maiúsculas e acentos. Correspondência exata primeiro; resultados previsíveis, sem uma conversa com IA como requisito.
- Filtros simples de **zona muscular** e **material**; respeitar o material do perfil e tornar o filtro ativo visível. Um toque limpa filtros. Se não houver resultados, explicar e oferecer limpar/criar exercício pessoal.
- Antes de escrever: recentes e favoritos; depois, resultados com nome, zona principal, material e variante. Sem doses, gráficos ou listas longas de músculos secundários em cada linha.
- Permitir selecionar vários, ver a contagem e confirmar **«Adicionar N exercícios»** sem perder a pesquisa/seleção ao abrir os detalhes. Impedir duplicações acidentais, mas permitir repetir intencionalmente com aviso simples.
- Detalhes abrem instruções curtas, exemplo, músculos secundários e dados anteriores compatíveis. Voltar conserva a posição da lista.
- **«Não encontro: criar exercício»** abre nome, material, zona, tipo de medida e exemplo. Campos avançados recolhidos numa secção opcional; o movimento pessoal fica privado por defeito.

Um mapa corporal pode ajudar posteriormente, mas não é pré-requisito: lista acessível de zonas primeiro. Não obrigar a navegar por uma imagem pequena para encontrar um exercício.

### Cobertura do catálogo: requisito para disponibilizar o gerador

Os 25 exercícios de partida eram um catálogo inicial insuficiente para a variedade de contextos pretendida. Ampliar e rever o catálogo é trabalho próprio da etapa 2, em paralelo com a pesquisa/editor; melhorar a interface sem melhorar o conteúdo não satisfaz esta etapa.

Avaliar a cobertura por **contexto de material × padrão/direção × nível × condições de execução**, além dos grupos musculares. Não definir sucesso apenas por um número total de exercícios ou inflacionar a contagem com aliases e mudanças de nome.

| Contexto a testar separadamente | Cobertura e distinções necessárias |
| --- | --- |
| Sem equipamento | Variantes com peso corporal, regressões/progressões e mobilidade; não pressupor cadeira, banco, apoio, barra de elevações ou ponto de fixação |
| Só halteres | Exercícios viáveis sem banco, variantes por carga/complexidade e alternativas; banco e inclinação são requisitos adicionais explícitos |
| Barra e discos | Distinguir exercícios que exigem suporte/rack, banco, espaço ou outros acessórios; possuir uma barra não equivale a ter um ginásio completo |
| Elásticos | Distinguir tipo de elástico e necessidade de ancoragem/apoio; não sugerir uma variante com requisitos não declarados |
| Ginásio com máquinas | Identificar máquinas concretas e polias/acessórios disponíveis; «tenho máquinas» não significa ter leg press, chest press e remada ao mesmo tempo |
| Material misto e condições de espaço | Combinar apenas o material disponível, incluindo limites de altura, espaço para caminhar e variantes sentadas/ajoelhadas quando executáveis |

Cobrir movimentos de joelho/anca, empurrar e puxar nas direções relevantes, trabalho unilateral, tronco, transporte, acessórios musculares e mobilidade de acordo com o âmbito do módulo. Para cada função exigida pelo plano, procurar variantes apropriadas ao contexto e alternativas realmente distintas; como objetivo editorial, ter pelo menos duas opções compatíveis onde forem viáveis. Uma ausência legítima não deve ser escondida com uma falsa equivalência: indicar a lacuna e o que o programa consegue/não consegue cobrir.

Cada entrada revista precisa de identidade estável, nomes/aliases PT/EN, material e apoios obrigatórios, músculos/padrão/direção, nível de complexidade, instruções, tipo de medida/referência da carga, demonstração ou pesquisa e proveniência/estado de revisão. Nomes diferentes do mesmo exercício são aliases; mudanças reais de variante/material podem justificar entradas distintas. Conteúdo pessoal continua separado do catálogo público.

Construir um relatório automático de cobertura e de lacunas por contexto. A geração verifica os requisitos do seu módulo antes de apresentar a proposta: não inventa equipamento, não chama completo a um plano que omite funções necessárias e explica quando é preciso rever material/objetivo. Conteúdo insuficiente mantém esse módulo limitado ou indisponível; aumentar o catálogo não torna automaticamente disponíveis módulos desportivos ainda não revistos.

Entregar por lotes revistos, com origem/licença verificadas e testes dos contextos acima. Não importar em massa uma lista de nomes sem instruções, compatibilidade ou revisão, nem tratar um vídeo/pesquisa como validação da prescrição. Critérios de saída adicionais: F39–F43 da matriz e evidência de que uma pessoa encontra e troca exercícios no seu contexto real.

### 3. Construir e editar um treino

O editor mostra nome do treino, lista de exercícios ordenada e dose resumida. Reordenar por arrasto **e por botões acessíveis**. Editar séries, repetições/tempo/passos, descanso e esforço dentro do exercício; opções avançadas apenas quando abertas. Mostrar explicitamente carga por haltere ou total da barra.

A partir de um treino vazio, oferecer ajuda para preencher os movimentos em falta. Avisos curtos e acionáveis para tempo excessivo, material em falta ou cobertura desequilibrada; detalhes sob «Porquê?». Não bloquear escolhas experientes apenas por diferirem de uma sugestão. Restrições incompatíveis com recomendações não se tornam seguras por ignorar um aviso.

Planos gerados usam o mesmo editor. Edições pessoais ficam identificadas e não desaparecem numa regeneração. Antes de regenerar, mostrar o que será mantido/substituído e pedir escolha só quando houver alterações reais a perder. Duplicar cria uma nova identidade; exportar um plano não inclui histórico nem respostas pessoais.

### 4. Trocar um exercício

**«Trocar»** fica acessível no exercício, sem depender apenas de gestos escondidos. Apresentar primeiro poucas alternativas adequadas, uma razão curta (por exemplo, mesmo padrão e material disponível) e acesso à pesquisa completa.

As sugestões consideram padrão/direção, grupos musculares, material/carga disponível, complexidade, espaço e restrições. Ter o mesmo músculo não chega: uma elevação lateral não substitui automaticamente um press. Se não houver alternativa próxima, dizer isso e propor rever o bloco, sem inventar equivalência.

Antes de aplicar, mostrar o âmbito:

- **Só nesta sessão** — predefinição quando se está a treinar.
- **Nas próximas sessões deste dia** — mostrar datas/semanas afetadas; excluir sessões concluídas.
- **Outro âmbito do programa** — opção avançada, com resumo explícito antes de confirmar.

Séries e objetivos só transitam quando compatíveis; recalcular a estimativa do treino. Nunca copiar cegamente kg, percentagens, recordes ou segundos/repetições de outro movimento. Se o exercício novo não tem dados próprios, pedir uma carga de adaptação, sem fingir que é o recorde anterior.

Se já houver séries realizadas, conservar o bloco com o movimento original e criar outro para o restante trabalho. Não renomear séries feitas como se fossem do exercício novo. Oferecer desfazer quando possível e restaurar o original para o futuro sem apagar história.

### 5. Seguir o treino sem ruído

Separar **editar plano** de **executar sessão**. O início mostra o treino de hoje, duração e «Começar». Dentro da sessão: exercício atual, dose, dados anteriores compatíveis, campos da série, concluir, descanso e próxima ação. Demonstração acessível sem sair do contexto. Visão completa opcional.

Origem do programa, comparações com a fonte, versões e notas longas ficam nos detalhes do plano. Não apresentar todos os metadados enquanto a pessoa regista repetições. Resumo e feedback breve no fim; sessão parcial pode ser guardada.

Navegação principal proposta: **Treinar · Planos · Progresso**, com catálogo acessível no editor/Planos e conta no cabeçalho. Validar esta organização antes de a fixar. No móvel: alvos de pelo menos 44 px, campos legíveis, teclado numérico adequado, foco previsível, mensagens junto do problema e ausência de deslocamento horizontal. Ações essenciais não dependem de cor, hover ou swipe.

### 6. Demonstrações e vídeos pessoais

Cada exercício apresenta sempre uma ação útil, por esta ordem:

1. Exemplo pessoal escolhido para essa variante.
2. Exemplo de execução revisto no catálogo, com origem e intervalo quando necessário.
3. **«Pesquisar no YouTube»**, com o nome/alias adequado codificado na URL.

O fallback é uma pesquisa identificada como tal, não a primeira ligação escolhida automaticamente. Um vídeo genérico de treino não substitui uma demonstração específica sem indicar o intervalo/exercício.

Permitir colar uma ligação YouTube própria ou de outra pessoa, pré-visualizar, indicar início/fim, associar músculos/material/variante e escolher como exemplo preferido. Distinguir exemplo privado e conteúdo revisto do catálogo. Trocar o exemplo não altera o plano nem o histórico.

Sem autoplay. Fechar o diálogo, navegar ou terminar sessão destrói o player e para o áudio. Vídeo removido, privado, com restrição de incorporação ou bloqueado por cookies mantém as opções abrir no YouTube e pesquisar. Falha da rede não impede registar séries. Validar URLs e intervalos; nunca inserir HTML fornecido pelo utilizador.

Nesta fase, «vídeo próprio» significa ligação para um vídeo YouTube, incluindo não listado quando acessível. Upload direto de ficheiros fica para uma fase posterior, com armazenamento privado, permissões, limites e custos definidos; não o apresentar como já disponível.

## Preparação por modalidade e para provas

Extensão pedida em 9 de novembro de 2026: apoiar também pessoas que treinam para uma modalidade ou um evento, como uma maratona, ciclismo ou padel. **Ainda não implementada.** Não tratar esta opção como um simples filtro de músculos nem dar um nome desportivo a uma rotina genérica.

Na entrada guiada, distinguir **condição física geral**, **preparação complementar para o meu desporto** e **preparar uma prova**. Só abrir perguntas da modalidade quando esta for escolhida; manter o percurso geral curto. Permitir conciliar objetivos, mas definir a prioridade e mostrar incompatibilidades antes de gerar.

| Contexto | Informação adicional relevante | Resultado a desenhar e validar |
| --- | --- | --- |
| Corrida / maratona | Distância e data da prova, terminar ou tempo pretendido, experiência, frequência/volume recente, sessão mais longa recente, dias de corrida e plano já seguido | Primeiro, força/mobilidade complementar coordenada com a corrida. Um plano completo exige sessões próprias de corrida, duração/distância/intensidade, fases e preparação para a prova; não é entregue apenas com séries de musculação |
| Ciclismo | Estrada/BTT/indoor, prova/percurso e data quando existirem, horas e sessões habituais, dias disponíveis, treinos intensos/longos; potência/FTP apenas se conhecidos e relevantes | Complemento coordenado com as saídas; um módulo completo distingue sessões de bicicleta, unidades e métodos de intensidade, sem inventar watts ou zonas |
| Padel | Nível, frequência/duração de jogos e treinos técnicos, competições, calendário e condições relevantes | Preparação física complementar com critérios específicos revistos para a modalidade, coordenada com jogos; não apresentar trabalho físico como substituto de treino técnico/tático |
| Outras modalidades / várias | Modalidade principal, atividades secundárias, calendário e prioridade | Só gerar preparação especializada quando houver módulo suportado/revisto. Caso contrário, declarar o limite e oferecer apenas a opção geral/complementar que esteja validada |

Regras do produto:

- Contabilizar **todos** os treinos e jogos relevantes, incluindo um plano externo; separar dias/minutos disponíveis para força dos dias/minutos da modalidade. Não acrescentar automaticamente várias sessões de força a uma semana já preenchida.
- Considerar calendário, recuperação declarada e feedback ao propor distribuição e alterações. Não aplicar a regra genérica de intervalo entre sessões de corpo inteiro a todas as sessões desportivas sem distinguir o tipo de trabalho.
- Recolher uma linha de base real. Uma data próxima ou objetivo incompatível com a experiência/tempo disponível produz uma explicação e revisão do objetivo, não uma progressão agressiva para cumprir o calendário.
- Trabalhar preparação geral, específica e período de prova/recuperação apenas com regras próprias documentadas e revistas. Fases e redução de carga não são copiadas mecanicamente da atual semana leve a cada quatro semanas.
- Permitir importar/registar o calendário externo e manter blocos do treinador; propor ajustes com âmbito explícito, sem reescrever sessões concluídas ou substituir um plano externo em silêncio.
- Medir o que corresponde ao objetivo: regularidade, feedback, distância/tempo e métricas da modalidade quando existentes. Não prometer um tempo de prova, prevenção de lesões ou melhoria de desempenho só por associar uma etiqueta ao exercício.
- Se houver concorrência entre preparar uma prova, ganhar massa e perder peso, apresentar a prioridade e as escolhas da proposta; não aumentar restrições alimentares nem volumes automaticamente.
- Manter demonstrações e substituições adaptáveis. Uma alternativa deve preservar a função do bloco e a fase do programa, além do padrão/músculo/material, ou pedir revisão quando não houver equivalência.

**Ordem de implementação:** primeiro os fluxos gerais e a preservação de dados; depois o contexto desportivo e o planeamento complementar. Planos completos de corrida/ciclismo/prova são módulos posteriores, entregues modalidade a modalidade, depois de recolher fontes específicas e obter revisão qualificada das regras. Não ativar a geração especializada só porque o questionário já permite selecionar a modalidade. A [proveniência das regras](GERACAO-E-FONTES.md) define os critérios de publicação do conteúdo.

## Entrega faseada

Cada etapa tem demonstração com dados fictícios, testes e critério de saída; a seguinte não substitui a verificação da anterior.

| Etapa | Trabalho | Critério de saída |
| --- | --- | --- |
| 0 — Base e correções | Contratos/fixtures, identidade estável, proteger séries realizadas ao editar unidade/variante, corrigir procura de histórico e introduzir fallback de demonstração | Documentos antigos legíveis, histórico intacto, regressões dos problemas encontrados e percurso básico no navegador |
| 1 — Estrutura | Extrair domínio/dados/UI por fluxo, formatar fontes separadamente da refatoração, build versionado e migração ensaiada | Mesmo comportamento externo, build reproduzível, migração/export/import sem perda e plano de recuperação |
| 2 — Catálogo e editor | Ampliar/rever conteúdo pela matriz de cobertura, relatório de lacunas, pesquisa PT/EN, filtros, detalhes, favoritos/recentes, multisseleção, criação pessoal e doses | Cobertura verificada por contexto/material (F39–F43) e criação de treino no móvel/PC, incluindo estados vazios, sem conhecer todos os nomes |
| 3 — Substituição e programas | Alternativas explicáveis, âmbito, troca a meio da sessão, overrides e regeneração com diferenças | Alterações futuras corretas, sem reinterpretar séries/cargas nem reescrever o passado |
| 4 — Execução e propostas | Reduzir ruído, separar editor/sessão, simplificar questionário/proposta e vídeos pessoais integrados | Uma conta nova chega ao primeiro treino, regista e retoma; uma pessoa experiente adapta-o sem perder controlo |
| 5 — Qualidade de publicação | Matriz completa, E2E Chromium/WebKit, dois dispositivos, acessibilidade e Pages condicionado aos testes | Percursos críticos verificados no artefacto a publicar; limitações móveis documentadas |
| 6 — Contexto desportivo e complemento | Modalidade/evento, linha de base, calendário externo, carga global e módulos complementares revistos | Compatibilidade com treinos/jogos, limites claros de suporte e testes específicos; sem prometer um plano completo da modalidade |
| 7 — Módulos completos por modalidade | Regras/fontes próprias, sessões desportivas, fases e ajustes por feedback; começar por uma modalidade validada | Um módulo de cada vez, revisto e testado; objetivos e datas inviáveis tratados sem inventar prescrições |

Os testes acompanham **todas** as etapas; a etapa 5 completa a cobertura e o bloqueio da publicação, não é o primeiro momento de testar. Começar a automatização do navegador na etapa 0. Evitar adicionar já gráficos, funcionalidades sociais, IA ou dezenas de filtros antes de validar o percurso principal.

## Critérios de aceitação do conjunto

- Uma pessoa nova encontra um exercício pelo nome ou pela zona/material e chega a uma ficha guardada sem escrever campos técnicos obrigatórios desnecessários.
- A proposta gerada pode ser ajustada antes e depois da ativação; a pessoa entende quais as sessões afetadas.
- Trocar um exercício ou editar a dose não altera os registos concluídos nem reutiliza uma carga incompatível.
- Todo o exercício tem demonstração ou pesquisa explícita e aceita um exemplo pessoal; não há áudio escondido depois de sair.
- A sessão móvel mostra uma ação principal de cada vez; detalhes e opções avançadas ficam disponíveis sem ocupar o percurso todo.
- Um registo feito num dispositivo surge no outro, na mesma conta, sem escolha manual de versões; conflitos seguem uma política visível e recuperável. Contas diferentes nunca recebem os mesmos dados privados.
- Passam os testes críticos da [matriz](TESTES-FLUXOS.md), incluindo erro/recuperação e edição a meio de uma sessão. Testar tarefas com pessoas iniciantes e experientes antes de considerar a UX validada; documentação dos concorrentes não substitui essa observação.
- A geração especializada só fica disponível para módulos com regras e fontes identificadas e revisão documentada; quem pretende uma maratona consegue distinguir complemento de força de um plano completo de corrida. Testar também F31–F38 ao entregar estas extensões.
