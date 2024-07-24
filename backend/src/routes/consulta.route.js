const express = require('express');
const router = express.Router();
const path = require('path');
const { buscar, extratoAEditar, editarExtrato, buscarSaldoInicial, salvarOrdem } = require('../repositories/consulta.repository');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaConsulta/paginaConsulta.html'));
});

router.get('/editar', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaConsulta/editarExtrato/editarExtrato.html'));
});

router.get('/editar/extrato', (req, res) => {
    const { id } = req.query;
    extratoAEditar(id, (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.json(result);
        }
    });
});

router.post('/editar/extrato', (req, res) => {
    const { id, data, categoria, descricao, nome_no_extrato, tipo, valor } = req.body;
    editarExtrato(id, data, categoria, descricao, nome_no_extrato, tipo, valor, (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.json(result);
        }
    });
});

router.get('/dados', (req, res) => {
    const { banco, data, empresa } = req.query;
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
    const { banco, data } = req.query;
    buscarSaldoInicial(banco, data, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar saldo inicial");
        }
        res.json(result);
    });
});

router.get('/download-anexo/:nomeArquivo', (req, res) => {
    const nomeArquivo = req.params.nomeArquivo;
    const filePath = path.join(__dirname, '../../../uploads/', nomeArquivo);
    res.download(filePath, (err) => {
        if (err) {
            console.error('Erro ao fazer download do anexo:', err);
            res.status(500).send('Erro ao fazer download do anexo');
        }
    });
});

router.post('/salvar-ordem', (req, res) => {
    const { ordem } = req.body; // A ordem deve ser enviada como um array de objetos {idExtrato, ordem}

    if (!Array.isArray(ordem)) {
        return res.status(400).json({ success: false, message: 'Formato de ordem inválido' });
    }

    salvarOrdem(ordem, (err, result) => {
        if (err) {
            console.error('Erro ao salvar ordem:', err);
            return res.status(500).send('Erro ao salvar ordem');
        } else {
            res.json({ success: true });
        }
    });
});

module.exports = router;
