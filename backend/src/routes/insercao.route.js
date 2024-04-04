const express = require('express');
const router = express.Router();
const path = require('path');
const {inserir, buscarUltimasInsercoes} = require('../repositories/insercao.repository');
const {buscarBanco} = require('../repositories/insercao.repository');
const {Router} = require("express");
const {buscarIDEmpresa} = require("../repositories/insercao.repository");
const {buscarCategorias} = require("../repositories/insercao.repository");
const {deletarExtrato} = require("../repositories/insercao.repository");
const {deletar} = require("../repositories/categoria.repository");

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaInsercao/paginaInsercao.html'));

});

router.get('/dados', (req, res) => {
    const { idcliente } = req.query;
    buscarBanco(idcliente, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados");
        }
        else{
            res.send(result);
        }
    });
});

router.get('/ultimas-insercoes', async (req, res) => {
    const { idcliente } = req.query;
    buscarUltimasInsercoes(idcliente, (err, result) => {
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

router.get('/dados-categoria', (req, res) => {
    const { idcliente } = req.query;
    buscarCategorias(idcliente, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados");
        }
        res.json(result);
    });
});

router.post('/', async (req, res) => {
    try {
        const { Data, categoria, descricao, nomeExtrato, tipo, valor, id_bancoPost, id_empresa, fornecedor } = req.body;
        console.log(req.body);

        await inserir(Data, categoria, descricao, nomeExtrato, tipo, valor, id_bancoPost, id_empresa, fornecedor);

        res.redirect('/insercao');
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao inserir dados");
    }
});

router.post('/inserir-lote', async (req, res) => {
    const entradas = req.body; 

    try {
        for (const entrada of entradas) {
            const { Data,	Categoria,	Descricao,	Nome,	Tipo,	Valor, IDBANCO, IDCLIENTE } = entrada;

            await inserir(Data,	Categoria,	Descricao,	Nome,	Tipo,	Valor, IDBANCO, IDCLIENTE);
        }
        res.status(200).send("Dados inseridos com sucesso");
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao inserir dados");
    }
});

router.post('/deletar-extrato', (req, res) => {
    const { idExtrato } = req.body;
    deletarExtrato(idExtrato, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao deletar extrato");
        }
        const currentUrl = req.headers.referer;
        res.redirect(currentUrl);
    });
});

module.exports = router;
