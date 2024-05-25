const mysqlConn = require("../base/database");

function adicionarUsuario(cpf, nome, senha, roles, empresas, callback) {
    const cpfNormalized = cpf.replace(/\D/g, '');

    mysqlConn.query(`SELECT * FROM USUARIOS WHERE CPF = ? OR UPPER(NOME_DO_USUARIO) = UPPER(?)`,
        [cpfNormalized, nome],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            if (results.length > 0) {
                return callback({message: 'Usuário já existe'}, null);
            }
            mysqlConn.query(`INSERT INTO USUARIOS (NOME_DO_USUARIO, CPF, SENHA, ROLE) VALUES (?, ?, ?, ?)`,
                [nome, cpfNormalized, senha, roles],
                (err, result) => {
                    if (err) {
                        return callback(err, null);
                    }
                    const userId = result.insertId;
                    const relacoes = empresas.map(empresaId => [userId, empresaId]);
                    mysqlConn.query(`INSERT INTO RELACAOUSUARIOCLIENTE (ID_USUARIO, ID_EMPRESA_REFERENCIA) VALUES ?`, [relacoes], (err) => {
                        if (err) {
                            return callback(err, null);
                        }
                        callback(null, result);
                    });
                });
        });
}

function listarEmpresas(callback) {
    mysqlConn.query(`SELECT IDCLIENTE, NOME FROM CLIENTE`, (err, results) => {
        callback(err, results);
    });
}

module.exports = { adicionarUsuario, listarEmpresas };
