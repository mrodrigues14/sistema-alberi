const express = require('express');
const router = express.Router();
const path = require('path');
const {saldoInicial, entradaCategoria, saidaCategoria, totalEntradasPorMes} = require('../repositories/estudos.repository.js');

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

module.exports = router;
