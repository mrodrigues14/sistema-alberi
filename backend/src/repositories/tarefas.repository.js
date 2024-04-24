const mysqlConn = require('../base/database.js');

function listarTarefas(idcliente, idusuario, isAdmin, callback) {
    let query = '';
    let params = [];

    if (isAdmin) {
        query = `
    SELECT T.IDTAREFA, T.TITULO, T.STATUS, T.DATA_LIMITE, T.DATA_INICIO, T.DATA_CONCLUSAO, T.ID_CLIENTE, U.NOME_DO_USUARIO 
    FROM TAREFAS AS T
    INNER JOIN USUARIOS AS U ON T.ID_USUARIO = U.IDUSUARIOS
    ORDER BY T.DATA_LIMITE ASC
`;    } else {
        query = `SELECT IDTAREFA, TITULO, STATUS, DATA_LIMITE, DATA_INICIO, DATA_CONCLUSAO, ID_CLIENTE FROM TAREFAS WHERE id_cliente = ? AND ID_USUARIO = ? ORDER BY DATA_LIMITE ASC`;
        params = [idcliente, idusuario];
    }

    mysqlConn.query(query, params, function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function consultarTarefa(idtarefa, idusuario, callback){
    mysqlConn.query(`SELECT IDTAREFA, TITULO, STATUS, DATA_LIMITE, ID_CLIENTE FROM TAREFAS WHERE idtarefa = ? AND ID_USUARIO =?`, [idtarefa, idusuario], function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });

}

function adicionarTarefa(tarefa, idcliente, dataLimite, idusuario,recurrenceDay, callback) {
    const dataInicio = new Date().toISOString().split('T')[0];
    mysqlConn.query(`INSERT INTO TAREFAS (IDTAREFA, TITULO, STATUS, DATA_LIMITE, DATA_INICIO, ID_CLIENTE, ID_USUARIO, RECORRENCIA) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?)`,
        [tarefa, "NÃO FOI INICIADO", dataLimite, dataInicio, idcliente, idusuario,recurrenceDay ],
        (err, result, fields) => {
            callback(err, result);
        });
}

function deletarTarefa(idtarefa, callback){
    mysqlConn.query(`DELETE FROM TAREFAS WHERE IDTAREFA = ?`, [idtarefa], (err, result) =>{
        callback(err, result);
    });
}

function atualizarStatus(idtarefa, callback) {
    mysqlConn.query('SELECT STATUS, DATA_INICIO, DATA_CONCLUSAO FROM TAREFAS WHERE IDTAREFA = ?', [idtarefa], function(err, results) {
        if (err) {
            return callback(err);
        }

        if (results.length === 0) {
            return callback(new Error('Nenhuma tarefa encontrada com o id fornecido.'));
        }

        let proximoStatus;
        switch (results[0].STATUS) {
            case 'CONCLUÍDO':
                proximoStatus = 'NÃO FOI INICIADO';
                break;
            case 'PENDENTE':
                proximoStatus = 'CONCLUÍDO';
                break;
            case 'NÃO FOI INICIADO':
                proximoStatus = 'PENDENTE';
                break;
            default:
                return callback(new Error('Status atual desconhecido.'));
        }

        let dataInicio = results[0].DATA_INICIO;
        let dataConclusao = '';

        if (proximoStatus === 'NÃO FOI INICIADO' || proximoStatus === 'PENDENTE' ) {
            dataConclusao = null;
        } else if (proximoStatus === 'CONCLUÍDO') {
            dataConclusao = new Date().toISOString().split('T')[0];
        }

        mysqlConn.query('UPDATE TAREFAS SET STATUS = ?, DATA_INICIO = ?, DATA_CONCLUSAO = ? WHERE IDTAREFA = ?', [proximoStatus, dataInicio, dataConclusao, idtarefa], function(err, result) {
            if (err) {
                return callback(err);
            }

            return callback(null, result, proximoStatus);
        });
    });
}

function editarTarefa(idtarefa, titulo, dataLimite, callback){
    mysqlConn.query('UPDATE TAREFAS SET TITULO = ?, DATA_LIMITE = ? WHERE IDTAREFA = ?', [titulo, dataLimite, idtarefa], function(err, result){
        callback(err, result);
    });
}

module.exports = {listarTarefas, adicionarTarefa, atualizarStatus, deletarTarefa, consultarTarefa, editarTarefa};