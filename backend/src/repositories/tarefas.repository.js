const mysqlConn = require('../base/database.js');

function listarTarefas(idcliente, callback){
    mysqlConn.query(`SELECT IDTAREFA, TITULO, STATUS, DATA_LIMITE, ID_CLIENTE FROM TAREFAS WHERE id_cliente = ?
                     ORDER BY DATA_LIMITE ASC`, [idcliente], function(err, result, fields) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function adicionarTarefa(tarefa, idcliente, dataLimite, callback) {
    mysqlConn.query(`INSERT INTO TAREFAS (IDTAREFA, TITULO, STATUS, DATA_LIMITE, ID_CLIENTE) VALUES (NULL, ?, ?, ?, ?)`,
        [tarefa, "NÃO FOI INICIADO", dataLimite, idcliente],
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

module.exports = {listarTarefas, adicionarTarefa, atualizarStatus, deletarTarefa};