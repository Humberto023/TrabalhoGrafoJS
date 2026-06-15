// ═══════════════════════════════════════════════════════════════
// DETECTOR DE MONEY MULE — versão terminal (Node.js)
// Para rodar: abra o terminal na pasta do arquivo e execute:
//   node money-mule-node.js
// ═══════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────
// PARTE 1 — DADOS SIMULADOS
// Mesma estrutura do HTML: array de nós e array de arestas.
// ─────────────────────────────────────────────────────────────

// Array de objetos: cada objeto é uma conta bancária
const nos = [
  { id: "C001", rotulo: "Conta 001", tipo: "origem" },
  { id: "C002", rotulo: "Conta 002", tipo: "origem" },
  { id: "C003", rotulo: "Conta 003", tipo: "origem" },
  { id: "C004", rotulo: "Conta 004", tipo: "mule" },   // suspeita
  { id: "C005", rotulo: "Conta 005", tipo: "mule" },   // suspeita
  { id: "C006", rotulo: "Conta 006", tipo: "destino" },
  { id: "C007", rotulo: "Conta 007", tipo: "destino" },
  { id: "C008", rotulo: "Conta 008", tipo: "normal" },
]

// Array de objetos: cada objeto é uma transferência entre contas
const arestas = [
  { de: "C001", para: "C004", valor: 8000  },
  { de: "C002", para: "C004", valor: 6000  },
  { de: "C003", para: "C004", valor: 5000  },
  { de: "C004", para: "C006", valor: 17500 }, // C004 repassou quase tudo
  { de: "C001", para: "C005", valor: 4000  },
  { de: "C003", para: "C005", valor: 9000  },
  { de: "C005", para: "C007", valor: 12500 }, // C005 repassou quase tudo
  { de: "C008", para: "C006", valor: 1000  }, // transação normal
]


// ─────────────────────────────────────────────────────────────
// PARTE 2 — ALGORITMO DE DETECÇÃO
// Idêntico ao do HTML. O algoritmo em si não muda —
// só a forma de exibir o resultado é diferente (terminal x grafo visual).
// ─────────────────────────────────────────────────────────────

// Objeto vazio que vai guardar as métricas de cada conta
const metricas = {}

// PASSO 1: Inicializa métricas zeradas para cada nó
// for...of percorre cada item do array "nos"
for (const no of nos) {
  metricas[no.id] = {       // cria uma entrada no dicionário com o id como chave
    rotulo: no.rotulo,      // nome da conta (para exibir no terminal)
    grauEntrada: 0,         // quantas contas enviam dinheiro pra ela
    grauSaida: 0,           // quantas contas ela envia dinheiro
    totalRecebido: 0,       // soma de tudo que recebeu
    totalEnviado: 0,        // soma de tudo que enviou
    score: 0,               // pontuação de suspeição (calculada no passo 3)
    suspeita: false,        // resultado final: suspeita ou não
  }
}

// PASSO 2: Percorre todas as arestas e acumula métricas nos dois lados
for (const aresta of arestas) {

  // Lado que ENVIOU (aresta.de): aumenta grau de saída e total enviado
  metricas[aresta.de].grauSaida += 1          // += é atalho para grauSaida = grauSaida + 1
  metricas[aresta.de].totalEnviado += aresta.valor

  // Lado que RECEBEU (aresta.para): aumenta grau de entrada e total recebido
  metricas[aresta.para].grauEntrada += 1
  metricas[aresta.para].totalRecebido += aresta.valor
}

