const nos = [
  { id: "C001", rotulo: "Conta 001", tipo: "origem" },
  { id: "C002", rotulo: "Conta 002", tipo: "origem" },
  { id: "C003", rotulo: "Conta 003", tipo: "origem" },
  { id: "C004", rotulo: "Conta 004", tipo: "mule" },
  { id: "C005", rotulo: "Conta 005", tipo: "mule" },
  { id: "C006", rotulo: "Conta 006", tipo: "destino" },
  { id: "C007", rotulo: "Conta 007", tipo: "destino" },
  { id: "C008", rotulo: "Conta 008", tipo: "normal" },
]

const arestas = [
  { de: "C001", para: "C004", valor: 8000  },
  { de: "C002", para: "C004", valor: 6000  },
  { de: "C003", para: "C004", valor: 5000  },
  { de: "C004", para: "C006", valor: 17500 },
  { de: "C001", para: "C005", valor: 4000  },
  { de: "C003", para: "C005", valor: 9000  },
  { de: "C005", para: "C007", valor: 12500 },
  { de: "C008", para: "C006", valor: 1000  },
]

const metricas = {}

for (const no of nos) {
  metricas[no.id] = {
    rotulo: no.rotulo,
    grauEntrada: 0,
    grauSaida: 0,
    totalRecebido: 0,
    totalEnviado: 0,
    score: 0,
    suspeita: false,
  }
}

for (const aresta of arestas) {
  metricas[aresta.de].grauSaida += 1
  metricas[aresta.de].totalEnviado += aresta.valor
  metricas[aresta.para].grauEntrada += 1
  metricas[aresta.para].totalRecebido += aresta.valor
}

for (const id in metricas) {
  const m = metricas[id]

  const taxaRetencao = m.totalRecebido > 0
    ? (m.totalRecebido - m.totalEnviado) / m.totalRecebido
    : 1

  m.score = Math.round((1 - taxaRetencao) * 50 + (m.grauEntrada + m.grauSaida) * 5)
  m.suspeita = m.score > 40
}

function brl(valor) {
  return `R$ ${valor.toLocaleString("pt-BR")}`
}

function linha(char = "─", tamanho = 52) {
  return char.repeat(tamanho)
}

console.log("\n" + linha("═"))
console.log("   DETECTOR DE MONEY MULE — Análise de Grafos")
console.log(linha("═"))
console.log(`\n📊 Analisando ${nos.length} contas e ${arestas.length} transações...\n`)
console.log(linha())

for (const id in metricas) {
  const m = metricas[id]

  const taxaRetencao = m.totalRecebido > 0
    ? ((m.totalRecebido - m.totalEnviado) / m.totalRecebido * 100).toFixed(1)
    : "100.0"

  const icone = m.suspeita ? "⚠️ " : "✅"
  const status = m.suspeita ? "SUSPEITA" : "Normal  "

  console.log(`${icone} ${m.rotulo.padEnd(12)} | Score: ${String(m.score).padStart(3)} | ${status}`)

  if (m.suspeita) {
    console.log(`   ↳ Entradas: ${m.grauEntrada} conta(s) | Saídas: ${m.grauSaida} conta(s)`)
    console.log(`   ↳ Recebido: ${brl(m.totalRecebido)} | Enviado: ${brl(m.totalEnviado)} | Reteve: ${taxaRetencao}%`)
  }

  console.log(linha())
}

const suspeitas = Object.values(metricas).filter(m => m.suspeita)
console.log(`\n🔎 RESUMO: ${suspeitas.length} conta(s) suspeita(s) de ${nos.length} analisadas.`)
console.log(linha("═") + "\n")
