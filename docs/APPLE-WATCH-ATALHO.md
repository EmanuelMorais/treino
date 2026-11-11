# Associar o treino do Apple Watch a uma sessão

O site não lê o Apple Saúde: só uma app nativa ou um Atalho do iPhone têm esse acesso. Um Atalho lê o último treino do Watch e abre o site com o resumo no endereço. O site pede confirmação e guarda o resumo na sessão escolhida. Não há chaves nem tokens no Atalho: a gravação usa a sessão já iniciada no navegador.

## Formato do endereço

```
https://emanuelmorais.github.io/treino/#watch?start=<início>&end=<fim>&kcal=<energia ativa>&hr=<FC média>
```

- `start` e `end` são obrigatórios, em ISO 8601 (`2026-11-11T19:02:13+00:00`) ou no formato `2026-11-11 19:02:13 +0000`. Um `+` não codificado chega como espaço e é tratado como sinal positivo.
- `kcal` (0–5000) e `hr` (30–250) são opcionais; vírgula decimal é aceite e o valor é arredondado.
- A duração é calculada a partir de `start` e `end` (1–600 min). Até 240 min substitui a duração da sessão.
- Treinos com mais de 3 dias ou com fim no futuro são recusados.
- O fragmento `#watch?…` é removido do endereço assim que a página o lê. Se for preciso entrar na conta primeiro, o pedido fica guardado nessa aba até ao login.

## Que sessão recebe o resumo

1. Uma sessão em curso nesse dia, se existir (o resumo fica na sessão e passa para o histórico ao guardar).
2. Senão, as sessões guardadas nesse dia, a mais próxima da hora de fim primeiro.

A janela mostra as opções; nada é gravado sem «Associar». Exercícios e séries não mudam.

## Criar o Atalho no iPhone

Os nomes das ações podem variar ligeiramente com a versão e o idioma do iOS.

1. **Atalhos → +**, nome «Treino → site».
2. **Procurar amostras de saúde** (Find Health Samples): tipo **Treinos**, ordenar por **Data de início**, **Mais recente primeiro**, limite **1**.
3. Toca na variável da amostra e escolhe **Data de início**. Junta **Formatar data** → formato **ISO 8601**, com hora. Repete para **Data de fim**.
4. Se estiver disponível, escolhe também **Energia ativa** e **Frequência cardíaca média**, só com o número (sem unidade).
5. Ação **URL** com o endereço acima, inserindo as variáveis. Depois **Abrir URLs**.
6. Opcional: **Automatização → Treino do Apple Watch → Termina → Executar imediatamente → Executar atalho «Treino → site»**.

O Atalho abre o Safari. Se usas o site a partir do ecrã principal, o Safari pode ter outra sessão: entra na conta no Safari uma vez.

## Verificação

- Testes Node: `tests/watch-import.test.cjs` (formatos de data, limites, escolha da sessão, gravação e contrato do documento).
- Navegador (Chrome, ecrã de 390 px, dados fictícios): endereço com `#watch?…` → janela → «Associar» → resumo no histórico.
- Por verificar: o Atalho real num iPhone com o Apple Watch e o Safari em iOS.
