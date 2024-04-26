const express = require('express');
const router = express.Router();
const path = require('path');
const { auth, requiresAuth } = require('express-openid-connect'); // Importa auth e requiresAuth


router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/templateMenu/template.html'));
});


router.get('/logout', requiresAuth(), function(req, res){
    // O método req.oidc.logout() irá tratar o logout da sessão local e do Auth0
    req.oidc.logout({
        returnTo: 'http://localhost:8080'  // URL para redirecionar após o logout
    });
});

router.get('/verificar-login', (req, res) => {
    if (req.oidc.isAuthenticated()) {
        res.send({ autenticado: true });
    } else {
        res.send({ autenticado: false });
    }
});

module.exports = router;
