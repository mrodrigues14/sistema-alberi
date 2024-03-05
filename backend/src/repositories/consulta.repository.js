const mysqlConn = require("../base/database");

function buscar(banco, data, cliente, callback){
    const dataProximoMes = new Date(data);
    dataProximoMes.setMonth(dataProximoMes.getMonth() + 1);

    const parametros = [banco, data, dataProximoMes.toISOString().split('T')[0], cliente];

    mysqlConn.query(`SELECT DATA, CATEGORIA, DESCRICAO, NOME_NO_EXTRATO, TIPO_DE_TRANSACAO, VALOR, B.NOME AS NOME_BANCO, C.NOME AS NOME_CLIENTE
                    FROM EXTRATO
                    INNER JOIN BANCO B ON EXTRATO.ID_BANCO = B.IDBANCO
                    INNER JOIN CLIENTE C ON EXTRATO.ID_CLIENTE = C.IDCLIENTE
                    WHERE ID_BANCO = ? AND DATA >= ? AND DATA < ? AND ID_CLIENTE = ?`, parametros,
        function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

module.exports = {buscar};