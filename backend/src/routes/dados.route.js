const express = require('express');
const router = express.Router();
const path = require('path');
const { adicionar, buscar, remover, editar, definirSaldoInicial } = require('../repositories/dados.repository'); // Adicionar a função definirSaldoInicial

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaDados/paginaDados.html'));
});

router.get('/bancos', (req, res) => {
    const idcliente = req.query.idcliente;
    buscar(idcliente, (err, result) => {
        if (err) {
            res.status(500).send("Erro ao buscar");
        } else {
            res.send(result);
        }
    });
});

router.post('/remover', (req, res) => {
    const { idcliente2, idbanco } = req.body;
    remover(idcliente2, idbanco, (err, result) => {
        if (err) {
            res.status(500).send("Erro ao remover");
        } else {
            res.redirect(`/dados?successMsg=Banco removido com sucesso!`);
        }
    });
});

router.post('/adicionar', (req, res) => {
    const { idcliente, nomeBanco, tipoConta } = req.body;
    adicionar(idcliente, nomeBanco, tipoConta, (err, result) => {
        if (err) {
            res.status(500).send("Erro ao inserir");
        } else {
            res.redirect(`/dados?successMsg=Banco ${nomeBanco} adicionado com sucesso!`);
        }
    });
});

router.post('/editar', (req, res) => {
    const { idcliente, idbanco, novoNome, novoTipo } = req.body;
    editar(idcliente, idbanco, novoNome, novoTipo, (err, result) => {
        if (err) {
            res.status(500).send("Erro ao editar");
        } else {
            res.redirect(`/dados?successMsg=Banco ${novoNome} editado com sucesso!`);
        }
    });
});

router.post('/definirSaldoInicial', (req, res) => {
    const { idcliente, idbanco, mesAno, saldo } = req.body;
    definirSaldoInicial(idcliente, idbanco, mesAno, saldo, (err, result) => {
        if (err) {
            res.status(500).send("Erro ao definir saldo inicial");
        } else {
            res.redirect(`/dados?successMsg=Saldo inicial definido com sucesso!`);
        }
    });
});

module.exports = router;
