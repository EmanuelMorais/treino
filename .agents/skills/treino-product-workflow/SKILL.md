---
name: treino-product-workflow
description: "Aplicar as regras específicas do repositório Treino ao criar ou alterar o catálogo, editor de planos, substituições, sessões, histórico ou vídeos. Usar para preservar identidades, unidades e registos e escolher os testes dos percursos afetados."
---

# Alterar os fluxos do Treino

Este skill aplica-se a este repositório. Não substitui os skills gerais de Supabase, browser ou segurança e não autoriza publicações ou acesso a dados pessoais.

## Orientar a alteração

1. Ler as secções relevantes de `../../../docs/PLANO-EXPERIENCIA-TREINO.md`, `../../../docs/ARQUITETURA.md` e `../../../docs/TESTES-FLUXOS.md`, resolvendo estes caminhos a partir deste diretório. Separar explicitamente comportamento atual e alvo.
2. Identificar se a ação muda o catálogo, uma prescrição futura, a sessão em curso ou um registo concluído. Não tratar estes quatro objetos como o mesmo exercício mutável.
3. Mapear os consumidores antes de mudar um contrato: editor, gerador, execução, histórico, validação/importação, vídeo e sincronização. Os dados atuais continuam válidos até existir migração testada.

## Regras específicas

- A identidade de variante do catálogo é estável; o ID da ocorrência no plano é diferente. O histórico não depende do nome apresentado nem do ID gerado para cada semana.
- Preservar snapshots das séries realizadas. Renomear, substituir, remover ou mudar a unidade no editor não pode reinterpretar os valores já registados.
- Uma substituição distingue «Só hoje» de alterações futuras e mostra o âmbito antes de aplicar. Ações na sessão não devem alterar silenciosamente a dose do plano.
- Cargas usam referência estruturada: por haltere, total da barra, peso corporal ou outra explicitamente suportada. Não copiar kg, percentagens ou recordes entre variantes; não converter repetições em segundos/passos.
- Uma alternativa recomendada depende de padrão de movimento, material, espaço e restrições, além do músculo. Preferência pessoal e restrição física são dados diferentes. Não remover a revisão de limitações só para desbloquear a geração.
- Planos gerados continuam editáveis. Regenerar deve preservar alterações confirmadas ou apresentar as diferenças antes de as substituir.
- Cada exercício tem uma ação de demonstração: exemplo pessoal, exemplo revisto ou pesquisa YouTube pelo nome. Uma pesquisa não é um vídeo validado. Não escolher automaticamente o primeiro resultado.
- Vídeos só iniciam por ação explícita e deixam de tocar ao fechar/sair. Validar hosts/intervalos e oferecer ligação externa quando o embed falhar.
- Conta nova começa vazia; programas pessoais e exemplos privados não entram no catálogo público. Não enfraquecer o login/RLS para facilitar testes.

## Verificar o resultado

- Escolher os IDs da matriz de testes afetados; começar pelos contratos de domínio e confirmar o percurso visível no navegador quando houver mudança de interação.
- Para alterações a dados, verificar leitura antiga → migração → edição → export/import → sincronização, com fixtures sintéticas. Para alterações de exercício/unidade, confirmar também um registo já concluído e uma sessão parcial.
- Executar `npm test`; se mudar fontes compiladas, executar `npm run build` e verificar o resultado. Não editar `cloud.js` diretamente.
- Registar no plano/matriz a evidência realmente obtida: testes unitários, integração, navegador e equipamento físico são níveis diferentes. Um teste DOM simulado não prova o funcionamento em Safari.
- Só marcar um fluxo entregue depois de funcionar de ponta a ponta, incluindo erros e regresso ao treino. Não anunciar como testados fluxos que ainda estão apenas desenhados.
