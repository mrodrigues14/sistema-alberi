const express = require('express');
const router = express.Router();
const path = require('path');
const {adicionar} = require('../repositories/dados.repository');
const {buscar} = require('../repositories/dados.repository');
const {remover} = require('../repositories/dados.repository');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaDados/paginaDados.html'));
});

router.get('/bancos', (req, res) => {
    const idcliente = req.query.idcliente;
    buscar(idcliente, (err, result) => {
        if(err){
            res.status(500).send("Erro ao buscar");
        }
        else
        {
            res.send(result);
        }
    });
});

router.post('/remover', (req, res) => {
    const { idcliente2, idbanco } = req.body;
    remover(idcliente2, idbanco, (err, result) => {
        if(err){
            res.status(500).send("Erro ao remover");
        }
        else
        {
            res.redirect('/dados');
        }
    });
});

router.post('/adicionar', (req, res) => {
    const { idcliente, nomeBanco, tipoConta } = req.body;
    adicionar(idcliente, nomeBanco, tipoConta, (err, result) => {
        if(err){
            res.status(500).send("Erro ao inserir");
        }
        else
        {
            res.redirect('/dados');
        }
    });
});

module.exports = router;
