const mysqlConn = require("../base/database");

async function inserir(DATA, CATEGORIA, DESCRICAO, NOME_NO_EXTRATO, TIPO, VALOR, id_banco, id_empresa, id_fornecedor){
    if(!id_fornecedor){
        id_fornecedor = null;
    }
    const parameters = [DATA, CATEGORIA, DESCRICAO, NOME_NO_EXTRATO, TIPO, VALOR, id_banco, id_empresa, id_fornecedor];
    console.log(parameters);

    try {
        const result = await mysqlConn.execute(
            `INSERT INTO EXTRATO (IDEXTRATO, DATA, CATEGORIA, DESCRICAO, NOME_NO_EXTRATO, TIPO_DE_TRANSACAO, VALOR, ID_BANCO, ID_CLIENTE, ID_FORNECEDOR)
             VALUES (null,?,?,?,?,?,?,?,?,?)`,
            parameters
        );

    } catch (error) {
        console.error(`Erro ao inserir dados: ${error.message}`);
        throw error;
    }
}

function buscarBanco(idcliente, callback){
    mysqlConn.query(`SELECT B.IDBANCO, CONCAT(B.NOME, ' - ' ,B.TIPO) AS NOME_TIPO FROM BANCO B 
                     INNER JOIN RELACAOCLIENTEBANCO R ON B.IDBANCO = R.ID_BANCO
                     WHERE R.ID_CLIENTE = ?`, [idcliente], function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function buscarUltimasInsercoes(idcliente, callback) {
    console.log(idcliente);
    const query = `
        SELECT IDEXTRATO, DATA, CATEGORIA, DESCRICAO, NOME_NO_EXTRATO, TIPO_DE_TRANSACAO, VALOR, CONCAT(B.NOME, ' - ', B.TIPO) AS NOME_BANCO, C.NOME AS NOME_CLIENTE,
        F.NOME AS NOME_FORNECEDOR
        FROM EXTRATO
        INNER JOIN BANCO B ON EXTRATO.ID_BANCO = B.IDBANCO
        INNER JOIN CLIENTE C ON EXTRATO.ID_CLIENTE = C.IDCLIENTE
        LEFT JOIN FORNECEDOR F ON EXTRATO.ID_FORNECEDOR = F.IDFORNECEDOR
        WHERE EXTRATO.ID_CLIENTE = ?
        ORDER BY EXTRATO.IDEXTRATO DESC LIMIT 6`;

    mysqlConn.query(query, idcliente,function(err, result, fields) {
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

function buscarCategorias(IDCLIENTE, callback) {
    mysqlConn.query(
        `SELECT C.IDCATEGORIA AS IDCATEGORIA, C.NOME AS NOME, C.ID_CATEGORIA_PAI AS ID_CATEGORIA_PAI 
        FROM CATEGORIA C
        INNER JOIN RELACAOCLIENTECATEGORIA RCC ON C.IDCATEGORIA = RCC.ID_CATEGORIA
        WHERE RCC.ID_CLIENTE = ?`, [IDCLIENTE],
        function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}

function deletarExtrato(idExtrato, callback) {
    let query;
    let params;

    if (Array.isArray(idExtrato) && idExtrato.length > 0) {
        const placeholders = idExtrato.map(() => '?').join(', ');
        query = `DELETE FROM EXTRATO WHERE IDEXTRATO IN (${placeholders})`;
        params = idExtrato;
    } else {
        query = `DELETE FROM EXTRATO WHERE IDEXTRATO = ?`;
        params = [idExtrato];
    }

    mysqlConn.query(query, params, function(err, result) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

module.exports = { inserir, buscarBanco, buscarUltimasInsercoes, buscarIDEmpresa, buscarCategorias, deletarExtrato };