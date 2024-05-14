const mysqlConn = require("../base/database");

function inserirReport(titulo, descricao, data, arquivo, ID_USUARIO, callback = () => {}) {
    mysqlConn.query(`INSERT INTO REPORT (TITULO, DESCRICAO, DATA, ARQUIVO, ID_USUARIO) VALUES (?, ?, ?, ?, ?)`,
        [titulo, descricao, data, arquivo, ID_USUARIO],
        (err, result, fields) => {
            callback(err, result);
        });
}

function getReportsByUserId(ID_USUARIO, callback) {
    mysqlConn.query(`SELECT * FROM REPORT WHERE ID_USUARIO = ?`, [ID_USUARIO], (err, results) => {
        callback(err, results);
    });
}

module.exports = {
    inserirReport,
    getReportsByUserId
};
