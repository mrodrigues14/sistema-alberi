const express = require('express');
const router = express.Router();
const path = require('path');
const { adicionarUsuario, listarEmpresas } = require("../repositories/adicionarUsuario.repository");

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaAdicionarUsuario/paginaAdicionarUsuario.html'));
});

router.get('/empresas', (req, res) => {
    listarEmpresas((err, empresas) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json(empresas);
    });
});

router.post('/add', (req, res) => {
    const { cpf, nome, senha, roles, empresas } = req.body;
    adicionarUsuario(cpf, nome, senha, roles, empresas, (err, result) => {
        if (err) {
            if (err.message === 'Usuário já existe') {
                return res.status(400).json({ error: 'Usuário já existe' });
            }
            return res.status(500).json(err);
        }
        res.json({ success: true });
    });
});

module.exports = router;
