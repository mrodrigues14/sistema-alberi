const express = require('express');
const router = express.Router();
const path = require('path');
const { adicionarUsuario, listarEmpresas, listarUsuarios, obterUsuario, editarUsuario } = require("../repositories/usuario.repository");

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaUsuario/usuario.html'));
});

router.get('/adicionarUsuario', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaUsuario/paginaAdicionarUsuario/paginaAdicionarUsuario.html'));
});

router.get('/editarUsuario', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaUsuario/paginaEditarUsuario/paginaEditarUsuario.html'));
});

router.get('/empresas', (req, res) => {
    listarEmpresas((err, empresas) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json(empresas);
    });
});

router.get('/listar', (req, res) => {
    listarUsuarios((err, usuarios) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json(usuarios);
    });
});

router.get('/:id', (req, res) => {
    const userId = req.params.id;
    obterUsuario(userId, (err, usuario) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json(usuario);
    });
});

router.post('/add', (req, res) => {
    const { cpf, nome, senha, role, empresas } = req.body;
    adicionarUsuario(cpf, nome, senha, role, empresas, (err, result) => {
        if (err) {
            if (err.message === 'Usuário já existe') {
                return res.status(400).json({ error: 'Usuário já existe' });
            }
            return res.status(500).json(err);
        }
        res.json({ success: true });
    });
});

router.post('/edit/:id', (req, res) => {
    const userId = req.params.id;
    const { cpf, nome, senha, role, ativo, empresas } = req.body;
    editarUsuario(userId, cpf, nome, senha, role, ativo, empresas, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json({ success: true });
    });
});

module.exports = router;
