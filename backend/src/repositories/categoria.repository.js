const mysqlConn = require("../base/database");

function buscar(idcliente, callback){
    mysqlConn.query(
        `SELECT C.IDCATEGORIA, C.NOME, COALESCE(C.ID_CATEGORIA_PAI, C.IDCATEGORIA) AS ORDER_PARENT, C.ID_CATEGORIA_PAI
        FROM CATEGORIA C
        INNER JOIN RELACAOCLIENTECATEGORIA RCC ON C.IDCATEGORIA = RCC.ID_CATEGORIA
        WHERE RCC.ID_CLIENTE = ?
        ORDER BY ORDER_PARENT, C.ID_CATEGORIA_PAI IS NOT NULL, C.IDCATEGORIA
        `, [idcliente],
        function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}

function adicionarOuAssociarCategoria(categoria, idCliente, entrada, saida, callback) {
    mysqlConn.query(`SELECT IDCATEGORIA FROM CATEGORIA WHERE NOME = ? LIMIT 1`, [categoria], function(err, results) {
        if (err) {
            callback(err, null);
        } else if (results.length > 0) {
            // Categoria já existe, atualiza as colunas ENTRADA e SAIDA
            const idCategoriaExistente = results[0].IDCATEGORIA;
            mysqlConn.query(
                `UPDATE CATEGORIA SET ENTRADA = ?, SAIDA = ? WHERE IDCATEGORIA = ?`,
                [entrada, saida, idCategoriaExistente],
                function(errUpdate) {
                    if (errUpdate) {
                        callback(errUpdate, null);
                    } else {
                        // Cria associação cliente-categoria
                        mysqlConn.query(
                            `INSERT INTO RELACAOCLIENTECATEGORIA (ID_CLIENTE, ID_CATEGORIA) VALUES (?, ?)`,
                            [idCliente, idCategoriaExistente],
                            function(errAssoc, resultAssoc) {
                                if (errAssoc) {
                                    callback(errAssoc, null);
                                } else {
                                    callback(null, resultAssoc);
                                }
                            }
                        );
                    }
                }
            );
        } else {
            // Categoria não existe, insere nova categoria com ENTRADA e SAIDA
            mysqlConn.query(
                `INSERT INTO CATEGORIA (NOME, ENTRADA, SAIDA) VALUES (?, ?, ?)`,
                [categoria, entrada, saida],
                function(errInsert, resultInsert) {
                    if (errInsert) {
                        callback(errInsert, null);
                    } else {
                        const idNovaCategoria = resultInsert.insertId;
                        // Cria associação cliente-categoria
                        mysqlConn.query(
                            `INSERT INTO RELACAOCLIENTECATEGORIA (ID_CLIENTE, ID_CATEGORIA) VALUES (?, ?)`,
                            [idCliente, idNovaCategoria],
                            function(errAssoc, resultAssoc) {
                                if (errAssoc) {
                                    callback(errAssoc, null);
                                } else {
                                    callback(null, resultAssoc);
                                }
                            }
                        );
                    }
                }
            );
        }
    });
}


function deletar(idcategoria, idCliente, callback){
    console.log(idcategoria, idCliente);
     mysqlConn.query(`DELETE FROM RELACAOCLIENTECATEGORIA WHERE ID_CLIENTE = ? AND ID_CATEGORIA = ?`, [idCliente, idcategoria],
    function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function adicionarSubcategoria(idCliente, idCategoriaPai, subcategoria, entrada, saida, callback) {
    mysqlConn.query(
        `INSERT INTO CATEGORIA (NOME, ID_CATEGORIA_PAI, ENTRADA, SAIDA) VALUES (?, ?, ?, ?)`,
        [subcategoria, idCategoriaPai, entrada, saida],
        function(err, result) {
            if (err) {
                callback(err, null);
            } else {
                const idNovaSubcategoria = result.insertId;

                mysqlConn.query(
                    `SELECT * FROM RELACAOCLIENTECATEGORIA WHERE ID_CLIENTE = ? AND ID_CATEGORIA = ?`,
                    [idCliente, idCategoriaPai],
                    function(errVerif, resultVerif) {
                        if (errVerif) {
                            callback(errVerif, null);
                        } else if (resultVerif.length > 0) {
                            mysqlConn.query(
                                `INSERT INTO RELACAOCLIENTECATEGORIA (ID_CLIENTE, ID_CATEGORIA) VALUES (?, ?)`,
                                [idCliente, idNovaSubcategoria],
                                function(errAssoc, resultAssoc) {
                                    if (errAssoc) {
                                        callback(errAssoc, null);
                                    } else {
                                        callback(null, resultAssoc);
                                    }
                                }
                            );
                        } else {
                            callback(
                                new Error("A categoria pai não está associada ao cliente especificado."),
                                null
                            );
                        }
                    }
                );
            }
        }
    );
}


function editarCategoria(idCategoriaAntiga, categoriaNova, idCliente, callback) {
    mysqlConn.query(`SELECT NOME FROM CATEGORIA WHERE IDCATEGORIA = ? LIMIT 1`, [idCategoriaAntiga], function(err, results) {
        if (err) {
            callback(err, null);
        } else if (results.length > 0) {
            mysqlConn.query(`UPDATE CATEGORIA SET NOME = ? WHERE IDCATEGORIA = ?`, [categoriaNova, idCategoriaAntiga], function(err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, result);
                }
            });
        } else {
            callback(new Error("Categoria não encontrada."), null);
        }
    });
}

function buscarCategoriaPorId(idCategoria, callback) {
    mysqlConn.query(
        `SELECT IDCATEGORIA, NOME, ENTRADA, SAIDA FROM CATEGORIA WHERE IDCATEGORIA = ?`,
        [idCategoria],
        function(err, result) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result[0]);
            }
        }
    );
}


