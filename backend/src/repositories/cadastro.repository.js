const mysqlConn = require('../base/database');

async function adicionar(nome, telefone, cnpj, cpf, endereco, cep, nome_responsavel, cpf_responsavel, inscricao_estadual, cnae_principal, socios) {
    const checkQuery = 'SELECT COUNT(*) AS count FROM CLIENTE WHERE nome = ?';
    mysqlConn.query(checkQuery, [nome], (error, results) => {
        if (error) {
            console.error('Erro ao verificar a existência da empresa:', error);
            return;
        }

        if (results[0].count > 0) {
            console.log('A empresa já existe.');
            return;
        }

        const query = 'INSERT INTO CLIENTE (nome, telefone, cnpj, cpf, endereco, cep, nome_responsavel, cpf_responsavel, inscricao_estadual, cnae_principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        mysqlConn.query(query, [nome, telefone, cnpj, cpf, endereco, cep, nome_responsavel, cpf_responsavel, inscricao_estadual, cnae_principal], (error, results, fields) => {
            if (error) {
                console.error('Erro ao adicionar o cadastro:', error);
                return;
            }

            const id_cliente = results.insertId;
            if (socios && socios.length > 0) {
                const querySocio = 'INSERT INTO SOCIO (id_cliente, nome, cpf, endereco, cep, telefone) VALUES ?';
                const sociosData = socios.map(socio => [id_cliente, socio.nome, socio.cpf, socio.endereco, socio.cep, socio.telefone]);

                mysqlConn.query(querySocio, [sociosData], (error, results, fields) => {
                    if (error) {
                        console.error('Erro ao adicionar sócio:', error);
                    }
                });
            }
        });
    });
}

function editar(idCliente, nome, telefone, cnpj, cpf, endereco, cep, nome_responsavel, cpf_responsavel, inscricao_estadual, cnae_principal, socios) {
    const query = `
        UPDATE CLIENTE
        SET nome = ?, telefone = ?, cnpj = ?, cpf = ?, endereco = ?, cep = ?, nome_responsavel = ?, cpf_responsavel = ?, inscricao_estadual = ?, cnae_principal = ?
        WHERE idCLIENTE = ?`;

    mysqlConn.query(query, [nome, telefone, cnpj, cpf, endereco, cep, nome_responsavel, cpf_responsavel, inscricao_estadual, cnae_principal, idCliente], (error, results, fields) => {
        if (error) {
            console.error('Erro ao editar o cadastro:', error);
            return;
        }

        const deleteSociosQuery = 'DELETE FROM SOCIO WHERE id_cliente = ?';
        mysqlConn.query(deleteSociosQuery, [idCliente], (error, results, fields) => {
            if (error) {
                console.error('Erro ao deletar sócios antigos:', error);
                return;
            }

            if (socios && socios.length > 0) {
                socios.forEach(socio => {
                    const querySocio = 'INSERT INTO SOCIO (id_cliente, nome, cpf, endereco, cep, telefone) VALUES (?, ?, ?, ?, ?, ?)';
                    mysqlConn.query(querySocio, [idCliente, socio.nome, socio.cpf, socio.endereco, socio.cep, socio.telefone], (error, results, fields) => {
                        if (error) {
                            console.error('Erro ao adicionar sócio:', error);
                        }
                    });
                });
            }
        });
    });
}


function listar(callback) {
    mysqlConn.query('SELECT * FROM CLIENTE', (error, results, fields) => {
        if (error) {
            console.error('Erro ao listar os cadastros:', error);
            return callback(error, null);
        }
        callback(null, results);
    });
}

function remover(nome, userRole, callback) {
    if (userRole !== 'Administrador' && userRole !== 'Configurador') {
        const error = new Error('Usuário não autorizado para realizar esta operação');
        console.error(error.message);
        return callback(error, null);
    }

    mysqlConn.query('SELECT IDCLIENTE FROM CLIENTE WHERE NOME = ?', [nome], (error, results, fields) => {
        if (error) {
            console.error('Erro ao buscar o ID do cliente:', error);
            return callback(error, null);
        }

        if (results.length === 0) {
            const error = new Error('Cliente não encontrado');
            console.error(error.message);
            return callback(error, null);
        }

        const idCliente = results[0].IDCLIENTE;

        mysqlConn.query('DELETE FROM RELACAOUSUARIOCLIENTE WHERE ID_EMPRESA_REFERENCIA = ?', [idCliente], (error, results, fields) => {
            if (error) {
                console.error('Erro ao remover registros relacionados:', error);
                return callback(error, null);
            }

            mysqlConn.query('DELETE FROM SOCIO WHERE id_cliente = ?', [idCliente], (error, results, fields) => {
                if (error) {
                    console.error('Erro ao remover sócios:', error);
                    return callback(error, null);
                }

                mysqlConn.query('DELETE FROM CLIENTE WHERE idCLIENTE = ?', [idCliente], (error, results, fields) => {
                    if (error) {
                        console.error('Erro ao remover o cadastro:', error);
                        return callback(error, null);
                    }
                    callback(null, results);
                });
            });
        });
    });
}


function obterEmpresa(nome, callback) {
    mysqlConn.query('SELECT * FROM CLIENTE WHERE NOME = ?', [nome], (error, results, fields) => {
        if (error) {
            console.error('Erro ao buscar os detalhes da empresa:', error);
            return callback(error, null);
        }
        callback(null, results[0]);
    });
}

module.exports = { adicionar, listar, remover, editar, obterEmpresa };
