const mysqlConn = require("../base/database");

function buscar(callback){
    mysqlConn.query(`SELECT CATEGORIA FROM CATEGORIA`, function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function adicionar(categoria, callback){
    mysqlConn.query(`INSERT INTO CATEGORIA (CATEGORIA) VALUES ('${categoria}')`, function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function deletar(categoria, callback){
    mysqlConn.query(`DELETE FROM CATEGORIA WHERE CATEGORIA = '${categoria}'`, function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

module.exports = {buscar, adicionar, deletar};