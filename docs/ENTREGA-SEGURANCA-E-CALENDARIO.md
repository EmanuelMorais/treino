# Segurança do repositório e contexto desportivo

10 de novembro de 2026. Branch `codex/seguranca-contexto-desportivo`, [PR #2](https://github.com/EmanuelMorais/treino/pull/2). Implementação e testes locais concluídos; integração/publicação dependem do resultado do CI do commit exato.

## Auditoria de credenciais

Analisados os ficheiros versionados e todas as referências Git disponíveis após atualizar branches e o head do PR anterior: 31 commits alcançáveis na auditoria inicial, dos quais o Gitleaks analisou 30 com alterações. O snapshot inicial tinha 90 ficheiros. Não foram detetados segredos. A verificação adicionada ao projeto cobre também mensagens de commit e nomes de ficheiros privados no histórico. O resultado não certifica máquinas, forks, commits inacessíveis ou outros serviços.

GitHub secret scanning e push protection já estavam ativos; sem alertas abertos na consulta. O ficheiro local `.env.smtp.local` está ignorado, nunca apareceu nos caminhos históricos consultados e tem permissões 0600. O seu conteúdo não foi lido nem publicado nesta auditoria. Não foi necessária rotação ou reescrita de histórico por não terem sido encontradas credenciais privadas.

A configuração contém uma chave **publicável** Supabase, adequada ao código entregue ao navegador. Não é uma chave administrativa nem uma palavra-passe. A proteção dos documentos depende de autenticação e RLS, conforme a [documentação Supabase](https://supabase.com/docs/guides/getting-started/api-keys). Confirmados por metadados no Treino: RLS nas duas tabelas, políticas por `auth.uid()`, função de gravação `security invoker`, execução permitida a `authenticated` e recusada a `anon`. Não foram consultados documentos dos utilizadores nem alterados Treino/LifeHub.

## Prevenção de novas exposições

- Gitleaks 8.30.1 instalado em `work/`, por versão e SHA-256 fixados, sem instalar globalmente.
- Detetores padrão mais regras para chaves administrativas Supabase e Brevo/SMTP; chave publicável não é tratada como segredo. Não há allowlist global de ficheiros ou exceções para credenciais.
- `npm run security:scan` analisa os ficheiros Git presentes, diferenças/histórico completo e mensagens; recusa ficheiros privados versionados e JWT administrativos. Não segue symlinks para ficheiros ignorados. Os erros não imprimem valores encontrados.
- O CI obtém o histórico completo, prepara o contexto Git do container e executa a análise antes de dependências/build/testes. Uma falha impede o workflow de publicação. Comentários `gitleaks:allow` e ficheiros de ignore locais não silenciam a verificação.
- Hook `.githooks/pre-commit` ativo neste checkout: verifica árvore de trabalho e staging. Isto deteta uma chave ainda no staging mesmo que tenha sido apagada do ficheiro de trabalho. Noutro clone: `npm run security:install` e `git config core.hooksPath .githooks`.
- Credenciais da fixture de Auth são aleatórias por execução; não são credenciais de contas reais e não são guardadas no código.

## Modalidade, prova e semana habitual

O questionário distingue condição geral, complemento desportivo e preparação de prova. Os campos específicos só aparecem no percurso relevante: modalidade, experiência, prova/data/distância/objetivo e linha de base opcional. Valores desconhecidos ficam vazios; não são inventados ritmos, watts, FTP, volumes ou tempos. As respostas mantêm-se ao mudar de percurso e são privadas por conta.

É possível adicionar, editar, cancelar e remover atividades externas, com dia, minutos, modalidade e tipo. O calendário descreve uma semana habitual; não cria registos realizados nem sessões prescritas. Treinos/jogos existentes não são substituídos pelo gerador. A proposta geral e a página inicial mostram força e atividades declaradas juntas, distinguindo minutos estimados de minutos declarados. Não há uma pontuação de carga ou validação automática da recuperação.

Se força e atividades externas coincidirem num dia, a geração geral pede rever os dias ou uma confirmação explícita da combinação. A confirmação produz avisos e o resumo semanal; não valida uma dose especializada. Importar/alterar uma proposta não contorna o bloqueio: a ativação também verifica coincidências não confirmadas.

**Os módulos de geração especializada continuam indisponíveis.** Esta limitação aparece logo ao escolher o percurso, antes de preencher o resto. Contexto/calendário podem ser guardados; a pessoa pode usar uma ficha própria ou importar um plano revisto. Nunca se apresenta um programa geral com um rótulo de maratona/ciclismo/padel.

## Preservação e compatibilidade

O build de dados passa a 9; o protocolo do servidor continua 8, porque já compara o `minClientBuild` com o escritor enviado no header. Separados os dois conceitos no cliente: não é necessária nova migração Supabase para esta funcionalidade. Teste SQL isolado prova que o escritor 8 é recusado perante documentos 9 e que o escritor 9 os guarda no protocolo 8. A mesma barreira foi verificada no servidor Treino numa transação terminada por rollback, com um identificador fictício e sem criar documentos. Versões antigas pedem atualização, preservando os dados locais.

Programas novos guardam o dia da semana na ficha. Ao ler programas antigos, o dia é recuperado do questionário arquivado do programa, nunca das respostas atuais; fica preservado mesmo se essas respostas forem apagadas depois. Não se alteram doses/snapshots realizados. Contexto e calendário fazem parte das cópias completas e da versão de questionário do programa; exportar apenas uma ficha não inclui estas respostas privadas.

## Verificação

- **151 testes Node aprovados**: oito regressões do scanner, sete de contexto/calendário, contratos/importação, compatibilidade e restantes regressões.
- Chrome e WebKit locais, com o artefacto `dist/`, incluindo contexto de prova, CRUD/cancelamento/reload do calendário, recusa explícita de geração indisponível, escolha de dias sem coincidências e preservação dos planos/histórico. Layout a 320 px.
- Integração com SDK e SQL/RLS isolados: calendário criado no segundo browser aparece automaticamente no PC, juntamente com planos/registos; outra conta permanece vazia. Credenciais de fixture geradas em memória.
- Build e empacotamento: **30 ficheiros públicos**; segredos, scripts de desenvolvimento e documentos não entram no artefacto. Git diff e links locais da documentação verificados.

Auth é simulado nesta integração e Realtime é fechado para testar o fallback periódico. Não equivale a Auth/Realtime alojados nem a Safari/iPhone físico. Resultado Linux e publicação devem ser consultados na execução do commit exato do PR.

## Fontes e pendências

Reconsultadas as fontes gerais [ACSM 2026](https://acsm.org/resistance-training-guidelines-update-2026/) e [CDC](https://www.cdc.gov/healthy-weight-growth/physical-activity/). São referências gerais; não validam por si só a dose individual nem os módulos desportivos.

A [B.A.A.](https://www.baa.org/races/boston-marathon/info-for-athletes/boston-marathon-training/) documenta planos de corrida por níveis e requer autorização para reprodução/reutilização dos seus planos. Não foram copiados. A página de planos da [British Cycling](https://www.britishcycling.org.uk/knowledge/training-plans) foi identificada, mas o acesso direto devolveu 403; não se declara uma revisão integral dessa fonte.

Falta a geração complementar/específica por modalidade com fontes/regras/revisão próprias, importação dedicada de calendários externos, alterações sugeridas a partir da carga global, testes alojados de Auth/Realtime, iPhone físico, acessibilidade completa e observação com utilizadores. A matriz F01–F43 mantém estes limites; esta entrega não a dá como concluída.
