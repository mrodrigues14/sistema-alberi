const mysqlConn = require("../base/database");

function buscar(banco, data, cliente, callback){
    const dataProximoMes = new Date(data);
    dataProximoMes.setMonth(dataProximoMes.getMonth() + 1);

    const parametros = [banco, data, dataProximoMes.toISOString().split('T')[0], cliente];

    mysqlConn.query(`SELECT IDEXTRATO, DATA, CATEGORIA, DESCRICAO, NOME_NO_EXTRATO, TIPO_DE_TRANSACAO, VALOR, 
                    CONCAT(B.NOME, ' - ', B.TIPO) AS NOME_BANCO, C.NOME AS NOME_CLIENTE, F.NOME AS NOME_FORNECEDOR
                    FROM EXTRATO
                    INNER JOIN BANCO B ON EXTRATO.ID_BANCO = B.IDBANCO
                    INNER JOIN CLIENTE C ON EXTRATO.ID_CLIENTE = C.IDCLIENTE
                    LEFT JOIN FORNECEDOR F ON EXTRATO.ID_FORNECEDOR = F.IDFORNECEDOR
                    WHERE ID_BANCO = ? AND DATA >= ? AND DATA < ? AND ID_CLIENTE = ?`, parametros,
        function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function extratoAEditar(id, callback) {
    mysqlConn.query(`SELECT IDEXTRATO, DATA, CATEGORIA, DESCRICAO, NOME_NO_EXTRATO, TIPO_DE_TRANSACAO, VALOR,
                    CONCAT(B.NOME, ' - ', B.TIPO) AS NOME_BANCO, C.NOME AS NOME_CLIENTE, F.NOME AS NOME_FORNECEDOR
                    FROM EXTRATO
                    INNER JOIN BANCO B ON EXTRATO.ID_BANCO = B.IDBANCO
                    INNER JOIN CLIENTE C ON EXTRATO.ID_CLIENTE = C.IDCLIENTE
                    LEFT JOIN FORNECEDOR F ON EXTRATO.ID_FORNECEDOR = F.IDFORNECEDOR
                    WHERE IDEXTRATO = ?`, [id],
        function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function editarExtrato(id, data, categoria, descricao, nome_no_extrato, tipo, valor, callback) {
    mysqlConn.query(`UPDATE EXTRATO SET DATA = ?, CATEGORIA = ?, DESCRICAO = ?, NOME_NO_EXTRATO = ?, TIPO_DE_TRANSACAO = ?, VALOR = ? WHERE IDEXTRATO = ?`,
        [data, categoria, descricao, nome_no_extrato, tipo, valor, id],
        function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

module.exports = {buscar, extratoAEditar, editarExtrato};