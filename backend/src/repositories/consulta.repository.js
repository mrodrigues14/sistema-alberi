const mysqlConn = require("../base/database");

function buscar(banco, data, cliente, callback) {
    const dataProximoMes = new Date(data);
    dataProximoMes.setMonth(dataProximoMes.getMonth() + 2);
    dataProximoMes.setDate(0);

    const parametros = [banco, data, dataProximoMes.toISOString().split('T')[0], cliente];

    mysqlConn.query(`SELECT IDEXTRATO, DATA, CAT.NOME AS CATEGORIA, IFNULL(SUBCAT.NOME, '') AS SUBCATEGORIA, DESCRICAO, NOME_NO_EXTRATO, TIPO_DE_TRANSACAO, VALOR, 
                    CONCAT(B.NOME, ' - ', B.TIPO) AS NOME_BANCO, C.NOME AS NOME_CLIENTE, F.NOME AS NOME_FORNECEDOR
                    FROM EXTRATO
                    INNER JOIN BANCO B ON EXTRATO.ID_BANCO = B.IDBANCO
                    INNER JOIN CLIENTE C ON EXTRATO.ID_CLIENTE = C.IDCLIENTE
                    LEFT JOIN FORNECEDOR F ON EXTRATO.ID_FORNECEDOR = F.IDFORNECEDOR
                    LEFT JOIN CATEGORIA CAT ON EXTRATO.CATEGORIA = CAT.IDCATEGORIA
                    LEFT JOIN CATEGORIA SUBCAT ON CAT.ID_CATEGORIA_PAI = SUBCAT.IDCATEGORIA
                    WHERE ID_BANCO = ? AND DATA >= ? AND DATA < ? AND ID_CLIENTE = ?
                    ORDER BY ORDEM, DATA`, parametros,
        function (err, result, fields) {
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
        function (err, result, fields) {
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
        function (err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        });
}

function buscarSaldoInicial(idCliente, idBanco, data, callback) {
    const mesAno = data.slice(0, 7);
    const querySaldoManual = `
        SELECT SALDO FROM SALDO_INICIAL 
        WHERE ID_CLIENTE = ? AND ID_BANCO = ? AND MES_ANO = ?`;

    mysqlConn.query(querySaldoManual, [idCliente, idBanco, mesAno], function (err, result) {
        if (err) {
            callback(err, null);
        } else if (result.length > 0) {
            callback(null, result[0]);
        } else {
            const querySaldoAutomatico = `
                SELECT SUM(CASE WHEN TIPO_DE_TRANSACAO = 'ENTRADA' THEN VALOR ELSE 0 END) - 
                       SUM(CASE WHEN TIPO_DE_TRANSACAO = 'SAIDA' THEN VALOR ELSE 0 END) AS saldo 
                FROM EXTRATO 
                WHERE ID_CLIENTE = ? AND ID_BANCO = ? AND DATA < ?`;

            mysqlConn.query(querySaldoAutomatico, [idCliente, idBanco, data], function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, result[0]);
                }
            });
        }
    });
}

function salvarOrdem(ordem, callback) {
    const promises = ordem.map(item => {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE EXTRATO SET ORDEM = ? WHERE IDEXTRATO = ?';
            mysqlConn.query(query, [item.ordem, item.idExtrato], (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    });

    Promise.all(promises)
        .then(results => {
            callback(null, results);
        })
        .catch(err => {
            callback(err, null);
        });
}

function definirSaldoInicial(idCliente, idBanco, data, mesAno, saldo, callback) {
    const queryInsertOrUpdate = `
        INSERT INTO SALDO_INICIAL (ID_CLIENTE, ID_BANCO, DATA, MES_ANO, SALDO) 
        VALUES (?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE SALDO = VALUES(SALDO)`;

    mysqlConn.query(queryInsertOrUpdate, [idCliente, idBanco, data, mesAno, saldo], function (err, result) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

module.exports = { buscar, extratoAEditar, editarExtrato, buscarSaldoInicial, salvarOrdem, definirSaldoInicial };
