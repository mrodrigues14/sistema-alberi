const mysqlConn = require('../base/database.js');

function listarTarefas(idcliente, idusuario, isAdmin, callback){
    let query = '';
    let params = [];

    if (isAdmin) {
        query = `
    SELECT T.IDTAREFA, T.TITULO, T.STATUS, T.DATA_LIMITE, T.ID_CLIENTE, U.NOME_DO_USUARIO 
    FROM TAREFAS AS T
    INNER JOIN USUARIOS AS U ON T.ID_USUARIO = U.IDUSUARIOS
    ORDER BY T.DATA_LIMITE ASC
`;    } else {
        query = `SELECT IDTAREFA, TITULO, STATUS, DATA_LIMITE, ID_CLIENTE FROM TAREFAS WHERE id_cliente = ? AND ID_USUARIO = ? ORDER BY DATA_LIMITE ASC`;
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
    mysqlConn.query(`SELECT IDTAREFA, TITULO, STATUS, DATA_LIMITE, ID_CLIENTE FROM TAREFAS WHERE idtarefa = ? AND ID_USUARIO =?`, [idtarefa], function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });

}

function adicionarTarefa(tarefa, idcliente, dataLimite, idusuario, callback) {
    mysqlConn.query(`INSERT INTO TAREFAS (IDTAREFA, TITULO, STATUS, DATA_LIMITE, ID_CLIENTE,ID_USUARIO) VALUES (NULL, ?, ?, ?, ?, ?)`,
        [tarefa, "NÃO FOI INICIADO", dataLimite, idcliente, idusuario],
        (err, result, fields) => {
            callback(err, result);
        });
}

function deletarTarefa(idtarefa, callback){
    mysqlConn.query(`DELETE FROM TAREFAS WHERE IDTAREFA = ?`, [idtarefa], (err, result) =>{
        callback(err, result);
    });
}

function atualizarStatus(idtarefa, callback){
    mysqlConn.query('SELECT STATUS FROM TAREFAS WHERE IDTAREFA = ?', [idtarefa], function(err, results) {
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

        mysqlConn.query('UPDATE TAREFAS SET STATUS = ? WHERE IDTAREFA = ?', [proximoStatus, idtarefa], function(err, result) {
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