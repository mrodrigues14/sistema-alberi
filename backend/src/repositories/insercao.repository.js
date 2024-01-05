const mysqlConn = require("../base/database");

async function inserir(data, categoria, nome_extrato, tipo, valor){
    console.log(data, categoria, nome_extrato, tipo, valor);
    data = data !== undefined ? data : null;
    categoria = categoria !== undefined ? categoria : null;
    nome_extrato = nome_extrato !== undefined ? nome_extrato : null;
    tipo = tipo !== undefined ? tipo : null;
    valor = valor !== undefined ? valor : null;
    console.log(data, categoria, nome_extrato, tipo, valor);

    const result = await mysqlConn.execute(
        `INSERT INTO EXTRATO (idExtrato, data, categoria, nomeNoExtrato, tipoDeTransacao, valor) VALUES (null,?,?,?,?,?)`,
        [data, categoria, nome_extrato, tipo, valor]
    );
}

async function buscarBanco(){
    const [result] = await mysqlConn.query(`SELECT NOME FROM BANCO`);
    return result;
}


module.exports = { inserir, buscarBanco };