const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const { inserir, buscarUltimasInsercoes, buscarBanco, buscarIDEmpresa, buscarCategorias, deletarExtrato, listarAnexos, uploadAnexo,
    inserirSubdivisao
} = require('../repositories/insercao.repository');

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/paginaInsercao/paginaInsercao.html'));
});

router.get('/dados', (req, res) => {
    const { idcliente } = req.query;
    buscarBanco(idcliente, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados");
        }
        else{
            res.send(result);
        }
    });
});

router.get('/ultimas-insercoes', async (req, res) => {
    const { idcliente } = req.query;
    buscarUltimasInsercoes(idcliente, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados");
        }
        res.json(result);
    });
});

router.get('/dados-empresa', (req, res) => {
    const { nomeEmpresa } = req.query;
    buscarIDEmpresa(nomeEmpresa, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados");
        }
        res.json(result);
    });
});

router.get('/dados-categoria', (req, res) => {
    const { idcliente } = req.query;
    buscarCategorias(idcliente, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar dados");
        }
        res.json(result);
    });
});

router.post('/', async (req, res) => {
    try {
        const { Data, categoria, descricao, nomeExtrato, valorEn, valorSa, id_bancoPost, id_empresa, fornecedor } = req.body;
        console.log(req.body);
        let tipo;
        let valor = 0;
        if(valorEn){
            tipo = "Entrada";
            valor = valorEn;
        }
        else{
            tipo = "Saída";
            valor = valorSa;
        }

        await inserir(Data, categoria, descricao, nomeExtrato, tipo, valor, id_bancoPost, id_empresa, fornecedor);

        res.redirect('/insercao');
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao inserir dados");
    }
});
router.post('/inserir-lote', async (req, res) => {
    const entradas = req.body;

    try {
        for (const entrada of entradas) {
            const { Data,	Categoria,	Descricao,	Nome,	Tipo,	Valor, IDBANCO, IDCLIENTE } = entrada;

            await inserir(Data,	Categoria,	Descricao,	Nome,	Tipo,	Valor, IDBANCO, IDCLIENTE);
        }
        res.status(200).send("Dados inseridos com sucesso");
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro ao inserir dados");
    }
});

router.post('/deletar-extrato', (req, res) => {
    const { idExtrato } = req.body;
    deletarExtrato(idExtrato, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao deletar extrato");
        }
        const currentUrl = req.headers.referer;
        res.redirect(currentUrl);
    });
});

// Rota para listar anexos
router.get('/anexos', (req, res) => {
    const { idExtrato } = req.query;
    listarAnexos(idExtrato, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar anexos");
        }
        res.json(result);
    });
});

// Rota para upload de anexos
router.post('/upload-anexo', upload.single('anexo'), (req, res) => {
    const { idExtrato } = req.body;
    const { filename } = req.file;
    uploadAnexo(idExtrato, filename, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao fazer upload de anexo");
        }
        res.json({ success: true });
    });
});

router.post('/salvar-subdivisao', (req, res) => {
    const { idExtratoPrincipal, data, categoria, descricao, nomeExtrato, fornecedor, valorEntrada, valorSaida } = req.body;
    const anexo = req.file ? req.file.filename : null;

    inserirSubdivisao(idExtratoPrincipal, data, categoria, descricao, nomeExtrato, fornecedor, valorEntrada, valorSaida, (err, result) => {
        if (err) {
            console.error('Erro ao salvar subdivisão:', err);
            res.status(500).json({ success: false });
        } else {
            res.json({ success: true });
        }
    });
});


module.exports = router;
