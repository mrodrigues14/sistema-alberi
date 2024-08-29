const mysqlConn = require("../base/database");

function adicionar(idcliente, nomeBanco, tipo, callback) {
    mysqlConn.query(`SELECT IDBANCO FROM BANCO WHERE NOME = ? AND TIPO = ?`, [nomeBanco, tipo], function(err, result) {
        if (err) {
            return callback(err, null);
        }

        let idBanco;
        if (result.length > 0) {
            idBanco = result[0].IDBANCO;
        } else {
            mysqlConn.query(`INSERT INTO BANCO (NOME, TIPO) VALUES (?, ?)`, [nomeBanco, tipo], function(errBanco, resultBanco) {
                if (errBanco) {
                    return callback(errBanco, null);
                }
                idBanco = resultBanco.insertId;
                verificarERelacionar(idcliente, idBanco, callback);
            });
            return;
        }

        verificarERelacionar(idcliente, idBanco, callback);
    });
}

function verificarERelacionar(idcliente, idBanco, callback) {
    mysqlConn.query(`SELECT 1 FROM RELACAOCLIENTEBANCO WHERE ID_CLIENTE = ? AND ID_BANCO = ?`, [idcliente, idBanco], function(errVer, resultVer) {
        if (errVer) {
            return callback(errVer, null);
        }
        if (resultVer.length === 0) {
            mysqlConn.query(`INSERT INTO RELACAOCLIENTEBANCO (ID_CLIENTE, ID_BANCO) VALUES (?, ?)`, [idcliente, idBanco], function(errAss, resultASS) {
                if (errAss) {
                    return callback(errAss, null);
                }
                callback(null, resultASS);
            });
        } else {
            callback(null, "Relacionamento já existe");
        }
    });
}

function buscar(idcliente, callback) {
    mysqlConn.query(`SELECT B.IDBANCO, CONCAT(B.NOME, ' - ', B.TIPO) AS NOME_TIPO FROM BANCO B 
                     INNER JOIN RELACAOCLIENTEBANCO R ON B.IDBANCO = R.ID_BANCO
                     WHERE R.ID_CLIENTE = ?`, [idcliente], function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function remover(idcliente, idbanco, callback) {
    mysqlConn.query(`DELETE FROM RELACAOCLIENTEBANCO WHERE ID_CLIENTE = ? AND ID_BANCO = ?`, [idcliente, idbanco], function(errRel, resultRel) {
        if (errRel) {
            return callback(errRel, null);
        }
        if (resultRel.affectedRows > 0) {
            mysqlConn.query(`DELETE FROM BANCO WHERE IDBANCO = ?`, [idbanco], function(errBanco, resultBanco) {
                if (errBanco) {
                    return callback(errBanco, null);
                }
                return callback(null, resultBanco);
            });
        } else {
            return callback(new Error("Nenhuma relação encontrada para deletar."), null);
        }
    });
}

function editar(idcliente, idbanco, novoNome, novoTipo, callback) {
    mysqlConn.query(`UPDATE BANCO SET NOME = ?, TIPO = ? WHERE IDBANCO = ?`, [novoNome, novoTipo, idbanco], function(err, result) {
        if (err) {
            return callback(err, null);
        }

        if (result.affectedRows > 0) {
            callback(null, result);
        } else {
            callback(new Error("Nenhum banco encontrado para atualizar."), null);
        }
    });
}


function definirSaldoInicial(idcliente, idbanco, mesAno, saldo, callback) {
    mysqlConn.query(`INSERT INTO SALDO_INICIAL (ID_CLIENTE, ID_BANCO, MES_ANO, SALDO) 
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE SALDO = ?`,
        [idcliente, idbanco, mesAno, saldo, saldo],
        function(err, result) {
            if (err) {
                return callback(err, null);
            }
            callback(null, result);
        });
}

module.exports = { adicionar, buscar, remover, editar, definirSaldoInicial };
