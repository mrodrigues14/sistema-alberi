const express = require('express');
const db = require('../base/database');

const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    console.log("Tentativa de login com:", username, password);

    if (username && password) {
        db.query('SELECT * FROM USUARIOS WHERE USUARIO_LOGIN = ? AND SENHA = ?', [username, password], (error, results) => {
            if (error) {
                console.error('Erro durante a busca no banco de dados:', error);
                return res.status(500).send('Server error');
            }

            if (results.length > 0) {
                req.session.username = results[0].NOME_DO_USUARIO;
                req.session.role = results[0].ROLE;
                return res.status(200).send({
                    message: 'Login successful',
                    user: {
                        username: results[0].NOME_DO_USUARIO,
                        role: results[0].ROLE,
                        idusuario: results[0].IDUSUARIOS
                    }
                });
            }
        });
    } else {
        return res.status(400).send({ message: 'Please provide a username and password' });
    }
});

router.get('/usuario-logado', (req, res) => {
    if (req.session && req.session.username) {
        res.status(200).json({ username: req.session.username });
    } else {
        res.status(401).json({ message: 'No user logged in' });
    }
});

module.exports = router;
