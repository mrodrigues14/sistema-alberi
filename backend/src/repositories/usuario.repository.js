const mysqlConn = require("../base/database");

function adicionarUsuario(cpf, nome, senha, role, empresas, callback) {
    const cpfNormalized = cpf.replace(/\D/g, '');

    mysqlConn.query(`SELECT * FROM USUARIOS WHERE CPF = ?`,
        [cpfNormalized],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            if (results.length > 0) {
                return callback({message: 'Usuário já existe'}, null);
            }
            mysqlConn.query(`INSERT INTO USUARIOS (NOME_DO_USUARIO, CPF, SENHA, ROLE) VALUES (?, ?, ?, ?)`,
                [nome, cpfNormalized, senha, role],
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

function listarUsuarios(callback) {
    mysqlConn.query(`SELECT IDUSUARIOS AS ID, NOME_DO_USUARIO AS NOME FROM USUARIOS`, (err, results) => {
        callback(err, results);
    });
}

function obterUsuario(userId, callback) {
    mysqlConn.query(`
        SELECT U.IDUSUARIOS AS ID, U.NOME_DO_USUARIO AS NOME, U.CPF, U.SENHA, U.ROLE, U.ATIVO, GROUP_CONCAT(RU.ID_EMPRESA_REFERENCIA) AS EMPRESAS
        FROM USUARIOS U
        LEFT JOIN RELACAOUSUARIOCLIENTE RU ON U.IDUSUARIOS = RU.ID_USUARIO
        WHERE U.IDUSUARIOS = ?
        GROUP BY U.IDUSUARIOS, U.NOME_DO_USUARIO, U.CPF, U.SENHA, U.ROLE, U.ATIVO
    `, [userId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        if (results.length === 0) {
            return callback({message: 'Usuário não encontrado'}, null);
        }
        const usuario = results[0];
        usuario.empresas = usuario.EMPRESAS ? usuario.EMPRESAS.split(',') : [];
        callback(null, usuario);
    });
}

function editarUsuario(userId, cpf, nome, senha, role, ativo, empresas, callback) {
    const cpfNormalized = cpf.replace(/\D/g, '');

    mysqlConn.query(`
        UPDATE USUARIOS
        SET NOME_DO_USUARIO = ?, CPF = ?, SENHA = ?, ROLE = ?, ATIVO = ?
        WHERE IDUSUARIOS = ?
    `, [nome, cpfNormalized, senha, role, ativo, userId], (err) => {
        if (err) {
            return callback(err);
        }

        mysqlConn.query(`DELETE FROM RELACAOUSUARIOCLIENTE WHERE ID_USUARIO = ?`, [userId], (err) => {
            if (err) {
                return callback(err);
            }

            const relacoes = empresas.map(empresaId => [userId, empresaId]);
            if (relacoes.length > 0) {
                mysqlConn.query(`INSERT INTO RELACAOUSUARIOCLIENTE (ID_USUARIO, ID_EMPRESA_REFERENCIA) VALUES ?`, [relacoes], (err) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null);
                });
            } else {
                callback(null);
            }
        });
    });
}

module.exports = { adicionarUsuario, listarEmpresas, listarUsuarios, obterUsuario, editarUsuario };
