const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../base/database');


router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaMenuInicial/paginaMenuInicial.html'));
});


router.post('/filtroData', (req, res) => {
    const dataInicio = req.body.dataInicio;
    const dataFim = req.body.dataFim;

    if (!dataInicio || !dataFim) {
        return res.status(400).send('As datas são obrigatórias');
    }

    const query = 'SELECT valor, data FROM extrato WHERE DATE(data) BETWEEN ? AND ? ORDER BY data ASC\n';
    db.query(query, [dataInicio, dataFim], (err, results) => {
        if (err) {
            return res.status(500).send('Erro ao consultar o banco de dados');
        }
        res.json(results);
        console.log(dataInicio, dataFim, results);
    });
});


module.exports = router;
