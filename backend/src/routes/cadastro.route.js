const express = require('express');
const router = express.Router();
const path = require('path');
const { adicionar, listar, remover, editar, obterEmpresa } = require('../repositories/cadastro.repository');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaCliente/paginaCliente.html'));
});

router.get('/editarCliente', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaCliente/editarCliente/editarCliente.html'));
});

router.post('/addCliente', async (req, res) => {
    const { tipoCliente, nomeFisica, apelidoFisica, telefoneFisica, cpfFisica, enderecoFisica, cepFisica, emailFisica,
        nomeEmpresa, apelidoEmpresa, telefone, cnpj, endereco, cep, nomeResponsavel, cpfResponsavel, inscricaoEstadual, cnaePrincipal, socios } = req.body;

    try {
        if (tipoCliente === 'fisica') {
            await adicionar(nomeFisica, apelidoFisica, telefoneFisica, null, cpfFisica, enderecoFisica, cepFisica, null, null, null, null, [], (error, result) => {
                if (error) {
                    console.error('Erro ao adicionar a pessoa física:', error.message);
                    return res.status(400).json({success: false, message: error.message, reload: true});
                }
                res.json({success: true, message: `Pessoa Física ${nomeFisica} cadastrada com sucesso!`});
            });
        } else if (tipoCliente === 'juridica') {
            await adicionar(nomeEmpresa, apelidoEmpresa, telefone, cnpj, null, endereco, cep, nomeResponsavel, cpfResponsavel, inscricaoEstadual, cnaePrincipal, socios || [], (error, result) => {
                if (error) {
                    console.error('Erro ao adicionar a empresa:', error.message);
                    return res.status(400).json({success: false, message: error.message, reload: true});
                }
                res.json({success: true, message: `Empresa ${nomeEmpresa} cadastrada com sucesso!`});
            });
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
        res.redirect('/cliente');
    });
});

router.post('/editar', (req, res) => {
    const {
        idCliente, tipoCliente, nomeFisica, apelidoFisica, telefoneFisica, cpfFisica, enderecoFisica, cepFisica, emailFisica,
        nomeEmpresa, apelidoEmpresa, telefone, cnpj, endereco, cep, nomeResponsavel, cpfResponsavel, inscricaoEstadual, cnaePrincipal, socios
    } = req.body;

    const nome = tipoCliente === 'juridica' ? nomeEmpresa : nomeFisica;
    const apelido = tipoCliente === 'juridica' ? apelidoEmpresa : apelidoFisica;
    const telefoneCliente = tipoCliente === 'juridica' ? telefone : telefoneFisica;
    const cpfCnpj = tipoCliente === 'juridica' ? cnpj : cpfFisica;
    const enderecoCliente = tipoCliente === 'juridica' ? endereco : enderecoFisica;
    const cepCliente = tipoCliente === 'juridica' ? cep : cepFisica;
    const nomeResponsavelCliente = tipoCliente === 'juridica' ? nomeResponsavel : null;
    const cpfResponsavelCliente = tipoCliente === 'juridica' ? cpfResponsavel : null;
    const inscricaoEstadualCliente = tipoCliente === 'juridica' ? inscricaoEstadual : null;
    const cnaePrincipalCliente = tipoCliente === 'juridica' ? cnaePrincipal : null;
    const email = tipoCliente === 'fisica' ? emailFisica : null;

    editar(idCliente, tipoCliente, nome, apelido, telefoneCliente, cnpj, cpfFisica, enderecoCliente, cepCliente, nomeResponsavelCliente, cpfResponsavelCliente, inscricaoEstadualCliente, cnaePrincipalCliente, socios, email, (error, result) => {
        if (error) {
            console.error('Erro ao editar o cadastro:', error);
            return res.status(500).json({ success: false, message: 'Erro ao editar cliente.' });
        }
        res.json({ success: true, message: 'Cliente editado com sucesso!' });
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
