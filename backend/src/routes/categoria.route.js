const express = require('express');
const router = express.Router();
const path = require('path');
const {buscar, buscarCategoriaPorId, adicionarRubricaContabil, editarRubricaContabil, deletarRubricaContabil,
    buscarRubricasContabeis, buscarCategoriaComOpcoes, atualizarOpcoesCategoria
} = require('../repositories/categoria.repository');
const {adicionarOuAssociarCategoria} = require('../repositories/categoria.repository');
const {deletar} = require('../repositories/categoria.repository');
const {adicionarSubcategoria} = require('../repositories/categoria.repository');
const {editarCategoria} = require('../repositories/categoria.repository');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaEditarCategoria/paginaEditarCategoria.html'));
});

router.get('/dados', (req, res) => {
    const { idcliente } = req.query;
    buscarCategoriaComOpcoes(idcliente, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados");
        }
        res.json(result);
    });
});

router.post('/atualizarOpcoes', (req, res) => {
    const { idCategoria, GASTO_MES, GASTO_EXTRA } = req.body;

    atualizarOpcoesCategoria(idCategoria, { GASTO_MES, GASTO_EXTRA }, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Erro ao atualizar as opções da categoria" });
        }
        res.status(200).json({ success: true, message: "Opções da categoria atualizadas com sucesso!" });
    });
});


router.post('/', (req, res) => {
    const { CATEGORIA, idCliente } = req.body;
    console.log(CATEGORIA, idCliente);

    adicionarOuAssociarCategoria(CATEGORIA, idCliente, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Erro ao adicionar categoria" });
        }

        // Enviando mensagem de sucesso como JSON
        res.status(200).json({
            success: true,
            message: `Rubrica ${CATEGORIA} adicionada com sucesso!`
        });
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
    const { idcliente2, categoriaPai, SUBCATEGORIA } = req.body;

    adicionarSubcategoria(idcliente2, categoriaPai, SUBCATEGORIA, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Erro ao adicionar subcategoria" });
        }

        res.status(200).json({
            success: true,
            message: `Sub-Rubrica ${SUBCATEGORIA} adicionada com sucesso!`
        });
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

router.get('/dadosContabil', (req, res) => {
    buscarRubricasContabeis((err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar rubricas contábeis");
        }
        res.json(result);
    });
});

router.post('/addContabil', (req, res) => {
    const { RUBRICA_CONTABIL } = req.body;
    adicionarRubricaContabil(RUBRICA_CONTABIL, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao adicionar rubrica contábil");
        }
        res.redirect(`/rubricas?successMsg=Rubrica contábil ${RUBRICA_CONTABIL} adicionada com sucesso!`);
    });
});

router.post('/editarContabil', (req, res) => {
    const { idRubricaContabil, rubricaContabilNova } = req.body;
    editarRubricaContabil(idRubricaContabil, rubricaContabilNova, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao editar rubrica contábil");
        }
        res.redirect(`/rubricas?successMsg=Rubrica contábil editada com sucesso!`);
    });
});

router.post('/deleteContabil', (req, res) => {
    const { idRubricaContabil } = req.body;
    deletarRubricaContabil(idRubricaContabil, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao deletar rubrica contábil");
        }
        const currentUrl = req.headers.referer;
        res.redirect(currentUrl);
    });
});


module.exports = router;
