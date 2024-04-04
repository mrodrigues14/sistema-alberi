const express = require('express');
const db = require('../base/database');

const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    console.log("Tentativa de login com:", username, password);

    if (username && password) {
        // Consulta ao banco de dados
        db.query('SELECT * FROM USUARIOS WHERE USUARIO_LOGIN = ? AND SENHA = ?', [username, password], (error, results) => {
            if (error) {
                console.error('Erro durante a busca no banco de dados:', error);
                return res.status(500).send('Server error');
            }

            // Usuário encontrado
            if (results.length > 0) {
                req.session.username = results[0].NOME_DO_USUARIO;
                req.session.role = results[0].ROLE;
                res.status(200).send({
                    message: 'Login successful',
                    user: {
                        username: results[0].NOME_DO_USUARIO,
                        role: results[0].ROLE,
                        idusuario: results[0].IDUSUARIOS
                    }
                });
            } else {
                // Não encontrado: usuário ou senha incorretos
                res.status(401).send({ message: 'Usuário ou senha incorretas. Por favor, verifique suas credenciais de acesso. ' });
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
