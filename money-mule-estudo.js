// ═══════════════════════════════════════════════════════════════
// DETECTOR DE MONEY MULE — código JS comentado para estudo
// ═══════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────
// PARTE 1 — DADOS SIMULADOS
// Aqui criamos os "dados falsos" que representam contas e transferências.
// Em um sistema real, esses dados viriam de um banco de dados.
// ─────────────────────────────────────────────────────────────

// Array de nós: cada objeto representa uma conta bancária
// Um array em JS é uma lista, declarada com colchetes []
// Cada item da lista é um objeto, declarado com chaves {}
const nos = [
  { id: "C001", rotulo: "Conta 001", tipo: "origem" },  // conta que origina o dinheiro
  { id: "C002", rotulo: "Conta 002", tipo: "origem" },
  { id: "C003", rotulo: "Conta 003", tipo: "origem" },
  { id: "C004", rotulo: "Conta 004", tipo: "mule" },    // suspeita de ser money mule
  { id: "C005", rotulo: "Conta 005", tipo: "mule" },    // suspeita de ser money mule
  { id: "C006", rotulo: "Conta 006", tipo: "destino" }, // recebe o dinheiro no fim
  { id: "C007", rotulo: "Conta 007", tipo: "destino" },
  { id: "C008", rotulo: "Conta 008", tipo: "normal" },  // conta comum sem suspeita
]

// Array de arestas: cada objeto representa uma transferência entre duas contas
// "de" = quem enviou | "para" = quem recebeu | "valor" = quanto | "tempo" = quando
const arestas = [
  { de: "C001", para: "C004", valor: 8000,  tempo: 1 },
  { de: "C002", para: "C004", valor: 6000,  tempo: 2 },
  { de: "C003", para: "C004", valor: 5000,  tempo: 3 },
  { de: "C004", para: "C006", valor: 17500, tempo: 4 }, // C004 repassou quase tudo que recebeu
  { de: "C001", para: "C005", valor: 4000,  tempo: 2 },
  { de: "C003", para: "C005", valor: 9000,  tempo: 3 },
  { de: "C005", para: "C007", valor: 12500, tempo: 5 }, // C005 repassou quase tudo que recebeu
  { de: "C008", para: "C006", valor: 1000,  tempo: 1 }, // transação normal
]


// ─────────────────────────────────────────────────────────────
// PARTE 2 — ALGORITMO DE DETECÇÃO
// Aqui calculamos as métricas de cada conta para identificar suspeitas.
// ─────────────────────────────────────────────────────────────

// Criamos um objeto vazio que vai funcionar como um "dicionário"
// A chave será o id da conta (ex: "C001") e o valor serão as métricas dela
const metricas = {} // {} sem nada dentro = objeto vazio

// PASSO 1: Inicializar métricas zeradas para cada conta
// "for...of" percorre cada item de um array, um por vez
// A cada volta, a variável "no" recebe o próximo objeto do array "nos"
for (const no of nos) {
  metricas[no.id] = {         // cria uma entrada no dicionário usando o id como chave
    rotulo: no.rotulo,        // guarda o nome da conta para usar depois
    grauEntrada: 0,           // contador: quantas contas enviam dinheiro para ela
    grauSaida: 0,             // contador: quantas contas ela envia dinheiro
    totalRecebido: 0,         // acumulador: soma de todos os valores recebidos
    totalEnviado: 0,          // acumulador: soma de todos os valores enviados
    score: 0,                 // pontuação de suspeição (será calculada no passo 3)
    suspeita: false           // false = não suspeita; true = suspeita
  }
}

// PASSO 2: Percorrer todas as arestas e acumular as métricas
// Cada aresta afeta DOIS nós ao mesmo tempo: quem enviou e quem recebeu
for (const aresta of arestas) {

  // O lado que ENVIOU (aresta.de):
  // += 1 significa "some 1 ao valor atual" — é um atalho para escrever:
  // metricas[aresta.de].grauSaida = metricas[aresta.de].grauSaida + 1
  metricas[aresta.de].grauSaida += 1
  metricas[aresta.de].totalEnviado += aresta.valor

  // O lado que RECEBEU (aresta.para):
  metricas[aresta.para].grauEntrada += 1
  metricas[aresta.para].totalRecebido += aresta.valor
}

