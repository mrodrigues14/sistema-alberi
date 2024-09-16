const mysqlConn = require("../base/database");

function inserir(DATA, CATEGORIA, DESCRICAO, NOME_NO_EXTRATO, TIPO, VALOR, id_banco, id_empresa, FORNECEDOR, rubrica_contabil, callback) {

    const parameters = [DATA, CATEGORIA, DESCRICAO, NOME_NO_EXTRATO, TIPO, VALOR, id_banco, id_empresa, FORNECEDOR, rubrica_contabil];
    console.log(parameters);

    mysqlConn.query(
        `INSERT INTO EXTRATO (DATA, CATEGORIA, DESCRICAO, NOME_NO_EXTRATO, TIPO_DE_TRANSACAO, VALOR, ID_BANCO, ID_CLIENTE, FORNECEDOR, RUBRICA_CONTABIL)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        parameters,
        function(err, result, fields) {
            if (err) {
                console.error(`Erro ao inserir dados: ${err.message}`);
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}




function buscarBanco(idcliente, callback){
    mysqlConn.query(`SELECT B.IDBANCO, CONCAT(B.NOME, ' - ' ,B.TIPO) AS NOME_TIPO FROM BANCO B 
                     INNER JOIN RELACAOCLIENTEBANCO R ON B.IDBANCO = R.ID_BANCO
                     WHERE R.ID_CLIENTE = ?`, [idcliente], function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function buscarUltimasInsercoes(idcliente, callback) {
    const query = `
        SELECT EX.IDEXTRATO, 
               IFNULL(EX.DATA, '0000-00-00') AS DATA, 
               CAT.NOME AS CATEGORIA, 
               IFNULL(SUBCAT.NOME, '') AS SUBCATEGORIA,
               EX.DESCRICAO, 
               EX.NOME_NO_EXTRATO, 
               EX.TIPO_DE_TRANSACAO, 
               EX.VALOR, 
               CONCAT(B.NOME, ' - ', B.TIPO) AS NOME_BANCO, 
               C.NOME AS NOME_CLIENTE,
               F.NOME AS NOME_FORNECEDOR
        FROM EXTRATO EX
        INNER JOIN BANCO B ON EX.ID_BANCO = B.IDBANCO
        INNER JOIN CLIENTE C ON EX.ID_CLIENTE = C.IDCLIENTE
        LEFT JOIN FORNECEDOR F ON EX.ID_FORNECEDOR = F.IDFORNECEDOR
        LEFT JOIN CATEGORIA CAT ON EX.CATEGORIA = CAT.IDCATEGORIA
        LEFT JOIN CATEGORIA SUBCAT ON CAT.ID_CATEGORIA_PAI = SUBCAT.IDCATEGORIA
        WHERE EX.ID_CLIENTE = ?
        ORDER BY EX.IDEXTRATO DESC LIMIT 6`;

    mysqlConn.query(query, idcliente, function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function buscarIDEmpresa(nomeEmpresa, callback) {
    mysqlConn.query(
        `SELECT IDCLIENTE FROM CLIENTE WHERE NOME = ?`,
        [nomeEmpresa],
        function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}

function buscarCategorias(IDCLIENTE, callback) {
    mysqlConn.query(
        `SELECT C.IDCATEGORIA AS IDCATEGORIA, C.NOME AS NOME, C.ID_CATEGORIA_PAI AS ID_CATEGORIA_PAI 
        FROM CATEGORIA C
        INNER JOIN RELACAOCLIENTECATEGORIA RCC ON C.IDCATEGORIA = RCC.ID_CATEGORIA
        WHERE RCC.ID_CLIENTE = ?`, [IDCLIENTE],
        function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}

function deletarExtrato(idExtrato, callback) {
    let queryDeleteSubextrato;
    let queryDeleteExtrato;
    let params;

    if (Array.isArray(idExtrato) && idExtrato.length > 0) {
        const placeholders = idExtrato.map(() => '?').join(', ');

        queryDeleteSubextrato = `DELETE FROM SUBEXTRATO WHERE ID_EXTRATO_PRINCIPAL IN (${placeholders})`;

        queryDeleteExtrato = `DELETE FROM EXTRATO WHERE IDEXTRATO IN (${placeholders})`;

        params = idExtrato;
    } else {
        queryDeleteSubextrato = `DELETE FROM SUBEXTRATO WHERE ID_EXTRATO_PRINCIPAL = ?`;

        queryDeleteExtrato = `DELETE FROM EXTRATO WHERE IDEXTRATO = ?`;

        params = [idExtrato];
    }

    mysqlConn.query(queryDeleteSubextrato, params, function(err, result) {
        if (err) {
            callback(err, null);
        } else {
            mysqlConn.query(queryDeleteExtrato, params, function(err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, result);
                }
            });
        }
    });
}

// Listar anexos de um extrato
function listarAnexos(idExtrato, callback) {
    mysqlConn.query(
        `SELECT NOME_ARQUIVO FROM EXTRATO_ANEXOS WHERE ID_EXTRATO = ?`,
        [idExtrato],
        function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}

// Upload de anexo
function uploadAnexo(idExtrato, nomeArquivo, callback) {
    mysqlConn.query(
        `INSERT INTO EXTRATO_ANEXOS (ID_EXTRATO, NOME_ARQUIVO) VALUES (?, ?)`,
        [idExtrato, nomeArquivo],
        function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}

function inserirSubdivisao(idExtratoPrincipal, data, categoria, descricao, nomeExtrato, fornecedor, valorEntrada, valorSaida, callback) {
    const query = `INSERT INTO EXTRATO (ID_SUBEXTRATO, DATA, CATEGORIA, DESCRICAO, NOME_NO_EXTRATO, ID_FORNECEDOR, TIPO_DE_TRANSACAO, VALOR) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const tipoTransacao = valorEntrada > 0 ? 'ENTRADA' : 'SAIDA';
    const valor = valorEntrada > 0 ? valorEntrada : valorSaida;

    mysqlConn.query(query, [idExtratoPrincipal, data, categoria, descricao, nomeExtrato, fornecedor, tipoTransacao, valor], (err, result) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function buscarSaldoMesAnterior(clienteId, mesAno, callback) {
    const [ano, mes] = mesAno.split('-');
    const dataAtual = new Date(ano, mes - 1, 1);
    dataAtual.setMonth(dataAtual.getMonth() - 1);

    const mesAnterior = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const anoAnterior = dataAtual.getFullYear();
    const mesAnoAnterior = `${anoAnterior}-${mesAnterior}`;

    const query = `
        SELECT SALDO 
        FROM SALDO_INICIAL 
        WHERE ID_CLIENTE = ? AND MES_ANO = ?
        LIMIT 1
    `;

    mysqlConn.query(query, [clienteId, mesAnoAnterior], function(err, result) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result.length > 0 ? result[0] : { SALDO: 0 });
        }
    });
}


