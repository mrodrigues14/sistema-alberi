// autenticacao.route.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../base/database');

const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Log para depuração
    console.log("Tentativa de login com:", username, password);

    if (username && password) {
        db.query('SELECT * FROM users WHERE username = ?', [username], async (error, results) => {
            if (error) {
                console.error('Erro durante a busca no banco de dados:', error);
                return res.status(500).send('Server error');
            }

            if (results.length > 0) {
                try {
                    const validPassword = await bcrypt.compare(password, results[0].password);
                    if (validPassword) {
                        return res.status(200).send({ message: 'Login successful', user: results[0] });
                    } else {
                        return res.status(401).send({ message: 'Invalid credentials' });
                    }
                } catch (bcryptError) {
                    console.error('Erro durante a comparação da senha:', bcryptError);
                    return res.status(500).send('Internal Server Error');
                }
            } else {
                return res.status(404).send({ message: 'User not found' });
            }
        });
    } else {
        return res.status(400).send({ message: 'Please provide a username and password' });
    }
});

module.exports = router;
