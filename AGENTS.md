# Treino — orientação do repositório

Aplicação estática privada, em português de Portugal, alojada no GitHub Pages e com Auth/dados no Supabase. Preservar o endereço público e a compatibilidade dos documentos existentes durante alterações incrementais.

## Antes de alterar

- Para criação/edição de treinos, catálogo, substituições, execução ou demonstrações, consultar o skill em `.agents/skills/treino-product-workflow/SKILL.md`.
- Prioridades e critérios: `docs/PLANO-EXPERIENCIA-TREINO.md`. Estrutura atual/alvo: `docs/ARQUITETURA.md`. Evidência e testes por fluxo: `docs/TESTES-FLUXOS.md`.
- Estes documentos distinguem o que existe do que está planeado; não assumir que a estrutura alvo ou os novos fluxos já estão implementados.
- Nunca incluir perfis, programas pessoais, registos, exports ou credenciais no código, nos testes ou na documentação pública. Usar exemplos fictícios.

## Fontes e comandos

- `app.js`: aplicação e registo de sessões; `profile-ui.js`: perfil/propostas/exemplos; `program-engine.js`: regras puras; `src/cloud-app.js`, `auth-data.js` e `auth-ui.js`: acesso e sincronização.
- `cloud.js` e `vendor/supabase.js` são gerados por `npm run build`; editar as fontes, não os resultados diretamente.
- `npm test`: regressões Node, incluindo base de dados isolada PGlite. `npm run build`: compilar artefactos publicados. `npm run dev`: servidor local na porta 8775.
- Os testes atuais não substituem um teste de utilização no navegador. Usar a matriz de fluxos para escolher a verificação adequada à alteração e declarar o que ficou por verificar.
- Não alterar dados reais para testar um editor, importação, migração ou sincronização. Separar fixtures sintéticas e contas de teste dos utilizadores reais.
