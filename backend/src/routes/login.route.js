const express = require('express');
const router = express.Router();
const path = require('path');
const emailjs = require('emailjs-com');
const {iniciarRecuperacaoSenha, verificarToken, redefinirSenha} = require("../repositories/login.repository");

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaLogin/index.html'));
});



module.exports = router;