// PASSO 3: Calcular o score de suspeição e marcar as contas suspeitas
// "for...in" percorre as CHAVES de um objeto (diferente de for...of que percorre arrays)
// Como "metricas" é um objeto/dicionário, usamos for...in para acessar cada id
for (const id in metricas) {
  const m = metricas[id] // atalho: em vez de escrever metricas[id] toda hora, usamos "m"

  // Taxa de retenção: que porcentagem do dinheiro recebido ficou na conta?
  // Exemplo: recebeu 10000, enviou 9500 → ficou com 500 → retenção = 500/10000 = 0.05 (5%)
  // O operador ternário "? :" é um if resumido:
  //   condição ? valor_se_verdadeiro : valor_se_falso
  const taxaRetencao = m.totalRecebido > 0
    ? (m.totalRecebido - m.totalEnviado) / m.totalRecebido
    : 1 // se a conta nunca recebeu dinheiro, consideramos retenção de 100% (não suspeita)

  // Fórmula do score:
  // (1 - taxaRetencao): quanto menor a retenção, mais próximo de 1 → mais suspeito
  // Multiplicamos por 50 para dar peso maior a esse fator
  // Somamos as conexões (grauEntrada + grauSaida) * 5
  // Math.round() arredonda o resultado para número inteiro
  m.score = Math.round((1 - taxaRetencao) * 50 + (m.grauEntrada + m.grauSaida) * 5)

  // Se o score for maior que 40, marcamos como suspeita
  // Esse valor de 40 é o "threshold" (limiar) — pode ser ajustado conforme necessário
  m.suspeita = m.score > 40
}


// ─────────────────────────────────────────────────────────────
// PARTE 3 — MONTAGEM VISUAL (usa a biblioteca vis-network)
// Esta parte transforma nossos dados no formato que a biblioteca entende
// para desenhar o grafo no navegador.
// ─────────────────────────────────────────────────────────────

// Paleta de cores para cada tipo de conta
// Cada entrada tem cor de fundo e cor da borda do nó no grafo
const cores = {
  suspeita: { fundo: "#ef4444", borda: "#b91c1c" }, // vermelho
  normal:   { fundo: "#3b82f6", borda: "#1d4ed8" }, // azul
  origem:   { fundo: "#a855f7", borda: "#7e22ce" }, // roxo
  destino:  { fundo: "#f59e0b", borda: "#b45309" }, // amarelo
}

// .map() é um método de array que transforma cada item em outro formato
// Aqui transformamos cada nó do nosso formato para o formato que a vis-network espera
const nosVisuais = nos.map(no => {
  const m = metricas[no.id]

  // Decide a cor: se o algoritmo marcou como suspeita, usa vermelho
  // Senão, usa a cor correspondente ao tipo da conta (origem, destino, normal)
  // O "||" significa "ou": se cores[no.tipo] não existir, usa cores.normal como padrão
  const cor = m.suspeita ? cores.suspeita : cores[no.tipo] || cores.normal

  // Retorna o objeto no formato que a biblioteca vis-network espera
  return {
    id: no.id,
    label: no.rotulo + (m.suspeita ? "\n⚠️ SUSPEITA" : ""), // adiciona aviso se suspeita
    color: { background: cor.fundo, border: cor.borda },
    font: { color: "#ffffff", size: 13 },
    size: 28,
    borderWidth: m.suspeita ? 3 : 1, // borda mais grossa para contas suspeitas
  }
})

// Transforma cada aresta para o formato da vis-network
const arestasVisuais = arestas.map(a => ({
  from: a.de,
  to: a.para,
  label: `R$ ${a.valor.toLocaleString("pt-BR")}`, // formata o número com separador de milhar
  arrows: "to",  // desenha uma seta na ponta da aresta indicando direção
  color: { color: "#475569" },
  font: { color: "#94a3b8", size: 11, align: "middle" },
  smooth: { type: "curvedCW", roundness: 0.2 } // deixa as arestas levemente curvadas
}))

