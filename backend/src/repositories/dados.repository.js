const mysqlConn = require("../base/database");

function adicionar(idcliente, nomeBanco, tipo ,callback){
    mysqlConn.query(`SELECT IDBANCO FROM BANCO WHERE NOME = ? AND TIPO = ?`, [nomeBanco, tipo], function(err, result, fields) {
        if(err){
            callback(err, null);
        }
        else if(result.length > 0){
            const idBancoExistente = result[0].IDBANCO;
            mysqlConn.query(`INSERT INTO RELACAOCLIENTEBANCO (ID_CLIENTE, ID_BANCO) VALUES (?, ?)`, [idcliente, idBancoExistente], function(errAss, resultASS, fields) {
                if(errAss){
                    callback(errAss, null);
                }
                else{
                    callback(null, resultASS);
                }   
            });
        }else{
            mysqlConn.query(`INSERT INTO BANCO (NOME, TIPO) VALUES (?, ?)`, [nomeBanco, tipo], function(errBanco, resultBanco, fields) {
                if(errBanco){
                    callback(errBanco, null);
                }
                else{
                    const idNovoBanco = resultBanco.insertId;
                    mysqlConn.query(`INSERT INTO RELACAOCLIENTEBANCO (ID_CLIENTE, ID_BANCO) VALUES (?, ?)`, [idcliente, idNovoBanco], function(errAss, resultASS, fields) {
                        if(errAss){
                            callback(errAss, null);
                        }
                        else{
                            callback(null, resultASS);
                        }   
                    });
                }
            });
        }
    });
}

function buscar(idcliente, callback){
    mysqlConn.query(`SELECT B.IDBANCO, CONCAT(B.NOME, ' - ' ,B.TIPO) AS NOME_TIPO FROM BANCO B 
                     INNER JOIN RELACAOCLIENTEBANCO R ON B.IDBANCO = R.ID_BANCO
                     WHERE R.ID_CLIENTE = ?`, [idcliente], function(err, result, fields) {
        if(err){
            callback(err, null);
        }
        else{
            callback(null, result);
        }
    });
}

function remover(idcliente, idbanco, callback){
    mysqlConn.query(`DELETE FROM RELACAOCLIENTEBANCO WHERE ID_CLIENTE = ? AND ID_BANCO = ?`, [idcliente, idbanco], function(err, result, fields) {
        if(err){
            callback(err, null);
        }
        else{
            callback(null, result);
        }
    });
}

module.exports = {adicionar, buscar, remover};