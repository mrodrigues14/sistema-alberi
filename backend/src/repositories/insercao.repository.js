const mysqlConn = require("../base/database");

async function inserir(data, categoria, nome_extrato, tipo, valor, id_banco){
    console.log(data, categoria, nome_extrato, tipo, valor, id_banco);
    data = data !== undefined ? data : null;
    categoria = categoria !== undefined ? categoria : null;
    nome_extrato = nome_extrato !== undefined ? nome_extrato : null;
    tipo = tipo !== undefined ? tipo : null;
    valor = valor !== undefined ? valor : null;
    id_banco = id_banco !== undefined ? id_banco : null;
    console.log(data, categoria, nome_extrato, tipo, valor, id_banco);

    const result = await mysqlConn.execute(
        `INSERT INTO EXTRATO (idExtrato, data, categoria, nomeNoExtrato, tipoDeTransacao, valor, FK_BANCO_idBanco) VALUES (null,?,?,?,?,?,?)`,
        [data, categoria, nome_extrato, tipo, valor, id_banco]
    );
}

function buscarBanco(callback){
    mysqlConn.query(`SELECT IDBANCO, NOME FROM BANCO`, function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}


module.exports = { inserir, buscarBanco };