// PASSO 3: Calcula o score e marca as suspeitas
// for...in percorre as CHAVES de um objeto (ao contrário do for...of que percorre arrays)
for (const id in metricas) {
  const m = metricas[id]  // atalho: "m" representa metricas[id]

  // Taxa de retenção: quanto do dinheiro recebido ficou na conta
  // Operador ternário: condição ? valor_se_verdadeiro : valor_se_falso
  const taxaRetencao = m.totalRecebido > 0
    ? (m.totalRecebido - m.totalEnviado) / m.totalRecebido
    : 1  // se nunca recebeu, consideramos retenção total (não suspeita)

  // Fórmula do score:
  // (1 - taxaRetencao): quanto menor a retenção, maior esse valor
  // * 50: peso maior para o fator de retenção
  // + (grauEntrada + grauSaida) * 5: muitas conexões também aumentam o score
  // Math.round(): arredonda para número inteiro
  m.score = Math.round((1 - taxaRetencao) * 50 + (m.grauEntrada + m.grauSaida) * 5)

  // Conta é suspeita se score passar de 40
  m.suspeita = m.score > 40
}


// ─────────────────────────────────────────────────────────────
// PARTE 3 — EXIBIÇÃO NO TERMINAL
// Aqui usamos console.log() para imprimir os resultados formatados.
// Não há grafo visual — tudo é texto.
// ─────────────────────────────────────────────────────────────

// Função auxiliar: formata um número como moeda brasileira
// Exemplo: 17500 → "R$ 17.500"
// .toLocaleString("pt-BR") aplica a formatação do Brasil automaticamente
function brl(valor) {
  return `R$ ${valor.toLocaleString("pt-BR")}`
}

// Função auxiliar: cria uma linha de separação no terminal
// char.repeat(tamanho) repete o caractere N vezes
// Exemplo: linha("─", 10) → "──────────"
// O parâmetro "= 52" define um valor padrão caso não seja passado nenhum
function linha(char = "─", tamanho = 52) {
  return char.repeat(tamanho)
}

// ── Cabeçalho ──
// "\n" dentro de uma string representa uma quebra de linha
console.log("\n" + linha("═"))
console.log("   DETECTOR DE MONEY MULE — Análise de Grafos")
console.log(linha("═"))

// nos.length = quantidade de itens no array "nos" (8 contas)
// arestas.length = quantidade de itens no array "arestas" (8 transações)
console.log(`\n📊 Analisando ${nos.length} contas e ${arestas.length} transações...\n`)
console.log(linha())

// ── Resultados por conta ──
for (const id in metricas) {
  const m = metricas[id]

  // Recalcula a taxa de retenção em % para exibir
  // .toFixed(1) formata com 1 casa decimal: ex → "5.3"
  const taxaRetencao = m.totalRecebido > 0
    ? ((m.totalRecebido - m.totalEnviado) / m.totalRecebido * 100).toFixed(1)
    : "100.0"

  // Define ícone e texto de status baseado em se é suspeita ou não
  const icone = m.suspeita ? "⚠️ " : "✅"
  const status = m.suspeita ? "SUSPEITA" : "Normal  "

  // .padEnd(12) preenche com espaços até ter 12 caracteres — alinha o texto
  // String(...).padStart(3) preenche com espaços no início — alinha números
  console.log(`${icone} ${m.rotulo.padEnd(12)} | Score: ${String(m.score).padStart(3)} | ${status}`)

  // Se a conta for suspeita, exibe os detalhes logo abaixo
  // "↳" é só um caractere visual para indicar que é um detalhe da linha acima
  if (m.suspeita) {
    console.log(`   ↳ Entradas: ${m.grauEntrada} conta(s) | Saídas: ${m.grauSaida} conta(s)`)
    console.log(`   ↳ Recebido: ${brl(m.totalRecebido)} | Enviado: ${brl(m.totalEnviado)} | Reteve: ${taxaRetencao}%`)
  }

  console.log(linha()) // linha separadora entre cada conta
}

// ── Resumo final ──
// Object.values(metricas) transforma o objeto "metricas" em um array com só os valores
// (sem as chaves/ids) — assim podemos usar .filter() nele
// .filter(m => m.suspeita) retorna apenas os itens onde suspeita === true
const suspeitas = Object.values(metricas).filter(m => m.suspeita)

console.log(`\n🔎 RESUMO: ${suspeitas.length} conta(s) suspeita(s) de ${nos.length} analisadas.`)
console.log(linha("═") + "\n")
