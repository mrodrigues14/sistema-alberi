const express = require('express');
const router = express.Router();
const path = require('path');
const {buscar} = require('../repositories/consulta.repository');
const {extratoAEditar} = require('../repositories/consulta.repository');
const {editarExtrato} = require('../repositories/consulta.repository');
const {buscarSaldoInicial} = require('../repositories/consulta.repository');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaConsulta/paginaConsulta.html'));
});

router.get('/editar' , (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaConsulta/editarExtrato/editarExtrato.html'));
});

router.get('/editar/extrato', (req, res) => {
    const {id} = req.query;
    extratoAEditar(id, (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.json(result);
        }
    });
});

router.post('/editar/extrato', (req, res) => {
    const {id, data, categoria, descricao, nome_no_extrato, tipo, valor} = req.body;
    editarExtrato(id, data, categoria, descricao, nome_no_extrato, tipo, valor, (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.json(result);
        }
    });
});

router.get('/dados', (req, res) => {
    const {banco, data, empresa} = req.query;
    console.log(`Banco: ${banco}, Data: ${data}, Empresa: ${empresa}`);
    buscar(banco, data, empresa, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados");
        }
        res.json(result);
    });
});

router.get('/saldoinicial', (req, res) => {
    const {banco, data} = req.query;
    buscarSaldoInicial(banco, data, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar saldo inicial");
        }
        res.json(result);
    });
});

module.exports = router;
