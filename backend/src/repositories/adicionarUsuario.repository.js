const mysqlConn = require("../base/database");


function adicionarUsuario(cpf, nome, senha, roles, callback) {

    mysqlConn.query(`INSERT INTO USUARIOS (NOME_DO_USUARIO, CPF, SENHA, ROLE) VALUES (?, ?, ?, ?)`,
        [nome, cpf, senha, roles],
        (err, result, fields) => {
            callback(err, result);
        });
}

module.exports = {adicionarUsuario};
