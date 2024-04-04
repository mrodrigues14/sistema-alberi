const express = require('express');
const router = express.Router();
const path = require('path');
const {adicionar} = require('../repositories/cadastro.repository');
const {listar} = require('../repositories/cadastro.repository');
const {remover} = require('../repositories/cadastro.repository');
const {editar} = require('../repositories/cadastro.repository');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaCadastro/paginaCadastro.html'));
});

router.post('/', async (req, res) => {
    const {nomeEmpresa, telefone, cnpj, cpf} = req.body;
    await adicionar(nomeEmpresa, telefone, cnpj, cpf);
    res.redirect('/cadastro');
});

router.get('/empresas',  (req, res) => {
    listar((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados");
        }
        res.json(result);
    });
});

router.post('/remover', (req, res) => {
    const {selectNomeEmpresa} = req.body;
    remover(selectNomeEmpresa, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao remover dados");
        }
        res.redirect('/cadastro');
    });
});

router.post('/editar' , (req, res) => {
    const {selectEmpresa, nomeEmpresaEdit} = req.body;
    editar(selectEmpresa, nomeEmpresaEdit, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao editar dados");
        }
        res.redirect('/cadastro');
    });
});

module.exports = router;
