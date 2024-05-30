const mysqlConn = require("../base/database");
const bcrypt = require("bcrypt");

function iniciarRecuperacaoSenha(email, cpf, callback) {
    mysqlConn.query(`SELECT IDUSUARIOS FROM USUARIOS WHERE USUARIO_EMAIL = ? AND CPF = ?`, [email, cpf], (err, results) => {
        if (err) {
            return callback(err);
        }
        if (results.length === 0) {
            return callback(null, false);
        }
        callback(null, true);
    });
}

function redefinirSenha(email, novaSenha, cpf,  callback) {
    const senhaHash = bcrypt.hashSync(novaSenha, 10);

    mysqlConn.query(`UPDATE USUARIOS SET SENHA = ? WHERE USUARIO_EMAIL = ? AND CPF = ?`, [senhaHash, email, cpf], (err) => {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
}

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

module.exports = { buscarIdUsuario, iniciarRecuperacaoSenha, redefinirSenha };
