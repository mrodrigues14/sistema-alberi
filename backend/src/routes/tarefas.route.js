const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../base/database');
const {
    listarTarefas,
    adicionarTarefa,
    atualizarStatus,
    deletarTarefa,
    consultarTarefa,
    editarTarefa,
    consultarUsuarios,
    consultarEmpresas,
    atualizarDescricao, listarTarefasVinculadas
} = require('../repositories/tarefas.repository');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/tarefas/tarefas.html'));
});

router.get('/erro', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/tarefas/erro.html'));
});

router.get('/tarefas', (req, res) => {
    const {idcliente, idusuario, isAdmin} = req.query;
    listarTarefas(idcliente, idusuario, isAdmin === 'true', (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json(result);
        }
    });
});

router.post('/adicionartarefa', (req, res) => {
    const { titulo, idcliente, dataLimite, idusuario, descriptions, recurrenceDay, status } = req.body;
    if (!titulo || !idcliente) {
        return res.status(400).json({ error: 'Dados incompletos' });
    }
    adicionarTarefa(titulo, status, idcliente, dataLimite, idusuario, descriptions, recurrenceDay, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json({ success: true });
    });
});

router.post('/atualizartarefa', (req, res) => {
    const { idtarefa, newStatus, finalDate } = req.body;
    atualizarStatus(idtarefa, newStatus, finalDate, (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json(result);
        }
    });
});

router.get('/editartarefa', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/tarefas/paginaEditarTarefa/editarTarefa.html'));
});

router.post('/editartarefa', (req, res) => {
    const { idtarefa, titulo, dataLimite, descriptions, idusuario, idempresa } = req.body;
    if (!titulo) {
        res.status(400).json({error: 'Faltando campos'});
        return;
    }
    editarTarefa(idtarefa, titulo, dataLimite, descriptions, idusuario, idempresa, (err, result) => {
        if (err) {
            console.error('Erro ao atualizar a tarefa:', err);
            res.status(500).json({ error: 'Erro ao atualizar a tarefa' });
        } else {
            res.json({ success: true });
        }
    });
});

router.get('/editartarefa/gettarefa', (req, res) => {
    const {idtarefa, idusuario} = req.query;
    consultarTarefa(idtarefa, idusuario, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json(result);
    });
});

router.post('/deletartarefa', (req, res) => {
    const {idtarefa} = req.body;
    deletarTarefa(idtarefa, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.redirect('/tarefas');
    });
});

router.post('/consultarEmpresas', (req, res) => {
    db.query('SELECT NOME FROM CLIENTE', (error, results) => {
        if (error) {
            console.error('Erro durante a busca por empresa no banco de dados:', error);
            return res.status(500).send('Server error');
        }
        if (results.length > 0) {
            res.json(results.map(result => result.nome));
        } else {
            res.status(404).send({ message: 'Nenhuma empresa encontrada' });
        }
    });
});

router.get('/listaUsuarios', (req, res) => {
    consultarUsuarios((err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json(result);
    });
});

router.get('/listaEmpresas', (req, res) => {
    consultarEmpresas((err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json(result);
    });
});

// Nova rota para atualizar o status da descrição
router.post('/updateDescriptionStatus', (req, res) => {
    const { idtarefa, descriptionIndex, completed } = req.body;
    atualizarDescricao(idtarefa, descriptionIndex, completed, (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json(result);
        }
    });
});

router.get('/tarefasVinculadas', (req, res) => {
    const { idusuario } = req.query;
    listarTarefasVinculadas(idusuario, (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json(result);
        }
    });
});

module.exports = router;
