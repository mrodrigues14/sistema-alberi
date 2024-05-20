const mysqlConn = require("../base/database");

function inserirReport(titulo, descricao, data, arquivo, ID_USUARIO, prioridade, callback = () => {}) {
    const situacao = 'Não iniciado'; // Valor padrão para a coluna SITUACAO
    mysqlConn.query(`INSERT INTO REPORT (TITULO, DESCRICAO, DATA, ARQUIVO, ID_USUARIO, PRIORIDADE, SITUACAO) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [titulo, descricao, data, arquivo, ID_USUARIO, prioridade, situacao],
        (err, result, fields) => {
            callback(err, result);
        });
}

function getReportsByUserId(ID_USUARIO, page, limit, situacao, callback) {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM REPORT WHERE ID_USUARIO = ?`;
    let params = [ID_USUARIO];

    if (situacao) {
        query += ` AND SITUACAO = ?`;
        params.push(situacao);
    }

    query += ` ORDER BY DATA DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    mysqlConn.query(query, params, (err, results) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, results);
        }
    });
}

module.exports = {
    inserirReport,
    getReportsByUserId
};


module.exports = {
    inserirReport,
    getReportsByUserId
};

