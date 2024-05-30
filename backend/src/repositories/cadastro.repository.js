const mysqlConn = require('../base/database');

async function adicionar(nome, telefone, cnpj, cpf, endereco, cep, nome_responsavel, cpf_responsavel, inscricao_estadual, cnae_principal, socios) {
    const query = 'INSERT INTO CLIENTE (nome, telefone, cnpj, cpf, endereco, cep, nome_responsavel, cpf_responsavel, inscricao_estadual, cnae_principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    mysqlConn.query(query, [nome, telefone, cnpj, cpf, endereco, cep, nome_responsavel, cpf_responsavel, inscricao_estadual, cnae_principal], (error, results, fields) => {
        if (error) {
            console.error('Erro ao adicionar o cadastro:', error);
            return;
        }

        const id_cliente = results.insertId;
        if (socios && socios.length > 0) {
            socios.forEach(socio => {
                const querySocio = 'INSERT INTO SOCIO (id_cliente, nome, cpf, endereco, cep, telefone) VALUES (?, ?, ?, ?, ?, ?)';
                mysqlConn.query(querySocio, [id_cliente, socio.nome, socio.cpf, socio.endereco, socio.cep, socio.telefone], (error, results, fields) => {
                    if (error) {
                        console.error('Erro ao adicionar sócio:', error);
                    }
                });
            });
        }
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

function remover(nome, callback) {
    // Primeiro, obtenha o ID do cliente a ser removido
    mysqlConn.query('SELECT IDCLIENTE FROM CLIENTE WHERE NOME = ?', [nome], (error, results, fields) => {
        if (error) {
            console.error('Erro ao buscar o ID do cliente:', error);
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
