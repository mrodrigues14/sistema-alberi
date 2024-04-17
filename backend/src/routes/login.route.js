const express = require('express');
const router = express.Router();
const path = require('path');
const {buscarIdUsuario} = require("../repositories/login.repository");

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaLogin/index.html'));
});


router.post('/buscarIdUsuario', (req, res) => {
    const {nomeUsuarioLogin} = req.body;
    buscarIdUsuario(nomeUsuarioLogin, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar id do usuario no cadastro");
        }
    });
})
module.exports = router;
