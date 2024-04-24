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

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaInicial/paginaInicial.html'));
});

router.get('/erro', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaInicial/erro.html'));
});

router.get('/tarefas', (req, res) => {
    const {idcliente, idusuario, isAdmin} = req.query;
    listarTarefas(idcliente, idusuario, isAdmin,(err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json(result);
        }
    });
});

router.post('/adicionartarefa', (req, res) => {
    const {titulo, idcliente, dataLimite, idusuario, recurrenceDay} = req.body;
    console.log(titulo, idcliente, dataLimite, idusuario, recurrenceDay);
    if (!titulo || !idcliente || !dataLimite) {
        return res.status(400).json({error: 'Dados incompletos'});
    }
    adicionarTarefa(titulo, idcliente, dataLimite, idusuario,recurrenceDay, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json({success: true});
    });
});



router.post('/atualizartarefa', (req, res) => {
    const {idtarefa} = req.body;
    atualizarStatus(idtarefa, (err, result) => {
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
    const {id, titulo, dataLimite} = req.body;
    if(!titulo || !id || !dataLimite)
        res.redirect(`/paginaInicial/editartarefa?id=${id}`);
    editarTarefa(id, titulo, dataLimite, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.redirect(`/paginaInicial/editartarefa?id=${id}`)
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

module.exports = router;