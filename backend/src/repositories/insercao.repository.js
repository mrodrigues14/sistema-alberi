const mysqlConn = require("../base/database");

async function inserir(data, categoria, nome_extrato, tipo, valor, id_banco, id_empresa){
    console.log(data, categoria, nome_extrato, tipo, valor, id_banco);
    data = data !== undefined ? data : null;
    categoria = categoria !== undefined ? categoria : null;
    nome_extrato = nome_extrato !== undefined ? nome_extrato : null;
    tipo = tipo !== undefined ? tipo : null;
    valor = valor !== undefined ? valor : null;
    id_banco = id_banco !== undefined ? id_banco : null;
    console.log(data, categoria, nome_extrato, tipo, valor, id_banco);

    const result = await mysqlConn.execute(
        `INSERT INTO EXTRATO (idExtrato, data, categoria, nomeNoExtrato, tipoDeTransacao, valor, FK_BANCO_idBanco, id_cliente) VALUES (null,?,?,?,?,?,?,?)`,
        [data, categoria, nome_extrato, tipo, valor, id_banco, id_empresa]
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

function buscarUltimasInsercoes(callback) {
    const query = `
        SELECT DATA, CATEGORIA, NOMENOEXTRATO, TIPODETRANSACAO, VALOR, B.NOME AS NOME_BANCO, C.NOME AS NOME_CLIENTE
        FROM EXTRATO
        INNER JOIN BANCO B ON EXTRATO.FK_BANCO_IDBANCO = B.IDBANCO
        INNER JOIN CLIENTE C ON EXTRATO.ID_CLIENTE = C.IDCLIENTE
        ORDER BY EXTRATO.idExtrato DESC LIMIT 5`;

    mysqlConn.query(query, function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}


function buscarIDEmpresa(nomeEmpresa, callback) {
    mysqlConn.query(
        `SELECT IDCLIENTE FROM CLIENTE WHERE NOME = ?`,
        [nomeEmpresa],
        function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}

function buscarCategorias(callback) {
    mysqlConn.query(
        `SELECT CATEGORIA FROM CATEGORIA`,
        function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}

module.exports = { inserir, buscarBanco, buscarUltimasInsercoes, buscarIDEmpresa, buscarCategorias };