function verificarSaldoInicial(clienteId, bancoId, data, callback) {
    const query = `
        SELECT DEFINIDO_MANUALMENTE 
        FROM SALDO_INICIAL 
        WHERE ID_CLIENTE = ? AND ID_BANCO = ? AND MES_ANO = ? 
        LIMIT 1
    `;

    mysqlConn.query(query, [clienteId, bancoId, data], function(err, result) {
        if (err) {
            callback(err, null);
        } else {
            if (result.length > 0) {
                callback(null, result[0].DEFINIDO_MANUALMENTE);
            } else {
                callback(null, false);
            }
        }
    });
}

function inserirSubextrato(idExtratoPrincipal, data, categoria, descricao, observacao, fornecedor, valorEntrada, valorSaida, callback) {
    const query = `
        INSERT INTO SUBEXTRATO (ID_EXTRATO_PRINCIPAL, DATA, CATEGORIA, DESCRICAO, OBSERVACAO, ID_FORNECEDOR, TIPO_DE_TRANSACAO, VALOR) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const tipoTransacao = valorEntrada ? 'ENTRADA' : 'SAIDA';
    const valor = valorEntrada ? valorEntrada : valorSaida;

    mysqlConn.query(query, [idExtratoPrincipal, data, categoria, descricao, observacao, fornecedor, tipoTransacao, valor], (err, result) => {
        if (err) {
            console.error(`Erro ao inserir subextrato: ${err.message}`);
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function buscarSubextratos(idExtratoPrincipal, callback) {
    const query = `
        SELECT ID_SUBEXTRATO, DATA, CATEGORIA, DESCRICAO, OBSERVACAO, TIPO_DE_TRANSACAO, VALOR 
        FROM SUBEXTRATO 
        WHERE ID_EXTRATO_PRINCIPAL = ?
    `;

    mysqlConn.query(query, [idExtratoPrincipal], function(err, result) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

// Listar rubricas contábeis
function listarRubricasContabeis(callback) {
    mysqlConn.query(
        `SELECT * FROM RUBRICA_CONTABIL`,
        function (err, result, fields) {
            if (err) {
                console.error(`Erro ao listar rubricas contábeis: ${err.message}`);
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}

// Adicionar rubrica contábil
function adicionarRubricaContabil(nome, callback) {
    mysqlConn.query(
        `INSERT INTO RUBRICA_CONTABIL (NOME) VALUES (?)`,
        [nome],
        function (err, result, fields) {
            if (err) {
                console.error(`Erro ao adicionar rubrica contábil: ${err.message}`);
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}

// Editar rubrica contábil
function editarRubricaContabil(id, novoNome, callback) {
    mysqlConn.query(
        `UPDATE RUBRICA_CONTABIL SET NOME = ? WHERE ID = ?`,
        [novoNome, id],
        function (err, result, fields) {
            if (err) {
                console.error(`Erro ao editar rubrica contábil: ${err.message}`);
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}

// Deletar rubrica contábil
function deletarRubricaContabil(id, callback) {
    mysqlConn.query(
        `DELETE FROM RUBRICA_CONTABIL WHERE ID = ?`,
        [id],
        function (err, result, fields) {
            if (err) {
                console.error(`Erro ao deletar rubrica contábil: ${err.message}`);
                callback(err, null);
            } else {
                callback(null, result);
            }
        }
    );
}


module.exports = {listarRubricasContabeis, adicionarRubricaContabil, editarRubricaContabil, deletarRubricaContabil, buscarSubextratos, inserirSubextrato, inserir, buscarBanco, buscarUltimasInsercoes, buscarIDEmpresa, buscarCategorias, deletarExtrato, listarAnexos, uploadAnexo, inserirSubdivisao, buscarSaldoMesAnterior, verificarSaldoInicial};
