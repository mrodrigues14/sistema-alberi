const mysqlConn = require('../base/database');

async function adicionar(nome, telefone, cnpj, cpf) {
    if (cnpj === '') cnpj = null;
    if (cpf === '') cpf = null;
    mysqlConn.query('INSERT INTO CLIENTE (nome, telefone, cnpj, cpf) VALUES (?, ?, ?, ?)', [nome, telefone, cnpj, cpf], (error, results, fields) => {
        if (error) {
            console.error('Erro ao adicionar o cadastro:', error);
        }
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
    mysqlConn.query('DELETE FROM CLIENTE WHERE NOME = ?', [nome], (error, results, fields) => {
        if (error) {
            console.error('Erro ao remover o cadastro:', error);
            return callback(error, null);
        }
        callback(null, results);
    });
}

function editar(nomeAntigo, nomeNovo, cpfCnpj, callback) {
    const query = `
        UPDATE CLIENTE
        SET NOME = ?,
            CPF = IF(LENGTH(?) = 11, ?, CPF),
            CNPJ = IF(LENGTH(?) > 11, ?, CNPJ)
        WHERE NOME = ?`;

    mysqlConn.query(query, [nomeNovo, cpfCnpj, cpfCnpj, cpfCnpj, cpfCnpj, nomeAntigo], (error, results, fields) => {
        if (error) {
            console.error('Erro ao editar o cadastro:', error);
            return callback(error, null);
        }
        callback(null, results);
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
