const mysqlConn = require('../base/database.js');

function converterDataParaFormatoISO(dataStr) {
    var partesDaData = dataStr.split('/');
    return partesDaData[2] + '-' + partesDaData[1] + '-' + partesDaData[0];
}

function saldoInicial(empresa, data, callback){
    let dataMesAnterior = new Date(data);
    dataMesAnterior.setMonth(dataMesAnterior.getMonth() - 1);
    dataMesAnterior.setDate(1);
    dataMesAnterior = dataMesAnterior.toLocaleDateString().split('T')[0];
    dataMesAnterior = converterDataParaFormatoISO(dataMesAnterior);

    const parametros = [
        empresa,
        dataMesAnterior,
        data
    ];

    mysqlConn.query(`SELECT
                        b.nome AS banco,
                        SUM(CASE WHEN e.tipoDeTransacao = 'ENTRADA' THEN e.valor ELSE 0 END) -
                        SUM(CASE WHEN e.tipoDeTransacao = 'SAIDA' THEN e.valor ELSE 0 END) AS saldo
                    FROM
                        extrato e
                    INNER JOIN
                        banco b ON e.FK_BANCO_idBanco = b.idBanco
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
    const dataProximoMes = new Date(data);
    dataProximoMes.setMonth(dataProximoMes.getMonth() + 1);
    const parametros = [empresa, data, dataProximoMes.toISOString().split('T')[0]];

    mysqlConn.query(`SELECT
                        e.categoria,
                        SUM(CASE WHEN e.tipoDeTransacao = 'ENTRADA' THEN e.valor ELSE 0 END) AS valor
                        FROM
                            extrato e
                        WHERE e.ID_CLIENTE = ? AND e.DATA >= ? and e.DATA < ?
                        GROUP BY
                            e.categoria
                        HAVING 
                            SUM(e.valor > 0)`, parametros,
        function(err, result, fields) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
        });
}

function saidaCategoria(empresa, data, callback){
    const dataProximoMes = new Date(data);
    dataProximoMes.setMonth(dataProximoMes.getMonth() + 1);
    const parametros = [empresa, data, dataProximoMes.toISOString().split('T')[0]];

    mysqlConn.query(`SELECT
                        e.categoria,
                        SUM(CASE WHEN e.tipoDeTransacao = 'SAIDA' THEN e.valor ELSE 0 END) AS valor
                    FROM
                        extrato e
                    WHERE
                        e.ID_CLIENTE = ? AND e.DATA >= ? AND e.DATA < ? AND e.tipoDeTransacao = 'SAIDA'
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

module.exports = {saldoInicial, entradaCategoria, saidaCategoria};