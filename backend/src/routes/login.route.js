const express = require('express');
const router = express.Router();
const path = require('path');
const {buscarIdUsuario} = require("../repositories/login.repository");

router.get('/', (req, res) => {
    res.redirect('/login/');
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
router.post('/buscarIdUsuario', verificaRoles, (req, res) => {
    const { nomeUsuarioLogin } = req.body;
    buscarIdUsuario(nomeUsuarioLogin, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar id do usuario no cadastro");
        }
        // Assumindo que 'result' contenha o ID do usuário ou informações relacionadas
        res.json(result);
    });
});

function verificaRoles(req, res, next) {
    const user = req.oidc && req.oidc.user;
    if (!user) {
        return res.status(401).send('Usuário não autenticado');
    }

    const roles = user['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    if (roles.includes('aa') || roles.includes('sss')) {
        next();
    } else {
        res.status(403).send("Acesso negado: Você não tem permissão para acessar esta página.");
    }
}
module.exports = router;
