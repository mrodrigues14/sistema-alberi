const mysqlConn = require('../base/database.js');

function listarTarefas(idcliente, idusuario, isAdmin, callback) {
    let params = [];

    if (idcliente === "68") {
        query = `
        SELECT T.IDTAREFA, T.TITULO, T.STATUS,
               IFNULL(T.DATA_LIMITE, '0000-00-00') AS DATA_LIMITE,
               IFNULL(T.DATA_INICIO, '0000-00-00') AS DATA_INICIO,
               IFNULL(T.DATA_CONCLUSAO, '0000-00-00') AS DATA_CONCLUSAO,
               T.ID_CLIENTE, C.NOME, T.ID_USUARIO, U.NOME_DO_USUARIO, T.DESCRICAO
        FROM TAREFAS AS T
        INNER JOIN USUARIOS AS U ON T.ID_USUARIO = U.IDUSUARIOS
        INNER JOIN CLIENTE AS C ON T.ID_CLIENTE = C.IDCLIENTE
    `;
        params.push(idcliente);
    } else {
        query = `
        SELECT T.IDTAREFA, T.TITULO, T.STATUS,
               IFNULL(T.DATA_LIMITE, '0000-00-00') AS DATA_LIMITE,
               IFNULL(T.DATA_INICIO, '0000-00-00') AS DATA_INICIO,
               IFNULL(T.DATA_CONCLUSAO, '0000-00-00') AS DATA_CONCLUSAO,
               T.ID_CLIENTE, C.NOME, T.ID_USUARIO, U.NOME_DO_USUARIO, T.DESCRICAO
        FROM TAREFAS AS T
        INNER JOIN USUARIOS AS U ON T.ID_USUARIO = U.IDUSUARIOS
        INNER JOIN CLIENTE AS C ON T.ID_CLIENTE = C.IDCLIENTE
        WHERE T.ID_CLIENTE = ?
    `;
        params = [idcliente];
    }

    query += ' ORDER BY T.DATA_LIMITE ASC';

    mysqlConn.query(query, params, function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            result.forEach(task => {
                task.DATA_LIMITE = (task.DATA_LIMITE === '0000-00-00') ? null : task.DATA_LIMITE;
                task.DATA_INICIO = (task.DATA_INICIO === '0000-00-00') ? null : task.DATA_INICIO;
                task.DATA_CONCLUSAO = (task.DATA_CONCLUSAO === '0000-00-00') ? null : task.DATA_CONCLUSAO;
            });
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

function adicionarTarefa(titulo, status, idcliente, dataLimite, idusuario, descricao, recurrenceDay, callback) {
    const dataInicio = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');
    mysqlConn.query(`INSERT INTO TAREFAS (IDTAREFA, TITULO, STATUS, DATA_LIMITE, DATA_INICIO, ID_CLIENTE, ID_USUARIO, DESCRICAO, RECORRENCIA) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [titulo, status, dataLimite || '', dataInicio.toISOString().split('T')[0], idcliente, idusuario, descricao || '', recurrenceDay],
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

function atualizarStatus(idtarefa, newStatus, finalDate, callback) {
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
            let query = 'UPDATE TAREFAS SET STATUS = ?';
            let params = [newStatus];

            if (newStatus === 'Finalizado' && finalDate) {
                query += ', DATA_CONCLUSAO = ?';
                params.push(finalDate);
            }

            query += ' WHERE IDTAREFA = ?';
            params.push(idtarefa);

            mysqlConn.query(query, params, function(err, result) {
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

function editarTarefa(idtarefa, titulo, dataLimite, descricao, idusuario, idempresa, callback) {
    mysqlConn.query('UPDATE TAREFAS SET TITULO = ?, DATA_LIMITE = ?, DESCRICAO = ?, ID_USUARIO = ?, ID_CLIENTE = ? WHERE IDTAREFA = ?',
        [titulo, dataLimite || '', descricao || '', idusuario, idempresa, idtarefa], function(err, result) {
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
    mysqlConn.query('SELECT IDCLIENTE, NOME FROM CLIENTE ORDER BY NOME ASC', (err, result, fields) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

module.exports = {listarTarefas, adicionarTarefa, atualizarStatus, deletarTarefa, consultarTarefa, editarTarefa, consultarUsuarios, consultarEmpresas};