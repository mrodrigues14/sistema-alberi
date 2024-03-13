const express = require('express');
const router = express.Router();
const path = require('path');
const {saldoInicial, entradaCategoria,
    saidaCategoria, totalEntradasPorMes,
    getMeses, getValoresCategoria,
    getReceitaLiquida, getCategoria} = require('../repositories/estudos.repository.js');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaEstudos/paginaEstudos.html'));
});

router.get('/resumoMensal' , (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaEstudos/resumoMensal/resumoMensal.html'));
});

router.get('/resumoAnual', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaEstudos/resumoAnual/resumoAnual.html'));
})

router.get('/faturamento', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaEstudos/estudoFaturamento/faturamento.html'));
})

router.get('/resumoDaConta', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaEstudos/resumoDaConta/resumoDaConta.html'));
})

router.get('/resumoFin', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaEstudos/resumoFin/resumoFin.html'));
})

router.get('/resumoMensal/saldoinicial', (req, res) => {
    const {empresa, data} = req.query;
    saldoInicial(empresa, data, (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json(result);
        }
    });
});

router.get('/resumoMensal/entradacategoria', (req, res) => {
    const {empresa, data} = req.query;
    entradaCategoria(empresa, data, (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json(result);
        }
    });
});

router.get('/resumoMensal/saidacategoria', (req, res) => {
    const {empresa, data} = req.query;
    saidaCategoria(empresa, data, (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json(result);
        }
    });
});

router.get('/resumoAnual/totalEntradasPorMes', (req, res) => {
    const { empresa, ano } = req.query;
    totalEntradasPorMes(empresa, ano, (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json(result);
        }
    });
});

router.get('/resumoFin/meses', (req, res) => {
    const { ano, empresa } = req.query;
    getMeses(ano, empresa, (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json(result);
        }
    });
});

router.get('/resumoFin/valoresCategoria', (req, res) => {
    const { categoria, mes, ano, empresa } = req.query;
    getValoresCategoria(categoria, mes, ano, empresa, (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json(result);
        }
    });
});

router.get('/resumoFin/receitaLiquida', (req, res) => {
    const { mes, ano, empresa } = req.query;
    getReceitaLiquida(mes, ano, empresa, (err, result) => {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json(result);
        }
    });
});

router.get('/resumoFin/categorias', (req, res) => {
    const { ano, empresa } = req.query;
    getCategoria(empresa, ano, (err, categorias) => {
        if (err) {
            res.status(500).json({ message: "Erro ao buscar categorias", error: err });
        } else {
            res.status(200).json(categorias);
        }
    });
});
module.exports = router;
