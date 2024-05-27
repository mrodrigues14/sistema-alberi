const mysqlConn = require('../base/database.js');

function listarTarefas(idcliente, idusuario, isAdmin, callback) {
    let query = `
        SELECT T.IDTAREFA, T.TITULO, T.STATUS, T.DATA_LIMITE, T.DATA_INICIO, T.DATA_CONCLUSAO, T.ID_CLIENTE, C.NOME, T.ID_USUARIO, U.NOME_DO_USUARIO, T.DESCRICAO
        FROM TAREFAS AS T
        INNER JOIN USUARIOS AS U ON T.ID_USUARIO = U.IDUSUARIOS
        INNER JOIN CLIENTE AS C ON T.ID_CLIENTE = C.IDCLIENTE
    `;
    let params = [];

    if (isAdmin) {
    } else {
        query += ' WHERE T.ID_CLIENTE = ? AND T.ID_USUARIO = ?';
        params.push(idcliente, idusuario);
    }

    query += ' ORDER BY T.DATA_LIMITE ASC';

    mysqlConn.query(query, params, function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}




function consultarTarefa(idtarefa, idusuario, callback){
    mysqlConn.query(`SELECT IDTAREFA, TITULO, STATUS, DATA_LIMITE, ID_CLIENTE, DESCRICAO FROM TAREFAS WHERE idtarefa = ? AND ID_USUARIO =?`, [idtarefa, idusuario], function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });

}

function adicionarTarefa(titulo, idcliente, dataLimite, idusuario, descricao, recurrenceDay, callback) {
    const dataInicio = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');
    const status = "A Fazer";
    mysqlConn.query(`INSERT INTO TAREFAS (IDTAREFA, TITULO, STATUS, DATA_LIMITE, DATA_INICIO, ID_CLIENTE, ID_USUARIO, DESCRICAO, RECORRENCIA) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [titulo, status, dataLimite, dataInicio.toISOString().split('T')[0], idcliente, idusuario, descricao, recurrenceDay],
        (err, result, fields) => {
            if (err) {
                callback(err, null);
            } else {
                callback(null, result);
            }
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


function editarTarefa(idtarefa, titulo, dataLimite, descricao, idusuario, callback){
    mysqlConn.query('UPDATE TAREFAS SET TITULO = ?, DATA_LIMITE = ?, DESCRICAO = ?, ID_USUARIO = ? WHERE IDTAREFA = ?',
        [titulo, dataLimite, descricao, idusuario, idtarefa], function(err, result){
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

function consultarEmpresas(callback) {
    mysqlConn.query('SELECT IDCLIENTE, NOME FROM CLIENTE', (err, result, fields) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

module.exports = {listarTarefas, adicionarTarefa, atualizarStatus, deletarTarefa, consultarTarefa, editarTarefa, consultarUsuarios, consultarEmpresas};