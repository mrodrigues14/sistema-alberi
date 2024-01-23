const express = require('express');
const router = express.Router();
const path = require('path');
const {buscar} = require('../repositories/consulta.repository');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaConsulta/paginaConsulta.html'));
});

router.get('/dados', (req, res) => {
    const {banco, data, empresa} = req.query;
    console.log(`Banco: ${banco}, Data: ${data}, Empresa: ${empresa}`);
    buscar(banco, data, empresa, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados");
        }
        res.json(result);
    });
});

module.exports = router;
