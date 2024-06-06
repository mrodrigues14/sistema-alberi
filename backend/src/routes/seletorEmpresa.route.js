const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../base/database');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/seletorEmpresa/seletorEmpresa.html'));
});

router.post('/consultarEmpresas', (req, res) => {
    const userId = req.session.idusuario;
    const userRole = req.session.role;
    const userName = req.session.username;

    const queryAdministrador = `
        SELECT NOME, IDCLIENTE FROM CLIENTE
        ORDER BY (NOME = 'Todos Clientes') DESC, NOME ASC
    `;
    const queryUsuario = `
        SELECT c.NOME, c.IDCLIENTE 
        FROM CLIENTE c 
        JOIN RELACAOUSUARIOCLIENTE ruc ON c.IDCLIENTE = ruc.ID_EMPRESA_REFERENCIA
        WHERE ruc.ID_USUARIO = ?
        ORDER BY (c.NOME = 'Todos Clientes') DESC, c.NOME ASC
    `;

    if (userRole === 'Administrador' || userRole === 'Configurador') {
        db.query(queryAdministrador, (error, results) => {
            if (error) {
                console.error('Erro durante a busca por empresa no banco de dados:', error);
                return res.status(500).send('Server error');
            }

            if (results.length > 0) {
                res.json({ empresas: results });
            } else {
                res.status(404).json({ message: 'Nenhuma empresa encontrada', userName: userName });
            }
        });
    } else {
        db.query(queryUsuario, [userId], (error, results) => {
            if (error) {
                console.error('Erro durante a busca por empresa no banco de dados:', error);
                return res.status(500).send('Server error');
            }

            if (results.length > 0) {
                res.json({ empresas: results });
            } else {
                res.status(404).json({ message: `Nenhuma empresa vinculada ao usuário ${userName}`, userName: userName });
            }
        });
    }
});

module.exports = router;
