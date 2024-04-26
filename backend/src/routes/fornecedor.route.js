const express = require('express');
const router = express.Router();
const path = require('path');
const {adicionarFornecedor} = require('../repositories/fornecedor.repository.js');
const {listarFornecedor} = require('../repositories/fornecedor.repository.js');
const {removerFornecedor} = require('../repositories/fornecedor.repository.js');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaAdicionarFornecedor/adicionarFornecedor.html'));
});

router.get('/listar', (req, res) => {
    idcliente = req.query.idcliente;
    listarFornecedor(idcliente, (err, result) => {
        if(err) {
            console.error(err);
            res.status(500).send('Erro ao listar fornecedores');
        }
        else {
            res.json(result);
        }
    });
});

router.post('/adicionar', (req, res) => {
    const {nomeFornecedor, cnpj, cpf, tipoProduto, idcliente} = req.body;
    console.log(nomeFornecedor, cnpj, cpf, tipoProduto, idcliente);
    adicionarFornecedor(nomeFornecedor, cnpj, cpf, tipoProduto, idcliente,(err, result) => {
        if(err) {
            console.error(err);
            res.status(500).send('Erro ao adicionar fornecedor');
        }
        else {
            res.redirect(`/fornecedor?successMsg=Fornecedor ${nomeFornecedor} adicionado com sucesso!`);
        }
    });
});

router.post('/remover', (req, res) => {
    const {selectNomeEmpresa, idcliente2} = req.body;
    removerFornecedor(selectNomeEmpresa, idcliente2, (err, result) => {
        if(err) {
            console.error(err);
            res.status(500).send('Erro ao remover fornecedor');
        }
        else {
            res.redirect(`/fornecedor?successMsg=Fornecedor removido!`);
        }
    });
});



module.exports = router;
