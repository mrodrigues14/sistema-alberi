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

function adicionarTarefa(tarefa, idcliente, dataLimite, idusuario, recurrenceDay, callback) {
    const dataInicio = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');
    const status = "PARA FAZER"; // Certifique-se de que o status está definido corretamente
    mysqlConn.query(`INSERT INTO TAREFAS (IDTAREFA, TITULO, STATUS, DATA_LIMITE, DATA_INICIO, ID_CLIENTE, ID_USUARIO, RECORRENCIA) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?)`,
        [tarefa, status, dataLimite, dataInicio.toISOString().split('T')[0], idcliente, idusuario, recurrenceDay],
        (err, result, fields) => {
            callback(err, result);
        });
}



function deletarTarefa(idtarefa, callback){
    mysqlConn.query(`DELETE FROM TAREFAS WHERE IDTAREFA = ?`, [idtarefa], (err, result) =>{
        callback(err, result);
    });
}

function atualizarStatus(idtarefa, newStatus, callback) {
    // First, get the current status of the task
    mysqlConn.query('SELECT STATUS FROM TAREFAS WHERE IDTAREFA = ?', [idtarefa], function(err, results) {
        if (err) {
            console.error('Database error:', err);
            return callback(err);
        }

        if (results.length === 0) {
            return callback(new Error('No task found with the given ID'));
        }

        const currentStatus = results[0].STATUS;

        // Only update if the new status is different
        if (currentStatus !== newStatus) {
            mysqlConn.query('UPDATE TAREFAS SET STATUS = ? WHERE IDTAREFA = ?', [newStatus, idtarefa], function(err, result) {
                if (err) {
                    console.error('Database error:', err);
                    return callback(err);
                }

                if (result.warningStatus) {
                    console.warn('Update warning:', result.info);
                }

                console.log('Update result:', result);
                callback(null, result);
            });
        } else {
            console.log('No status change required for task:', idtarefa);
            callback(null, { message: 'No status change required' });
        }
    });
}


function editarTarefa(idtarefa, titulo, dataLimite, callback){
    mysqlConn.query('UPDATE TAREFAS SET TITULO = ?, DATA_LIMITE = ? WHERE IDTAREFA = ?', [titulo, dataLimite, idtarefa], function(err, result){
        callback(err, result);
    });
}

function consultarUsuarios(callback){
    mysqlConn.query(`SELECT NOME_DO_USUARIO, IDUSUARIOS FROM USUARIOS`, function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}


module.exports = {listarTarefas, adicionarTarefa, atualizarStatus, deletarTarefa, consultarTarefa, editarTarefa, consultarUsuarios};