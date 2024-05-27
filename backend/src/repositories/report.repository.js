const mysqlConn = require("../base/database");

function inserirReport(titulo, descricao, data, arquivos, ID_USUARIO, prioridade, tipoArquivo, funcionalidadeAfetada, callback = () => {}) {
    const situacao = 'Não iniciado'; // Valor padrão para a coluna SITUACAO
    mysqlConn.query(`INSERT INTO REPORT (TITULO, DESCRICAO, DATA, ARQUIVOS, ID_USUARIO, PRIORIDADE, TIPO_ARQUIVO, FUNCIONALIDADE_AFETADA, SITUACAO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [titulo, descricao, data, arquivos, ID_USUARIO, prioridade, tipoArquivo, funcionalidadeAfetada, situacao],
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

function getReportFileById(reportId, callback) {
    mysqlConn.query(`SELECT ARQUIVOS FROM REPORT WHERE ID = ?`, [reportId], (err, result) => {
        if (err) {
            callback(err, null);
        } else {
            if (result.length > 0) {
                callback(null, result[0].ARQUIVOS);
            } else {
                callback(new Error("Report not found"), null);
            }
        }
    });
}

module.exports = {
    inserirReport,
    getReportsByUserId,
    getReportFileById
};
