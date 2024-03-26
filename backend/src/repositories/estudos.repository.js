const mysqlConn = require('../base/database.js');

function saldoInicial(empresa, data, callback){
    let dataInicial = new Date(data);
    dataInicial.setMonth(dataInicial.getMonth(), 1);
    let ano = dataInicial.getFullYear();
    let mes = dataInicial.getMonth() + 1;
    mes = mes < 10 ? '0' + mes : mes;
    let dia = dataInicial.getDate();
    dia = dia < 10 ? '0' + dia : dia;
    let dataMesAnterior = `${ano}-${mes}-${dia}`;

    const parametros = [
        empresa,
        dataMesAnterior,
        data
    ];

    mysqlConn.query(`SELECT
                        b.nome AS banco,
                        SUM(CASE WHEN e.TIPO_DE_TRANSACAO = 'ENTRADA' THEN e.VALOR ELSE 0 END) -
                        SUM(CASE WHEN e.TIPO_DE_TRANSACAO = 'SAIDA' THEN e.VALOR ELSE 0 END) AS saldo
                    FROM
                        EXTRATO e
                    INNER JOIN
                        BANCO b ON e.ID_BANCO = b.IDBANCO
                    WHERE e.ID_CLIENTE = ? AND e.DATA >= ? and e.DATA < ?
                    GROUP BY
                        b.nome`, parametros,
        function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        });
}


function entradaCategoria(empresa, data, callback){
    let dataFinal = new Date(data);
    dataFinal.setMonth(dataFinal.getMonth()+2, 1);
    let ano = dataFinal.getFullYear();
    let mes = dataFinal.getMonth() + 1;
    mes = mes < 10 ? '0' + mes : mes;
    let dia = dataFinal.getDate();
    dia = dia < 10 ? '0' + dia : dia;
    let dataProxMes = `${ano}-${mes}-${dia}`;
    
    const parametros = [empresa, data, dataProxMes];
    mysqlConn.query(`SELECT
                        e.categoria,
                        SUM(CASE WHEN e.TIPO_DE_TRANSACAO = 'ENTRADA' THEN e.VALOR ELSE 0 END) AS valor
                    FROM
                        EXTRATO e
                    WHERE e.ID_CLIENTE = ? AND e.DATA >= ? and e.DATA <= ?
                    GROUP BY
                        e.categoria
                    HAVING 
                        SUM(e.valor) > 0
                    `, parametros,
        function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        });
}


function saidaCategoria(empresa, data, callback){
    let dataFinal = new Date(data);
    dataFinal.setMonth(dataFinal.getMonth()+2, 1);
    let ano = dataFinal.getFullYear();
    let mes = dataFinal.getMonth() + 1;
    mes = mes < 10 ? '0' + mes : mes;
    let dia = dataFinal.getDate();
    dia = dia < 10 ? '0' + dia : dia;
    let dataProxMes = `${ano}-${mes}-${dia}`;
    const parametros = [empresa, data, dataProxMes];
    mysqlConn.query(`SELECT
                        e.categoria,
                        SUM(CASE WHEN e.TIPO_DE_TRANSACAO = 'SAIDA' THEN e.VALOR ELSE 0 END) AS valor
                    FROM
                        EXTRATO e
                    WHERE
                        e.ID_CLIENTE = ? AND e.DATA >= ? AND e.DATA <= ?
                    GROUP BY
                        e.categoria
                    HAVING
                        SUM(e.valor) > 0;
                    `, parametros,
        function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        });
}

function saldoConta(empresa, data, callback){

}


function totalEntradasPorMes(empresa, ano, callback) {
    console.log(`Recebendo empresa: ${empresa}, ano: ${ano}`);
    mysqlConn.query(`
        SELECT 
            MONTH(DATA) as mes, 
            SUM(valor) as total
        FROM 
            EXTRATO 
        WHERE 
            ID_CLIENTE = ? AND 
            YEAR(DATA) = ? AND 
            TIPO_DE_TRANSACAO = 'ENTRADA'
        GROUP BY 
            MONTH(DATA)
    `, [empresa, ano], function(err, results) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, results);
        }
    });
}

