const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../base/database');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/seletorEmpresa/seletorEmpresa.html'));
});

router.post('/consultarEmpresas', (req, res) => {
    db.query('SELECT NOME, IDCLIENTE FROM CLIENTE', (error, results) => {
        if (error) {
            console.error('Erro durante a busca por empresa no banco de dados:', error);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            res.json({ empresas: results });
        } else {
            res.status(404).send({ message: 'Nenhuma empresa encontrada' });
        }
    });
});




module.exports = router;