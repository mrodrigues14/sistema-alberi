const mysqlConn = require("../base/database");

function buscar(callback){
    mysqlConn.query(`SELECT IDCATEGORIA, NOME, ID_CATEGORIA_PAI FROM CATEGORIA`, function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function adicionar(categoria, callback){
    mysqlConn.query(`INSERT INTO CATEGORIA (NOME) VALUES ('${categoria}')`, function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function deletar(categoria, callback){
    mysqlConn.query(`DELETE FROM CATEGORIA WHERE NOME = '${categoria}'`, function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function adicionarSubcategoria(ID_CATEGORIA_PAI, subcategoria, callback){
    mysqlConn.query(`INSERT INTO CATEGORIA (NOME, ID_CATEGORIA_PAI) VALUES (?,?)`, 
    [subcategoria, ID_CATEGORIA_PAI],function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

module.exports = {buscar, adicionar, deletar, adicionarSubcategoria};