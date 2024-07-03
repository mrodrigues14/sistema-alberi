const express = require('express');
const router = express.Router();
const path = require('path');
const { adicionar, listar, remover, editar, obterEmpresa } = require('../repositories/cadastro.repository');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaCadastro/adicionarCliente/adicionarCliente.html'));
});

router.get('/editarCliente', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaCadastro/editarCliente/editarCliente.html'));
});

router.post('/addCliente', async (req, res) => {
    const { tipoCliente, nomeFisica, telefoneFisica, cpfFisica, enderecoFisica, cepFisica, emailFisica,
        nomeEmpresa, telefone, cnpj, endereco, cep, nomeResponsavel, cpfResponsavel, inscricaoEstadual, cnaePrincipal, socios } = req.body;

    try {
        if (tipoCliente === 'fisica') {
            await adicionar(nomeFisica, telefoneFisica, null, cpfFisica, enderecoFisica, cepFisica, null, null, null, null, []);
            res.json({ success: true, message: `Pessoa Física ${nomeFisica} cadastrada com sucesso!` });
        } else if (tipoCliente === 'juridica') {
            await adicionar(nomeEmpresa, telefone, cnpj, null, endereco, cep, nomeResponsavel, cpfResponsavel, inscricaoEstadual, cnaePrincipal, socios || []);
            res.json({ success: true, message: `Empresa ${nomeEmpresa} cadastrada com sucesso!` });
        } else {
            res.status(400).json({ success: false, message: 'Tipo de cliente inválido.' });
        }
    } catch (error) {
        console.error('Erro ao adicionar o cliente:', error);
        res.status(500).json({ success: false, message: 'Erro ao adicionar o cliente.' });
    }
});


router.get('/empresas', (req, res) => {
    listar((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados");
        }
        res.json(result);
    });
});

router.post('/remover', (req, res) => {
    const { selectNomeEmpresa } = req.body;
    const userRole = req.body.userRole;

    remover(selectNomeEmpresa, userRole, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao remover dados");
        }
        res.redirect('/cadastro');
    });
});

router.post('/editar', (req, res) => {
    const { selectEmpresa, nomeEmpresaEdit, cpfCnpjEdit } = req.body;
    editar(selectEmpresa, nomeEmpresaEdit, cpfCnpjEdit, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao editar dados");
        }
        res.redirect('/cadastro');
    });
});

router.get('/empresa/:nome', (req, res) => {
    const nomeEmpresa = req.params.nome;
    obterEmpresa(nomeEmpresa, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados da empresa");
        }
        res.json(result);
    });
});

module.exports = router;
