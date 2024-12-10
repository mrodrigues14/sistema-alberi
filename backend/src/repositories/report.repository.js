const mysqlConn = require("../base/database");

function inserirReport(titulo, descricao, data, arquivos, ID_USUARIO, prioridade, tipoArquivo, funcionalidadeAfetada, callback = () => {}) {
    const situacao = 'Não iniciado';
    mysqlConn.query(`INSERT INTO REPORT (TITULO, DESCRICAO, DATA, ARQUIVO, ID_USUARIO, PRIORIDADE, TIPO, FUNCIONALIDADE_AFETADA, SITUACAO, DESCRICAO_RECUSA) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [titulo, descricao, data, arquivos, ID_USUARIO, prioridade, tipoArquivo, funcionalidadeAfetada, situacao, null],
        (err, result, fields) => {
            callback(err, result);
        });
}

function getReportsByUserId(ID_USUARIO, page, limit, situacao, callback) {
    const offset = (page - 1) * limit;
    let query = `
        SELECT R.*, U.NOME_DO_USUARIO 
        FROM REPORT R
        JOIN USUARIOS U ON R.ID_USUARIO = U.IDUSUARIOS
    `;
    let params = [];

    if (situacao) {
        query += `WHERE R.SITUACAO = ? `;
        params.push(situacao);
    }

    query += `ORDER BY R.DATA DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    mysqlConn.query(query, params, (err, results) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, results);
        }
    });
}


function getReportFilesByRange(callback) {
    const query = "SELECT ID, TITULO, ARQUIVO FROM REPORT/*  WHERE SITUACAO IN ('Em desenvolvimento', 'Não iniciado') */";
    mysqlConn.query(query, (err, result) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}


function updateReportStatus(reportId, status, callback) {
    mysqlConn.query(`UPDATE REPORT SET SITUACAO = ? WHERE ID = ?`, [status, reportId], (err, result) => {
        callback(err, result);
    });
}

function recusarReport(reportId, motivo, callback) {
    const situacao = 'Recusado';
    mysqlConn.query(`UPDATE REPORT SET SITUACAO = ?, DESCRICAO_RECUSA = ? WHERE ID = ?`, [situacao, motivo, reportId], (err, result) => {
        callback(err, result);
    });
}

function editarReport(reportId, titulo, descricao, arquivos, prioridade, funcionalidadeAfetada, callback) {
    mysqlConn.query(`UPDATE REPORT SET TITULO = ?, DESCRICAO = ?, ARQUIVO = ?, PRIORIDADE = ?, FUNCIONALIDADE_AFETADA = ? WHERE ID = ?`,
        [titulo, descricao, arquivos, prioridade, funcionalidadeAfetada, reportId],
        (err, result) => {
            callback(err, result);
        });
}


function getReportById(reportId, callback) {
    mysqlConn.query(`SELECT * FROM REPORT WHERE ID = ?`, [reportId], (err, result) => {
        if (err) {
            callback(err, null);
        } else {
            if (result.length > 0) {
                // Converte o campo ARQUIVO de Buffer para JSON
                const report = result[0];
                if (report.ARQUIVO) {
                    try {
                        report.ARQUIVO = JSON.parse(report.ARQUIVO.toString());
                    } catch (parseError) {
                        console.error('Erro ao parsear o campo ARQUIVO:', parseError);
                        report.ARQUIVO = []; // Define como array vazio caso falhe
                    }
                }
                callback(null, report);
            } else {
                callback(new Error('Relatório não encontrado'), null);
            }
        }
    });
}


function deletarReport(reportId, callback) {
    mysqlConn.query('DELETE FROM REPORT WHERE ID = ?', [reportId], (err, result) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function addAttachmentsToReport(reportId, attachments) {
    return new Promise((resolve, reject) => {
        const attachmentsJson = JSON.stringify(attachments);
        mysqlConn.query(
            `UPDATE REPORT SET ARQUIVO = ? WHERE ID = ?`,
            [attachmentsJson, reportId],
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }
        );
    });
}

module.exports = {
    inserirReport,
    getReportsByUserId,
    getReportFilesByRange,
    updateReportStatus,
    recusarReport,
    editarReport,
    getReportById,
    deletarReport,
    addAttachmentsToReport
};