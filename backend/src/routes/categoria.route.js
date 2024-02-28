const express = require('express');
const router = express.Router();
const path = require('path');
const {buscar} = require('../repositories/categoria.repository');
const {adicionarOuAssociarCategoria} = require('../repositories/categoria.repository');
const {deletar} = require('../repositories/categoria.repository');
const {adicionarSubcategoria} = require('../repositories/categoria.repository');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaEditarCategoria/paginaEditarCategoria.html'));
});

router.get('/dados' , (req, res) => {
    buscar((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados");
        }
        res.json(result);
    });
});

router.post('/' , (req, res) => {
    const {CATEGORIA, idcliente} = req.body;
    console.log(CATEGORIA, idcliente);
    adicionarOuAssociarCategoria(CATEGORIA, idcliente, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao adicionar categoria");
        }
        res.redirect('/categoria');
    });
});

router.post('/delete' , (req, res) => {
    const {categoria} = req.body;
    deletar(categoria, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao deletar categoria");
        }
        res.redirect('/categoria');
    });
});

router.post('/subcategoria', (req, res) => {
    const {IDCLIENTE, categoriaPai, SUBCATEGORIA} = req.body;
    adicionarSubcategoria(IDCLIENTE ,categoriaPai, SUBCATEGORIA, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao adicionar subcategoria");
        }
        res.redirect('/categoria');
    });
});

module.exports = router;
