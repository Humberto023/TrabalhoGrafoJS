const nos = [
    {id: "C001", nome:"Conta001", tipo:"Origem"},
    {id: "C002", nome:"Conta002", tipo:"Origem"},
    {id: "C003", nome:"Conta003", tipo:"Origem"},
    {id: "C004", nome:"Conta004", tipo:"mule"},//suspeita
    {id: "C005", nome:"Conta005", tipo:"mule"}, //suspeita
    {id: "C006", nome:"Conta006", tipo:"destino"},
    {id: "C007", nome:"Conta007", tipo:"destino"},
    {id: "C008", nome:"Conta008", tipo:"normal"}, //conta sem suspeita
]

// Array de arestas: cada objeto representa uma transferência entre duas contas
// "de" = quem enviou | "para" = quem recebeu | "valor" = quanto | "tempo" = quando
const arestas = [
    {de:"C001", para:"C004", valor: 8000, tempo:1}, //o tempo é quando a transação ocorreu, está com numeros pequenos para simplifcar 
    {de:"C002", para:"C004", valor: 6000, tempo:2},
    {de:"C003", para:"C004", valor: 5000, tempo:3},
    {de:"C004", para:"C006", valor: 17500, tempo:4},//c002 repassou todo valor que tinha para 006
    {de:"C001", para:"C005", valor: 4000, tempo:2},
    {de:"C003", para:"C005", valor: 9000, tempo:3},
    {de:"C005", para:"C007", valor: 12500, tempo:5},//c005 repassou quase tudo qeu tinha
    {de:"C008", para:"C006", valor: 1000, tempo:1},

]

//Calculo para identificar as contas que são suspeitas; Lembrando, to digitando para que vocês possam saber o que foi feito e como o código está funcionando


const metricas = {} //objetoi vazio para servir como um dicionario

for ( const no of nos){
    metricas[no.id] = {           // cria uma entrada no dicionário usando o id como chave
        nome: no.nome,            // guarda o nome da conta para usar depois
        grauEntrada: 0,           // contador: quantas contas enviam dinheiro para ela
        grauSaida: 0,             // contador: quantas contas ela envia dinheiro
        totalRecebido: 0,         // acumulador: soma de todos os valores recebidos
        totalEnviado: 0,          // acumulador: soma de todos os valores enviados
        score: 0,                 // pontuação de suspeição (será calculada no passo 3)
        suspeita: false    
    }
}

//Acumlador das métricas das arestas

for (const aresta of arestas) {

  // LADO QUE ENVIOU (aresta.de)
  metricas[aresta.de].grauSaida += 1          // conta mais uma saída para quem enviou
  metricas[aresta.de].totalEnviado += aresta.valor  // soma o valor transferido ao total enviado

  // LADO QUE RECEBEU (aresta.para)
  metricas[aresta.para].grauEntrada += 1        // conta mais uma entrada para quem recebeu
  metricas[aresta.para].totalRecebido += aresta.valor // soma o valor transferido ao total recebido

}

//calcular o score para definir o quão suspeita é aqueal conta

for(const id in metricas) {
    const m = metricas[id] //So para facilitar, inves de escreves metricas iremos colocar apenas m
    

  //Não sei se já utilizaram operador ternario então vou colocar de toda forma e explicar 
  // Taxa de retenção: que porcentagem do dinheiro recebido ficou na conta?
  // Exemplo: recebeu 10000, enviou 9500 → ficou com 500 → retenção = 500/10000 = 0.05 (5%)
  // O operador ternário "? :" é um if resumido:
  //   condição ? valor_se_verdadeiro : valor_se_falso
    const taxaRetencao = m.totalRecebido > 0 ? (m.totalRecebido - m.totalEnviado)/m.totalRecebido : 1 // se a conta nunca recebeu dinheiro, consideramos retenção de 100% (não suspeita)
//Vamos para a formula do score, quanto menor a retenção, mais proximo de 1, mais suspeito será]
// Multiplicamos por 50 para dar peso maior a esse fator
// Somamos as conexões (grauEntrada + grauSaida) * 5
// Math.round() arredonda o resultado para número inteiro

m.score = Math.round((1-taxaRetencao) * 50 + (m.grauEntrada + m.grauSaida)*5 )

//Se for menor que 40, será suspeita

m.suspeita = m.score > 40 
    
    
}
