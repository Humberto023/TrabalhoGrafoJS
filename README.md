# Detector de Money Mule

Trabalho acadêmico de grafos: modela transferências bancárias como um grafo
direcionado e aponta quais contas se comportam como *money mule* (conta-laranja
usada para repassar dinheiro e quebrar o rastro entre origem e destino).

## A ideia

Cada **conta** é um nó e cada **transferência** é uma aresta com valor e momento.
O sinal que denuncia uma conta-laranja é simples: ela **recebe de várias origens e
repassa quase tudo adiante**, em vez de reter o dinheiro.

## Como o score é calculado

Para cada conta:

- **Taxa de retenção** = `(recebido − enviado) / recebido` — quanto do dinheiro ficou parado ali
- **Score** = `(1 − retenção) × 50 + (grau de entrada + grau de saída) × 5`

Ou seja: quanto **menos** a conta retém e quanto **mais conexões** ela tem, maior
a pontuação. Contas com score **acima de 40** são marcadas como suspeitas.

No conjunto de exemplo, as contas `C004` e `C005` recebem de três origens e
repassam praticamente todo o valor — são justamente as detectadas.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `money-mule.html` | Versão visual: desenha o grafo no navegador com a biblioteca vis-network |
| `money-mule-node.js` | Versão enxuta para rodar no terminal com Node.js |
| `MoneyMuleMeu.js` | Versão comentada passo a passo, explicando a lógica |

## Como executar

No navegador, basta abrir `money-mule.html`.

Pelo terminal:

```bash
node money-mule-node.js
```
