const mysqlConn = require("../base/database");


function buscarIdUsuario(nomeClienteLogin, callback){
    let query = '';
    let params = [];

    query = `
    SELECT IDUSUARIO
    FROM USUARIOS
    WHERE NOME = ?
    `;
    params = [nomeClienteLogin];

    mysqlConn.query(query, params, function (err,result){
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

module.exports = {buscarIdUsuario};