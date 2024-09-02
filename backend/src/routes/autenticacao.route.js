const express = require('express');
const { iniciarRecuperacaoSenha, redefinirSenha } = require("../repositories/login.repository");
const NodeCache = require('node-cache');
const bcrypt = require('bcrypt');
const cache = new NodeCache({ stdTTL: 3600 }); // Tokens expiram em 1 hora
const router = express.Router();
const db = require('../base/database');

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    console.log("Tentativa de login com:", username, password);

    if (username && password) {
        db.query(
            'SELECT * FROM USUARIOS WHERE USUARIO_LOGIN = ? OR CPF = ?',
            [username, username],
            (error, results) => {
                if (error) {
                    console.error('Erro durante a busca no banco de dados:', error);
                    return res.status(500).send('Server error');
                }

                if (results.length > 0) {
                    const user = results[0];

                    bcrypt.compare(password, user.SENHA, (err, isMatch) => {
                        if (err) {
                            console.error('Erro ao comparar senhas:', err);
                            return res.status(500).send('Server error');
                        }

                        if (isMatch) {
                            db.query(
                                'UPDATE USUARIOS SET ULTIMO_ACESSO = NOW() WHERE IDUSUARIOS = ?',
                                [user.IDUSUARIOS],
                                (err) => {
                                    if (err) {
                                        console.error('Erro ao atualizar ULTIMO_ACESSO:', err);
                                        return res.status(500).send('Server error');
                                    }

                                    req.session.username = user.NOME_DO_USUARIO;
                                    req.session.role = user.ROLE;
                                    req.session.idusuario = user.IDUSUARIOS;
                                    res.status(200).send({
                                        message: 'Login successful',
                                        user: {
                                            username: user.NOME_DO_USUARIO,
                                            role: user.ROLE,
                                            idusuario: user.IDUSUARIOS
                                        }
                                    });
                                }
                            );
                        } else {
                            res.status(401).send({ message: 'Usuário ou senha incorretos. Por favor, verifique suas credenciais de acesso.' });
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

router.post('/recuperarSenha', (req, res) => {
    const { email, cpf } = req.body;
    const token = Math.random().toString(36).substr(2);

    iniciarRecuperacaoSenha(email, cpf, (err, success) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        if (!success) {
            return res.status(404).json({ success: false, message: 'Email ou CPF não encontrado.' });
        }

        cache.set(token, email, 3600); // Salva o token no cache

        res.json({ success: true, token, email });
    });
});

router.post('/resetSenha', (req, res) => {
    const { token, novaSenha, cpf } = req.body;
    const email = cache.get(token);

    if (!email) {
        return res.status(400).json({ success: false, message: 'Token inválido ou expirado' });
    }

    redefinirSenha(email, novaSenha ,cpf,(err) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        cache.del(token); // Remove o token do cache após a redefinição de senha
        res.json({ success: true, message: 'Senha redefinida com sucesso' });
    });
});

module.exports = router;
