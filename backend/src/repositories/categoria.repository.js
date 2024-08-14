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

function adicionarOuAssociarCategoria(categoria, idCliente, callback) {
    mysqlConn.query(`SELECT IDCATEGORIA FROM CATEGORIA WHERE NOME = ? LIMIT 1`, [categoria], function(err, results) {
        if (err) {
            callback(err, null);
        } else if (results.length > 0) {
            const idCategoriaExistente = results[0].IDCATEGORIA;
            mysqlConn.query(`INSERT INTO RELACAOCLIENTECATEGORIA (ID_CLIENTE, ID_CATEGORIA) VALUES (?, ?)`, [idCliente, idCategoriaExistente], function(errAssoc, resultAssoc) {
                if (errAssoc) {
                    callback(errAssoc, null);
                } else {
                    callback(null, resultAssoc);
                }
            });
        } else {
            mysqlConn.query(`INSERT INTO CATEGORIA (NOME) VALUES (?)`, [categoria], function(err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    const idNovaCategoria = result.insertId;
                    mysqlConn.query(`INSERT INTO RELACAOCLIENTECATEGORIA (ID_CLIENTE, ID_CATEGORIA) VALUES (?, ?)`, [idCliente, idNovaCategoria], function(errAssoc, resultAssoc) {
                        if (errAssoc) {
                            callback(errAssoc, null);
                        } else {
                            callback(null, resultAssoc);
                        }
                    });
                }
            });
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

function adicionarSubcategoria(idCliente, idCategoriaPai, subcategoria, callback) {
    mysqlConn.query(`INSERT INTO CATEGORIA (NOME, ID_CATEGORIA_PAI) VALUES (?, ?)`, [subcategoria, idCategoriaPai], function(err, result) {
        if (err) {
            callback(err, null);
        } else {
            const idNovaSubcategoria = result.insertId;
            mysqlConn.query(`SELECT * FROM RELACAOCLIENTECATEGORIA WHERE ID_CLIENTE = ? AND ID_CATEGORIA = ?`, [idCliente, idCategoriaPai], function(errVerif, resultVerif) {
                if (errVerif) {
                    callback(errVerif, null);
                } else if (resultVerif.length > 0) {
                    mysqlConn.query(`INSERT INTO RELACAOCLIENTECATEGORIA (ID_CLIENTE, ID_CATEGORIA) VALUES (?, ?)`, [idCliente, idNovaSubcategoria], function(errAssoc, resultAssoc) {
                        if (errAssoc) {
                            callback(errAssoc, null);
                        } else {
                            callback(null, resultAssoc);
                        }
                    });
                } else {
                    callback(new Error("A categoria pai não está associada ao cliente especificado."), null);
                }
            });
        }
    });
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
        `SELECT IDCATEGORIA, NOME FROM CATEGORIA WHERE IDCATEGORIA = ?`,
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

module.exports = {buscar, adicionarOuAssociarCategoria, deletar, adicionarSubcategoria, editarCategoria, buscarCategoriaPorId};