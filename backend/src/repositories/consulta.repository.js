const mysqlConn = require("../base/database");

function buscar(banco, data, cliente, callback){
    const dataProximoMes = new Date(data);
    dataProximoMes.setMonth(dataProximoMes.getMonth() + 1);

    const parametros = [banco, data, dataProximoMes.toISOString().split('T')[0], cliente];

    mysqlConn.query(`SELECT DATA, CATEGORIA, NOMENOEXTRATO, TIPODETRANSACAO, VALOR, B.NOME AS NOME_BANCO, C.NOME AS NOME_CLIENTE
                    FROM EXTRATO
                    INNER JOIN BANCO B ON EXTRATO.FK_BANCO_IDBANCO = B.IDBANCO
                    INNER JOIN CLIENTE C ON EXTRATO.ID_CLIENTE = C.IDCLIENTE
                    WHERE FK_BANCO_IDBANCO = ? AND DATA >= ? AND DATA < ? AND ID_CLIENTE = ?`, parametros,
        function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

module.exports = {buscar};