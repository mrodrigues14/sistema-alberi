const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../base/database');
const {listarTarefas} = require('../repositories/tarefas.repository.js');
const {adicionarTarefa} = require('../repositories/tarefas.repository.js');
const {atualizarStatus} = require('../repositories/tarefas.repository.js');
const {deletarTarefa} = require('../repositories/tarefas.repository.js');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaInicial/paginaInicial.html'));
});

router.get('/tarefas', (req, res) => {
   const idcliente = req.query.idcliente;
    listarTarefas(idcliente, (err, result) => {
         if (err) {
              res.status(500).json(err);
         } else {
              res.status(200).json(result);
         }
    });
});

router.post('/adicionartarefa', (req, res) => {
    const {titulo, idcliente, dataLimite} = req.body;
    adicionarTarefa(titulo, idcliente, dataLimite, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.redirect('/paginainicial');
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

router.post('/deletartarefa', (req, res) => {
    const {idtarefa} = req.body;
    deletarTarefa(idtarefa, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.redirect('/paginainicial');
    });
});

router.post('/consultarEmpresas', (req, res) => {
    db.query('SELECT nome FROM CLIENTE', (error, results) => {
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