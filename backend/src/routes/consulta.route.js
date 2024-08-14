const express = require('express');
const router = express.Router();
const path = require('path');
const { buscar, extratoAEditar, editarExtrato, buscarSaldoInicial, salvarOrdem, definirSaldoInicial} = require('../repositories/consulta.repository');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaConsulta/paginaConsulta.html'));
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
    const { cliente, banco, data } = req.query;
    buscarSaldoInicial(cliente, banco, data, (err, result) => {
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
    const { ordem } = req.body;

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

router.post('/definirSaldoInicial', (req, res) => {
    const { cliente, banco, data, saldo } = req.body;
    const mesAno = data.slice(0, 7); // Extrai o ano e o mês da data (formato YYYY-MM)
    definirSaldoInicial(cliente, banco, `${mesAno}-01`, mesAno, saldo, (err, result) => {
        if (err) {
            console.error('Erro ao definir saldo inicial:', err);
            return res.status(500).send({ success: false, message: "Erro ao definir saldo inicial" });
        }
        res.send({ success: true, message: "Saldo inicial definido com sucesso" });
    });
});

module.exports = router;