function buscarRubricasContabeis(callback) {
    mysqlConn.query(
        `SELECT ID_RUBRICA_CONTABIL, NOME, GASTO_MES, GASTO_EXTRA 
         FROM RUBRICA_CONTABIL 
         ORDER BY ID_RUBRICA_CONTABIL`,
        function (err, result) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}


function adicionarRubricaContabil(nome, callback) {
    mysqlConn.query(`INSERT INTO RUBRICA_CONTABIL (NOME) VALUES (?)`, [nome], function(err, result) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function editarRubricaContabil(idRubrica, nomeNovo, callback) {
    mysqlConn.query(`UPDATE RUBRICA_CONTABIL SET NOME = ? WHERE ID_RUBRICA_CONTABIL = ?`, [nomeNovo, idRubrica], function(err, result) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function deletarRubricaContabil(idRubrica, callback) {
    mysqlConn.query(`DELETE FROM RUBRICA_CONTABIL WHERE ID_RUBRICA_CONTABIL = ?`, [idRubrica], function(err, result) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function buscarCategoriaComOpcoes(idcliente, callback) {
    mysqlConn.query(
        `SELECT C.IDCATEGORIA, C.NOME, COALESCE(C.ID_CATEGORIA_PAI, C.IDCATEGORIA) AS ORDER_PARENT,
                C.ID_CATEGORIA_PAI, C.GASTO_MES, C.GASTO_EXTRA, C.ENTRADA, C.SAIDA
         FROM CATEGORIA C
                  INNER JOIN RELACAOCLIENTECATEGORIA RCC ON C.IDCATEGORIA = RCC.ID_CATEGORIA
         WHERE RCC.ID_CLIENTE = ?
         ORDER BY ORDER_PARENT, C.ID_CATEGORIA_PAI IS NOT NULL, C.IDCATEGORIA`,
        [idcliente],
        function (err, result) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}


function atualizarOpcoesCategoria(idCategoria, campos, callback) {
    const { GASTO_MES, GASTO_EXTRA } = campos;
    mysqlConn.query(
        `UPDATE CATEGORIA SET GASTO_MES = ?, GASTO_EXTRA = ? WHERE IDCATEGORIA = ?`,
        [GASTO_MES, GASTO_EXTRA, idCategoria],
        function (err, result) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}

function atualizarOpcoesRubricaContabil(idRubricaContabil, campos, callback) {
    const { GASTO_MES, GASTO_EXTRA } = campos;
    mysqlConn.query(
        `UPDATE RUBRICA_CONTABIL SET GASTO_MES = ?, GASTO_EXTRA = ? WHERE ID_RUBRICA_CONTABIL = ?`,
        [GASTO_MES, GASTO_EXTRA, idRubricaContabil],
        function (err, result) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}


module.exports = {atualizarOpcoesRubricaContabil, atualizarOpcoesCategoria, buscarCategoriaComOpcoes, buscarRubricasContabeis, adicionarRubricaContabil, editarRubricaContabil, deletarRubricaContabil, buscar, adicionarOuAssociarCategoria, deletar, adicionarSubcategoria, editarCategoria, buscarCategoriaPorId};