function getMeses(ano, empresaNome, callback) {
    mysqlConn.query(`
        SELECT IDCLIENTE FROM cliente WHERE NOME = ?
    `, [empresaNome], function(err, result) {
        if (err) {
            return callback(err, null);
        }
        if (result.length === 0) {
            return callback(new Error('Nenhum cliente encontrado com o nome da empresa fornecido.'), null);
        }

        const idCliente = result[0].IDCLIENTE;

        mysqlConn.query(`
            SELECT DISTINCT MONTH(DATA) AS mes 
            FROM extrato 
            WHERE YEAR(DATA) = ? AND ID_CLIENTE = ?
            ORDER BY mes;
        `, [ano, idCliente], function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                const mesesNomes = result.map(row => getNomeMesPortugues(row.mes));
                callback(null, mesesNomes);
            }
        });
    });
}

function getNomeMesPortugues(mesNumero) {
    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return meses[mesNumero - 1];
}


function getReceitaLiquida(mesNome, ano, empresaNome, callback) {
    const mes = getNumeroMesPortugues(mesNome);

    mysqlConn.query(`
        SELECT IDCLIENTE FROM cliente WHERE NOME = ?
    `, [empresaNome], function(err, result) {
        if (err) {
            return callback(err, null); // Retorne o erro se houver
        }
        if (result.length === 0) {
            return callback(new Error('Nenhum cliente encontrado com o nome da empresa fornecido.'), null);
        }

        const idCliente = result[0].IDCLIENTE;

        mysqlConn.query(`
            SELECT SUM(valor) AS receita_liquida
            FROM extrato
            WHERE ID_CLIENTE = ? AND YEAR(DATA) = ? AND MONTH(DATA) = ? AND tipo_de_transacao = 'SAIDA'
        `, [idCliente, ano, mes], function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result[0] ? result[0].receita_liquida : 0);
            }
        });
    });
}



function getValoresCategoria(categoria, mesNome, ano, empresaNome, callback) {
    const mes = getNumeroMesPortugues(mesNome);
    const dataInicio = `${ano}-${mes.toString().padStart(2, '0')}-01`;
    const dataFim = new Date(ano, mes, 0).toISOString().split('T')[0];

    mysqlConn.query(`
        SELECT IDCLIENTE FROM cliente WHERE NOME = ?
    `, [empresaNome], function(err, result) {
        if (err) {
            return callback(err, null);
        }
        if (result.length === 0) {
            return callback(new Error('Nenhum cliente encontrado com o nome da empresa fornecido.'), null);
        }

        const idCliente = result[0].IDCLIENTE;

        mysqlConn.query(`
            SELECT 
                MONTH(DATA) as mes, 
                SUM(valor) AS total_categoria, 
                (SELECT SUM(valor) FROM extrato WHERE ID_CLIENTE = ? AND DATA >= ? AND DATA <= ? AND tipo_de_transacao = 'ENTRADA') AS receita_liquida
            FROM 
                extrato 
            WHERE 
                categoria = ? AND 
                ID_CLIENTE = ? AND 
                DATA >= ? AND 
                DATA <= ? AND 
                tipo_de_transacao = 'SAIDA'
            GROUP BY 
                MONTH(DATA)
        `, [idCliente, dataInicio, dataFim, categoria, idCliente, dataInicio, dataFim], function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result[0] ? {
                    mes: mes,
                    total_categoria: result[0].total_categoria,
                    receita_liquida: result[0].receita_liquida
                } : {mes: mes, total_categoria: 0, receita_liquida: 0});
            }
        });
    });
}

function getNumeroMesPortugues(nomeMes) {
    const meses = {
        "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4, "Maio": 5, "Junho": 6,
        "Julho": 7, "Agosto": 8, "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12
    };
    return meses[nomeMes];
}

function getCategoria(empresaNome, ano, callback) {
    mysqlConn.query(`
        SELECT IDCLIENTE FROM cliente WHERE NOME = ?
    `, [empresaNome], function(err, result) {
        if (err) {
            return callback(err, null);
        }
        if (result.length === 0) {
            return callback(new Error('Nenhum cliente encontrado com o nome da empresa fornecido.'), null);
        }

        const idCliente = result[0].IDCLIENTE;

        mysqlConn.query(`
            SELECT DISTINCT categoria
            FROM extrato
            WHERE ID_CLIENTE = ? AND YEAR(DATA) = ?
            ORDER BY categoria;
        `, [idCliente, ano], function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                const categorias = result.map(row => row.categoria);
                callback(null, categorias);
            }
        });
    });
}




module.exports = {saldoInicial, entradaCategoria, saidaCategoria, totalEntradasPorMes, getMeses, getValoresCategoria, getReceitaLiquida, getCategoria};