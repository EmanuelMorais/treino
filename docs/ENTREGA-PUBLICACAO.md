# Publicação do catálogo, editor e execução

10 de novembro de 2026. O [PR #1](https://github.com/EmanuelMorais/treino/pull/1), desenvolvido em `codex/catalogo-editor-treino`, foi integrado em `main`. A branch foi conservada. A versão está disponível em [Treino](https://emanuelmorais.github.io/treino/).

## Versão e evidência

- Revisão publicada: `43ace004134b8b0fab4345cadf6a6ea469db88e1`.
- [Verificação do PR](https://github.com/EmanuelMorais/treino/actions/runs/42794660357): aprovada, incluindo o questionário por passos.
- [Publicação verificada](https://github.com/EmanuelMorais/treino/actions/runs/42795127758): aprovada; repetiu os testes sobre a revisão integrada antes de publicar.
- 136 testes Node, build reproduzível, empacotamento e percursos reais em Chrome/WebKit no Linux. A integração de dois processos de browser usa o SDK e código publicados, HTTP e SQL/RLS isolados; confirma propagação nos dois sentidos sem botão/reload e isolamento entre contas.
- Depois da publicação, os **28 ficheiros públicos** foram comparados por SHA-256 com o artefacto testado. Todos responderam HTTP 200 e coincidiram.
- Teste anónimo no site publicado, em Chrome e WebKit: acesso protegido, conteúdo privado vazio, formulário email/palavra-passe disponível, ausência de erros JavaScript e layout sem deslocamento horizontal a 320 px. Não foi enviado um formulário de login/registo nem consultado um documento de utilizador.
- Migração de compatibilidade aplicada previamente ao projeto Treino e verificada por metadados e transações com rollback; não foram alterados planos/registos reais nem o LifeHub. Detalhes na [quinta entrega](ENTREGA-SESSOES-E-QUALIDADE.md).

## O que ficou disponível

Catálogo comum de 93 variantes, pesquisa PT/EN, músculo/material, favoritos, recentes e seleção múltipla. Exercícios pessoais permitem zona, material, medida, descanso e exemplo YouTube. Todas as ocorrências têm exemplo ou pesquisa explicitamente identificada; os players não arrancam automaticamente.

Propostas de programas podem ser revistas e personalizadas antes da ativação. Rever um programa ativo mostra diferenças e mantém escolhas pessoais por defeito. As trocas distinguem hoje/próximas sessões, conservando séries realizadas, identidades e referências de carga.

A ficha do plano tem editor próprio. Começar uma sessão cria uma cópia de execução: alterar a ficha futura não muda o que já está em curso. A sessão apresenta o exercício e próximo passo, com opções menos frequentes recolhidas. O questionário tem quatro passos, gravação autorizada, navegação por teclado e erros que reabrem a secção relevante.

## Critérios de publicação e limites

Regressões de privacidade, perda/reinterpretação de séries, alterações no âmbito errado, migração e artefactos incompatíveis são bloqueantes. As verificações de domínio/integração/navegador relevantes passaram nesta versão. O workflow de publicação exige protocolo 8 no servidor e só publica o artefacto aprovado; não existe publicação automática a partir da raiz de `main`.

Esta é uma entrega do núcleo geral, **não a aprovação integral da matriz F01–F43**. As exceções abaixo ficam explícitas e não foram usadas para anunciar funcionalidades especializadas ou validação física:

| Percursos | Evidência e limite nesta publicação |
| --- | --- |
| F01–F04 | Gate anónimo publicado; login e questionário/proposta em fixture. Registo/recuperação/renovação de credenciais no Supabase alojado não foram repetidos nesta entrega |
| F05–F18 | Catálogo, edição, substituições, rascunhos e histórico em Node/Chrome/WebKit. Execução e teclado num iPhone físico continuam pendentes |
| F19–F22 | Parsers, pesquisa, demonstração pessoal e ciclo do player testados; o embed é intercetado no teste. Vídeos reais privados/removidos, cookies e áudio físico não estão certificados |
| F23–F24 | Contratos de cópias/importação e compatibilidade testados com dados fictícios; verificação transacional remota do protocolo. Não foi importado um export real de utilizador |
| F25–F27 | SDK/HTTP e SQL/RLS com dois browsers/contas isolados, mais testes de falhas e concorrência. Auth é simulado e o socket Realtime é fechado para testar o fallback; não equivale a dois dispositivos físicos no serviço alojado |
| F28–F30 | Larguras 320–1440 px, navegação/erros por teclado, artefacto sob `/treino/` e gate publicado. Zoom/rotação, leitor de ecrã, auditoria completa e reset real ainda pendentes |
| F31–F38 | Preparação especializada por modalidade/prova permanece planeada e indisponível. A proveniência do gerador geral continua identificada |
| F39–F43 | Cobertura/material/espaço verificados por regras e cenários de teste; revisão editorial/profissional adicional e observação com utilizadores continuam necessárias |

## Próximas prioridades

1. Testar ciclo de Auth e Realtime alojados com contas fictícias num ambiente separado, seguido do percurso físico iPhone/PC.
2. Observar criação/execução por uma pessoa iniciante e adaptação por uma experiente; completar acessibilidade, teclado/áudio/background no iPhone e corrigir as dificuldades observadas.
3. Continuar revisão de conteúdo/cobertura e desenhar contexto desportivo/calendário. Ativar módulos de desporto apenas depois de regras/fontes e revisão específicas, conforme o [plano](PLANO-EXPERIENCIA-TREINO.md).

A proteção e recuperação dos dados existentes mantêm prioridade em todas estas etapas.
