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
                        extrato e
                    INNER JOIN
                        banco b ON e.ID_BANCO = b.IDBANCO
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
                        extrato e
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
                        extrato e
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
            extrato 
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

module.exports = {saldoInicial, entradaCategoria, saidaCategoria, totalEntradasPorMes};