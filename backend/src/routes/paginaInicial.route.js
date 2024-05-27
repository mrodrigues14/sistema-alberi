const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../base/database');
const {listarTarefas} = require('../repositories/tarefas.repository.js');
const {adicionarTarefa} = require('../repositories/tarefas.repository.js');
const {atualizarStatus} = require('../repositories/tarefas.repository.js');
const {deletarTarefa} = require('../repositories/tarefas.repository.js');
const {consultarTarefa} = require('../repositories/tarefas.repository.js');
const {editarTarefa} = require('../repositories/tarefas.repository.js');
const {consultarUsuarios, consultarEmpresas} = require("../repositories/tarefas.repository");

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaInicial/paginaInicial.html'));
});

router.get('/erro', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaInicial/erro.html'));
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
    const { titulo, idcliente, dataLimite, idusuario, descricao, recurrenceDay } = req.body;
    console.log(titulo, idcliente, dataLimite, idusuario, descricao, recurrenceDay);
    if (!titulo || !idcliente || !dataLimite) {
        return res.status(400).json({ error: 'Dados incompletos' });
    }
    adicionarTarefa(titulo, idcliente, dataLimite, idusuario, descricao, recurrenceDay, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json({ success: true });
    });
});





router.post('/atualizartarefa', (req, res) => {
    const {idtarefa, newStatus} = req.body;
    atualizarStatus(idtarefa, newStatus, (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json(result);
        }
    });
});

router.get('/editartarefa', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaInicial/paginaEditarTarefa/editarTarefa.html'));
});

router.post('/editartarefa', (req, res) => {
    console.log("Received data:", req.body);
    const { idtarefa, titulo, descricao, dataLimite, idusuario } = req.body;

    if (!titulo || !idtarefa || !dataLimite || !descricao) {
        res.status(400).json({error: 'Missing fields'});
        return;
    }
    editarTarefa(idtarefa, titulo, dataLimite, descricao, idusuario, (err, result) => {
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
        res.redirect('/paginaInicial');
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


module.exports = router;