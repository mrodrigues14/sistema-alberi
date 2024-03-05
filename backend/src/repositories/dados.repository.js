const mysqlConn = require("../base/database");

function adicionar(idcliente, nomeBanco, tipo ,callback){
    mysqlConn.query(`SELECT IDBANCO FROM BANCO WHERE NOME = ? AND TIPO = ?`, [nomeBanco, tipo], function(err, result, fields) {
        if(err){
            callback(err, null);
        }
        else if(result.length > 0){
            const idBancoExistente = results[0].IDBANCO;
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

module.exports = {adicionar};