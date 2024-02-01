const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../base/database');
const {query} = require("express");


router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaMenuInicial/paginaMenuInicial.html'));
});


router.get('/filtrarValoresSaida', (req, res) => {
    const { dataInicio, dataFim, idCliente } = req.query; // Acessa os parâmetros da query string

    if (!dataInicio || !dataFim) {
        return res.status(400).send('As datas são obrigatórias');
    }

    const query = `
        SELECT 
            valor, data 
        FROM 
            extrato 
        WHERE 
            ID_CLIENTE = ? AND
            tipoDeTransacao = 'SAIDA' AND
            DATE(data) BETWEEN ? AND ?
        ORDER BY 
            data ASC`;
    db.query(query, [idCliente, dataInicio, dataFim], (err, results) => {
        if (err) {
            return res.status(500).send('Erro ao consultar o banco de dados');
        }
        res.json(results);
    });
});

router.get('/filtroValoresCategoriaMes', (req, res) => {
    const { dataInicio, dataFim, idCliente } = req.query; // Acessa os parâmetros da query string

    if (!dataInicio || !dataFim || !idCliente) {
        return res.status(400).send('As datas e o ID do cliente são obrigatórios');
    }

    const query = `
        SELECT 
            categoria,
            SUM(valor) AS valorTotal
        FROM 
            extrato
        WHERE 
            ID_CLIENTE = ? AND
            tipoDeTransacao = 'SAIDA' AND
            DATE(data) BETWEEN ? AND ?
        GROUP BY 
            categoria
        ORDER BY 
            categoria ASC`;

    db.query(query, [idCliente, dataInicio, dataFim], (err, results) => {
        if (err) {
            return res.status(500).send('Erro ao consultar o banco de dados');
        }
        res.json(results);
    });
});


module.exports = router;
