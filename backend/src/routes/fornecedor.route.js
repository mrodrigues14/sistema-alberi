const express = require('express');
const router = express.Router();
const path = require('path');
const {adicionarFornecedor} = require('../repositories/fornecedor.repository.js');
const {listarFornecedor} = require('../repositories/fornecedor.repository.js');
const {removerFornecedor} = require('../repositories/fornecedor.repository.js');
const {editarFornecedor, listarFornecedorPeloId} = require("../repositories/fornecedor.repository");

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
            res.redirect(`/fornecedor`);
        }
    });
});

router.post('/editar', (req, res) => {
    const { idFornecedor, nomeFornecedor, cnpj, cpf, tipoProduto, idcliente } = req.body;
    editarFornecedor(idFornecedor, nomeFornecedor, cnpj, cpf, tipoProduto, idcliente, (err, result) => {
        if(err) {
            console.error(err);
            res.status(500).send('Erro ao editar fornecedor');
        } else {
            res.redirect(`/fornecedor?successMsg=Fornecedor ${nomeFornecedor} editado com sucesso!`);
        }
    });
});

router.get('/dados/:id', (req, res) => {
    const idFornecedor = req.params.id;

    listarFornecedorPeloId(idFornecedor, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erro ao buscar detalhes do fornecedor');
        } else if (result.length === 0) {
            res.status(404).send('Fornecedor não encontrado');
        } else {
            res.json(result[0]); // Retorna o primeiro registro encontrado
        }
    });
});


module.exports = router;