// Inicializa o grafo na div com id="grafo" do HTML
// new vis.Network(elemento_html, dados, opcoes)
const rede = new vis.Network(
  document.getElementById("grafo"),       // onde desenhar
  { nodes: nosVisuais, edges: arestasVisuais }, // os dados
  { physics: { stabilization: true }, interaction: { hover: true } } // opções
)


// ─────────────────────────────────────────────────────────────
// PARTE 4 — PAINEL LATERAL (lista de contas)
// Cria dinamicamente os itens da lista no HTML usando JavaScript
// ─────────────────────────────────────────────────────────────

// Seleciona o elemento HTML com id="lista-contas" para inserir os itens dentro dele
const listaEl = document.getElementById("lista-contas")

for (const no of nos) {
  const m = metricas[no.id]

  // document.createElement cria um novo elemento HTML (aqui, uma <div>)
  const item = document.createElement("div")

  // Define a classe CSS do elemento (para aplicar os estilos do CSS)
  // Se a conta for suspeita, adiciona também a classe "suspeita" que muda a cor
  item.className = "conta-item" + (m.suspeita ? " suspeita" : "")

  // innerHTML define o conteúdo HTML interno do elemento
  // Template literal (crase `) permite inserir variáveis JS dentro do texto com ${...}
  item.innerHTML = `
    <span>${no.rotulo}</span>
    <span class="badge ${m.suspeita ? "suspeita" : "normal"}">
      ${m.suspeita ? "Suspeita" : "Normal"}
    </span>
  `

  // addEventListener: "ouça" o evento de clique neste elemento
  // Quando o usuário clicar, executa a função mostrarDetalhe passando o id da conta
  item.addEventListener("click", () => mostrarDetalhe(no.id))

  // Insere o elemento criado dentro da lista no HTML
  listaEl.appendChild(item)
}


// ─────────────────────────────────────────────────────────────
// PARTE 5 — FUNÇÃO DE DETALHE
// Exibe as métricas detalhadas de uma conta quando clicada
// ─────────────────────────────────────────────────────────────

// "function" declara uma função reutilizável
// "id" é o parâmetro: o valor que passamos ao chamar a função
function mostrarDetalhe(id) {
  const m = metricas[id]

  // Recalcula a taxa de retenção em percentual para exibir
  const taxaRetencao = m.totalRecebido > 0
    ? ((m.totalRecebido - m.totalEnviado) / m.totalRecebido * 100).toFixed(1)
    : 100 // .toFixed(1) formata o número com 1 casa decimal

  // Atualiza o HTML do painel de detalhe com as informações da conta
  document.getElementById("detalhe").innerHTML = `
    <strong>${m.rotulo}</strong><br><br>
    Grau de entrada: <strong>${m.grauEntrada}</strong><br>
    Grau de saída: <strong>${m.grauSaida}</strong><br>
    Total recebido: <strong>R$ ${m.totalRecebido.toLocaleString("pt-BR")}</strong><br>
    Total enviado: <strong>R$ ${m.totalEnviado.toLocaleString("pt-BR")}</strong><br>
    Taxa de retenção: <strong>${taxaRetencao}%</strong><br>
    Score de suspeição: <strong>${m.score}</strong><br><br>
    Resultado: <strong style="color:${m.suspeita ? '#ef4444' : '#22c55e'}">
      ${m.suspeita ? "⚠️ CONTA SUSPEITA" : "✅ Conta Normal"}
    </strong>
  `

  // Destaca o nó no grafo e centraliza a câmera nele com animação
  rede.selectNodes([id])             // seleciona o nó pelo id
  rede.focus(id, { scale: 1.2, animation: true }) // zoom suave no nó
}

// Quando o usuário clicar diretamente num nó do grafo, também chama mostrarDetalhe
// params.nodes é um array com os ids dos nós clicados (pode ser vazio se clicou no vazio)
rede.on("click", params => {
  if (params.nodes.length > 0) {      // verifica se clicou em algum nó
    mostrarDetalhe(params.nodes[0])   // pega o primeiro nó clicado
  }
})
