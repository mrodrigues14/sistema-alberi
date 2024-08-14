const express = require('express');
const router = express.Router();
const path = require('path');
const {buscar, buscarCategoriaPorId} = require('../repositories/categoria.repository');
const {adicionarOuAssociarCategoria} = require('../repositories/categoria.repository');
const {deletar} = require('../repositories/categoria.repository');
const {adicionarSubcategoria} = require('../repositories/categoria.repository');
const {editarCategoria} = require('../repositories/categoria.repository');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaEditarCategoria/paginaEditarCategoria.html'));
});

router.get('/dados' , (req, res) => {
    const {idcliente} = req.query;
    buscar(idcliente, (err, result) => {
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
        res.redirect(`/rubricas?successMsg=Rubrica ${CATEGORIA} adicionada com sucesso!`);
    });
});

router.post('/delete' , (req, res) => {
    const {idCliente, categoria} = req.body;
    deletar(categoria, idCliente, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao deletar categoria");
        }
        const currentUrl = req.headers.referer;
        res.redirect(currentUrl);
    });
});

router.post('/subcategoria', (req, res) => {
    const {idcliente2, categoriaPai, SUBCATEGORIA} = req.body;
    adicionarSubcategoria(idcliente2 ,categoriaPai, SUBCATEGORIA, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao adicionar subcategoria");
        }
        res.redirect(`/rubricas?successMsg=Sub-Rubrica ${SUBCATEGORIA} adicionada com sucesso!`);
    });
});

router.post('/editar' , (req, res) => {
    const {idcliente, categoriaAntiga, categoriaNova} = req.body;
    console.log(req.body);
    editarCategoria(categoriaAntiga, categoriaNova, idcliente, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao editar categoria");
        }
        res.redirect(`/rubricas?successMsg=Rubrica editada para ${categoriaNova}!`);
    });
});

router.get('/editar/:id', (req, res) => {
    const idCategoria = req.params.id;
    buscarCategoriaPorId(idCategoria, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar categoria para edição");
        }
        res.json(result);
    });
});


module.exports = router;
