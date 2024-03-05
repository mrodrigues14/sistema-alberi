const express = require('express');
const router = express.Router();
const path = require('path');
const {adicionar} = require('../repositories/dados.repository');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaDados/paginaDados.html'));
});

router.post('/adicionar', (req, res) => {
    const { idcliente, nomeBanco, tipoConta } = req.body;
    adicionar(idcliente, nomeBanco, tipoConta, (err, result) => {
        if(err){
            res.status(500).send
        }
        else
        {
            res.status(200).send("Inserido com sucesso");
        }
    });
});

module.exports = router;
