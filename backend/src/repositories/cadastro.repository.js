const mysqlConn = require('../base/database');

async function adicionar(nome, apelido, telefone, cnpj, cpf, endereco, cep, nome_responsavel, cpf_responsavel, inscricao_estadual, cnae_principal, socios, callback) {
    const checkQuery = 'SELECT COUNT(*) AS count FROM CLIENTE WHERE nome = ?';
    mysqlConn.query(checkQuery, [nome], (error, results) => {
        if (error) {
            console.error('Erro ao verificar a existência da empresa:', error);
            return callback(error);
        }

        if (results[0].count > 0) {
            console.log('A empresa já existe.');
            return callback(new Error('A empresa já existe.'));
        }

        const query = 'INSERT INTO CLIENTE (nome, apelido, telefone, cnpj, cpf, endereco, cep, nome_responsavel, cpf_responsavel, inscricao_estadual, cnae_principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        mysqlConn.query(query, [nome, apelido, telefone, cnpj, cpf, endereco, cep, nome_responsavel, cpf_responsavel, inscricao_estadual, cnae_principal], (error, results, fields) => {
            if (error) {
                console.error('Erro ao adicionar o cadastro:', error);
                return callback(error);
            }

            const id_cliente = results.insertId;
            if (socios && socios.length > 0) {
                const querySocio = 'INSERT INTO SOCIO (id_cliente, nome, cpf, endereco, cep, telefone) VALUES ?';
                const sociosData = socios.map(socio => [id_cliente, socio.nome, socio.cpf, socio.endereco, socio.cep, socio.telefone]);

                mysqlConn.query(querySocio, [sociosData], (error, results, fields) => {
                    if (error) {
                        console.error('Erro ao adicionar sócio:', error);
                        return callback(error);
                    }
                    return callback(null, results);
                });
            } else {
                return callback(null, results);
            }
        });
    });
}

function editar(idCliente, tipoCliente, nome, apelido, telefone, cnpj, cpf, endereco, cep, nomeResponsavel, cpfResponsavel, inscricaoEstadual, cnaePrincipal, socios, callback) {
    const query = tipoCliente === 'juridica' ?
        `UPDATE CLIENTE SET NOME = ?, APELIDO = ?, TELEFONE = ?, CNPJ = ?, ENDERECO = ?, CEP = ?, NOME_RESPONSAVEL = ?, CPF_RESPONSAVEL = ?, INSCRICAO_ESTADUAL = ?, CNAE_PRINCIPAL = ? WHERE IDCLIENTE = ?` :
        `UPDATE CLIENTE SET NOME = ?, APELIDO = ?, TELEFONE = ?, CPF = ?, ENDERECO = ?, CEP = ?, EMAIL = ? WHERE IDCLIENTE = ?`;

    const values = tipoCliente === 'juridica' ?
        [nome, apelido, telefone, cnpj, endereco, cep, nomeResponsavel, cpfResponsavel, inscricaoEstadual, cnaePrincipal, idCliente] :
        [nome, apelido, telefone, cpf, endereco, cep, email, idCliente];

    mysqlConn.query(query, values, (error, results, fields) => {
        if (error) {
            console.error('Erro ao editar o cadastro:', error);
            return callback(error);
        }

        if (tipoCliente === 'juridica') {
            const deleteSociosQuery = 'DELETE FROM SOCIO WHERE id_cliente = ?';
            mysqlConn.query(deleteSociosQuery, [idCliente], (error, results, fields) => {
                if (error) {
                    console.error('Erro ao deletar sócios:', error);
                    return callback(error);
                }

                if (socios && socios.length > 0) {
                    const querySocio = 'INSERT INTO SOCIO (id_cliente, nome, cpf, endereco, cep, telefone) VALUES ?';
                    const sociosData = socios.map(socio => [idCliente, socio.nome, socio.cpf, socio.endereco, socio.cep, socio.telefone]);

                    mysqlConn.query(querySocio, [sociosData], (error, results, fields) => {
                        if (error) {
                            console.error('Erro ao adicionar sócio:', error);
                            return callback(error);
                        }
                        return callback(null, results);
                    });
                } else {
                    return callback(null, results);
                }
            });
        } else {
            return callback(null, results);
        }
    });
}


function listar(callback) {
    mysqlConn.query('SELECT * FROM CLIENTE ORDER BY NOME ASC', (error, results, fields) => {
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
    const query = 'SELECT * FROM CLIENTE WHERE NOME = ?';
    mysqlConn.query(query, [nome], (error, results, fields) => {
        if (error) {
            console.error('Erro ao buscar os detalhes da empresa:', error);
            return callback(error, null);
        }
        const cliente = results[0];

        if (cliente.CNPJ) {
            const querySocios = 'SELECT * FROM SOCIO WHERE id_cliente = ?';
            mysqlConn.query(querySocios, [cliente.IDCLIENTE], (error, socios) => {
                if (error) {
                    console.error('Erro ao buscar sócios:', error);
                    return callback(error, null);
                }
                cliente.socios = socios;
                callback(null, cliente);
            });
        } else {
            callback(null, cliente);
        }
    });
}


module.exports = { adicionar, listar, remover, editar, obterEmpresa };
