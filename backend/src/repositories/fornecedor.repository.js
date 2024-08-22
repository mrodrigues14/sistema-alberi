const mysqlConn = require("../base/database");

function adicionarFornecedor(nomeFornecedor, cnpjFornecedor, cpfFornecedor, tipoProduto, idcliente, callback) {
    if(cnpjFornecedor === "") cnpjFornecedor = null;
    if(cpfFornecedor === "") cpfFornecedor = null;
    if(tipoProduto === null) tipoProduto = " "
    const buscaFornecedorQuery = `
        SELECT IDFORNECEDOR FROM FORNECEDOR 
        WHERE NOME = ? AND (CNPJ = ? OR CPF = ?) LIMIT 1;
    `;

    mysqlConn.query(buscaFornecedorQuery, [nomeFornecedor, cnpjFornecedor, cpfFornecedor], function(err, results) {
        if (err) return callback(err);

        if (results.length > 0) {
            const fornecedorExistenteId = results[0].IDFORNECEDOR;
            const buscaRelacaoQuery = `
                SELECT * FROM RELACAOCLIENTEFORNECEDOR 
                WHERE ID_FORNECEDOR = ? AND ID_CLIENTE = ? LIMIT 1;
            `;

            mysqlConn.query(buscaRelacaoQuery, [fornecedorExistenteId, idcliente], function(err, results) {
                if (err) return callback(err);

                if (results.length === 0) {
                    const inserirRelacaoQuery = `
                        INSERT INTO RELACAOCLIENTEFORNECEDOR (ID_FORNECEDOR, ID_CLIENTE) 
                        VALUES (?, ?);
                    `;
                    mysqlConn.query(inserirRelacaoQuery, [fornecedorExistenteId, idcliente], callback);
                } else {
                    return callback(null, {message: 'A relação entre o fornecedor e o cliente já existe.'});
                }
            });
        } else {
            const inserirFornecedorQuery = `
                INSERT INTO FORNECEDOR (NOME, CNPJ, CPF, TIPO_DE_PRODUTO) 
                VALUES (?, ?, ?, ?);
            `;
            mysqlConn.query(inserirFornecedorQuery, [nomeFornecedor, cnpjFornecedor, cpfFornecedor, tipoProduto], function(err, result) {
                if (err) return callback(err);

                const novoFornecedorId = result.insertId;
                const inserirRelacaoQuery = `
                    INSERT INTO RELACAOCLIENTEFORNECEDOR (ID_FORNECEDOR, ID_CLIENTE) 
                    VALUES (?, ?);
                `;
                mysqlConn.query(inserirRelacaoQuery, [novoFornecedorId, idcliente], callback);
            });
        }
    });
}

function listarFornecedor(idcliente, callback) {
    const query = `SELECT IDFORNECEDOR, CONCAT(NOME, ' - ', TIPO_DE_PRODUTO) AS NOME_TIPO
                   FROM FORNECEDOR
                   INNER JOIN RELACAOCLIENTEFORNECEDOR ON FORNECEDOR.IDFORNECEDOR = RELACAOCLIENTEFORNECEDOR.ID_FORNECEDOR
                   WHERE ID_CLIENTE = ?
                   ORDER BY NOME`;
    mysqlConn.query(query, [idcliente], callback);
}


function removerFornecedor(idFornecedor, idcliente, callback) {
    const deleteRelacaoQuery = `
        DELETE FROM RELACAOCLIENTEFORNECEDOR 
        WHERE ID_FORNECEDOR = ? AND ID_CLIENTE = ?;
    `;

    mysqlConn.query(deleteRelacaoQuery, [idFornecedor, idcliente], function(err, result) {
        if (err) return callback(err);

        const checkRelacoesQuery = `
            SELECT COUNT(*) AS count FROM RELACAOCLIENTEFORNECEDOR 
            WHERE ID_FORNECEDOR = ?;
        `;

        mysqlConn.query(checkRelacoesQuery, [idFornecedor], function(err, results) {
            if (err) return callback(err);

            if (results[0].count === 0) {
                const deleteFornecedorQuery = `
                    DELETE FROM FORNECEDOR 
                    WHERE IDFORNECEDOR = ?;
                `;

                mysqlConn.query(deleteFornecedorQuery, [idFornecedor], function(err, result) {
                    if (err) return callback(err);
                    callback(null, result);
                });
            } else {
                callback(null, {message: 'Relação com o cliente removida, mas o fornecedor possui outras relações e não foi removido.'});
            }
        });
    });
}


module.exports = {adicionarFornecedor, listarFornecedor, removerFornecedor};