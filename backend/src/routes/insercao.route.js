const express = require('express');
const router = express.Router();
const path = require('path');
const {inserir, buscarUltimasInsercoes} = require('../repositories/insercao.repository');
const {buscarBanco} = require('../repositories/insercao.repository');
const {Router} = require("express");
const {buscarIDEmpresa} = require("../repositories/insercao.repository");

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaInsercao/paginaInsercao.html'));

});

router.get('/dados', (req, res) => {
    buscarBanco((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados");
        }
        res.json(result);
    });
});

router.get('/ultimas-insercoes', async (req, res) => {
    buscarUltimasInsercoes((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados");
        }
        res.json(result);
    });
});

router.get('/dados-empresa', (req, res) => {
    const { nomeEmpresa } = req.query;
    buscarIDEmpresa(nomeEmpresa, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados");
        }
        res.json(result);
    });
});

router.post('/', async (req, res) => {
    try {
        const { Data, categoria, nome_extrato, tipo, valor, id_banco, id_empresa } = req.body;

        await inserir(Data, categoria, nome_extrato, tipo, valor, id_banco, id_empresa);

        res.redirect('/insercao');
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao inserir dados");
    }
});

module.exports = router;
