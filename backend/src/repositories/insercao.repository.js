const mysqlConn = require("../base/database");

async function inserir(DATA, CATEGORIA, DESCRICAO, NOME_NO_EXTRATO, TIPO, VALOR, id_banco, id_empresa){
    try {
        const result = await mysqlConn.execute(
            `INSERT INTO EXTRATO (IDEXTRATO, DATA, CATEGORIA, DESCRICAO, NOME_NO_EXTRATO, TIPO_DE_TRANSACAO, VALOR, ID_BANCO, id_cliente) VALUES (null,?,?,?,?,?,?,?,?)`,
            [DATA, CATEGORIA, DESCRICAO, NOME_NO_EXTRATO, TIPO, VALOR,id_banco, id_empresa]
        );

    } catch (error) {
        console.error(`Erro ao inserir dados: ${error.message}`);
        throw error;
    }

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
        SELECT DATA, CATEGORIA, DESCRICAO, NOME_NO_EXTRATO, TIPO_DE_TRANSACAO, VALOR, B.NOME AS NOME_BANCO, C.NOME AS NOME_CLIENTE
        FROM EXTRATO
        INNER JOIN BANCO B ON EXTRATO.ID_BANCO = B.IDBANCO
        INNER JOIN CLIENTE C ON EXTRATO.ID_CLIENTE = C.IDCLIENTE
        ORDER BY EXTRATO.IDEXTRATO DESC LIMIT 7`;

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
        `SELECT IDCATEGORIA, NOME, ID_CATEGORIA_PAI FROM CATEGORIA`,
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