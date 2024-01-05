const express = require('express');
const router = express.Router();
const path = require('path');
const {inserir} = require('../repositories/insercao.repository');
const {buscarBanco} = require('../repositories/insercao.repository');
const {Router} = require("express");

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaInsercao/paginaInsercao.html'));

});

router.get('/dados', async (req, res) => {
    try {
        const result = await buscarBanco();
        console.log(result);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao buscar dados");
    }
});


router.post('/', async (req, res) => {
    try {
        const { Data, categoria, nome_extrato, tipo, valor } = req.body;
        await inserir(Data, categoria, nome_extrato, tipo, valor);
        return res.status(200).send("Inserido com sucesso");
    } catch (error) {
        console.error(error);
        return res.status(500).send("Erro ao inserir dados");
    }
});

module.exports = router;
