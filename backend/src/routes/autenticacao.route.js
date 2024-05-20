const express = require('express');
const db = require('../base/database');

const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    console.log("Tentativa de login com:", username, password);

    if (username && password) {
        db.query(
            'SELECT * FROM USUARIOS WHERE (USUARIO_LOGIN = ? OR CPF = ?) AND SENHA = ?',
            [username, username, password],
            (error, results) => {
                if (error) {
                    console.error('Erro durante a busca no banco de dados:', error);
                    return res.status(500).send('Server error');
                }

                if (results.length > 0) {
                    req.session.username = results[0].NOME_DO_USUARIO;
                    req.session.role = results[0].ROLE;
                    req.session.idusuario = results[0].IDUSUARIOS;
                    res.status(200).send({
                        message: 'Login successful',
                        user: {
                            username: results[0].NOME_DO_USUARIO,
                            role: results[0].ROLE,
                            idusuario: results[0].IDUSUARIOS
                        }
                    });
                } else {
                    res.status(401).send({ message: 'Usuário ou senha incorretos. Por favor, verifique suas credenciais de acesso.' });
                }
            }
        );
    } else {
        return res.status(400).send({ message: 'Por favor, forneça um username e uma senha.' });
    }
});

router.get('/usuario-logado', (req, res) => {
    if (req.session && req.session.username) {
        res.status(200).json({
            username: req.session.username,
            idusuario: req.session.idusuario,
            role: req.session.role
        });
    } else {
        res.status(401).json({ message: 'Nenhum usuário logado' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Não foi possível fazer logout');
        }
        res.clearCookie('connect.sid');
        res.status(200).send({ message: 'Logout bem-sucedido' });
    });
});

module.exports = router;
