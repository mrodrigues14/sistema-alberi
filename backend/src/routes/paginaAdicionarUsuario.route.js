const express = require('express');
const router = express.Router();
const path = require('path');
const {adicionarUsuario} = require("../repositories/adicionarUsuario.repository");

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaAdicionarUsuario/paginaAdicionarUsuario.html'));
});
router.post('/add', (req, res) => {
    const {cpf, nome, senha, roles} = req.body;
    adicionarUsuario(cpf, nome, senha, roles, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json({success: true});
    });
});
module.exports = router;
