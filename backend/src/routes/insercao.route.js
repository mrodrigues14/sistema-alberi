const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const { inserir, buscarUltimasInsercoes, buscarBanco, buscarIDEmpresa, buscarCategorias, deletarExtrato, listarAnexos, uploadAnexo,
    inserirSubdivisao,
    buscarLancamentosMesAnterior,
    buscarSaldoMesAnterior,
    verificarSaldoInicial,
    inserirSubextrato,
    buscarSubextratos,
    adicionarRubricaContabil,
    listarRubricasContabeis
} = require('../repositories/insercao.repository');
const fs = require('fs');


// Função para garantir que o diretório de uploads existe
const ensureUploadDirectoryExists = () => {
    const uploadPath = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log('Diretório de uploads criado:', uploadPath);
    }
};

// Configuração do multer para o upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureUploadDirectoryExists();  // Garante que o diretório exista
        cb(null, path.join(__dirname, '../../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
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
        console.log(result, idcliente)
    });
});

router.post('/inserir-individual', async (req, res) => {
    try {
        const { Data, categoria, descricao, nomeExtrato, valorEn, valorSa, id_bancoPost, id_empresa, fornecedor, rubrica_contabil } = req.body;
        console.log("Dados recebidos no body:", req.body);

        // Determina se é uma entrada ou saída
        let tipo;
        let valor = 0;
        if (valorEn) {
            tipo = "Entrada";
            valor = valorEn;
        } else {
            tipo = "Saída";
            valor = valorSa;
        }

        // Insere os dados no banco
        await inserir(Data, categoria, descricao, nomeExtrato, tipo, valor, id_bancoPost, id_empresa, fornecedor, rubrica_contabil, (err, result) => {
            if (err) {
                console.error("Erro durante a inserção:", err);
                return res.status(500).send("Erro ao inserir dados");
            }

            console.log("Inserção bem-sucedida:", result);
            res.redirect('/insercao');
        });

    } catch (error) {
        console.error("Erro durante a inserção:", error);
        res.status(500).send("Erro ao inserir dados");
    }
});


function formatarDataParaBanco(data) {
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes}-${dia}`;
}

router.post('/inserir-lote', async (req, res) => {
    const entradas = req.body;

    try {
        for (const entrada of entradas) {
            let { Data, Categoria, Descricao, Nome, TIPO, VALOR, IDBANCO, IDCLIENTE, FORNECEDOR, rubrica_contabil } = entrada;

            Data = formatarDataParaBanco(Data);

            await new Promise((resolve, reject) => {
                inserir(Data, Categoria, Descricao, Nome, TIPO, VALOR, IDBANCO, IDCLIENTE, FORNECEDOR, rubrica_contabil, (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(result);
                });
            });
        }
        res.status(200).send("Dados inseridos com sucesso");
    } catch (error) {
        console.error("Erro durante a inserção em lote:", error);
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
    const { idExtrato, tipoExtratoAnexo } = req.body;

    // Verifica se o arquivo foi enviado
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
    }

    const { filename } = req.file;

    console.log('Arquivo recebido:', filename);  // Log do arquivo recebido

    // Função para processar o anexo (exemplo de callback)
    uploadAnexo(idExtrato, filename, tipoExtratoAnexo, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Erro ao fazer upload de anexo' });
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

router.get('/saldo-anterior', (req, res) => {
    const { cliente, mesAno } = req.query;
    buscarSaldoMesAnterior(cliente, mesAno, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar saldo do mês anterior");
        }
        res.json(result);
    });
});

router.get('/verificarSaldoInicial', (req, res) => {
    const { cliente, banco, data } = req.query;

    verificarSaldoInicial(cliente, banco, data, (err, definidoManual) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao verificar saldo inicial");
        }

        res.json({ definidoManual });
    });
});

router.post('/inserir-subextrato', async (req, res) => {
    try {
        const { Data, categoria, descricao, observacao, valorEn, valorSa, id_extrato_principal, fornecedor } = req.body;

        await inserirSubextrato(id_extrato_principal, Data, categoria, descricao, observacao, fornecedor, valorEn, valorSa, (err, result) => {
            if (err) {
                console.error("Erro ao inserir subextrato:", err);
                return res.status(500).send("Erro ao inserir subextrato");
            }
            res.status(201).json({ message: "Subextrato inserido com sucesso", result });
        });
    } catch (error) {
        console.error("Erro durante a inserção do subextrato:", error);
        res.status(500).send("Erro ao inserir subextrato");
    }
});

router.get('/subextratos', (req, res) => {
    const { idExtrato } = req.query;

    buscarSubextratos(idExtrato, (err, result) => {
        if (err) {
            console.error("Erro ao buscar subextratos:", err);
            return res.status(500).send("Erro ao buscar subextratos");
        }

        res.json(result);
    });
});

router.get('/listar-rubricas-contabeis', (req, res) => {
    listarRubricasContabeis((err, result) => {
        if (err) {
            console.error("Erro ao listar rubricas contábeis:", err);
            return res.status(500).send("Erro ao listar rubricas contábeis");
        }
        res.json(result);
    });
});

router.post('/adicionar-rubrica-contabil', (req, res) => {
    const { nome } = req.body;

    adicionarRubricaContabil(nome, (err, result) => {
        if (err) {
            console.error("Erro ao adicionar rubrica contábil:", err);
            return res.status(500).send("Erro ao adicionar rubrica contábil");
        }
        res.status(201).json({ message: "Rubrica contábil adicionada com sucesso", result });
    });
});

router.put('/editar-rubrica-contabil/:id', (req, res) => {
    const { id } = req.params;
    const { nome } = req.body;

    editarRubricaContabil(id, nome, (err, result) => {
        if (err) {
            console.error("Erro ao editar rubrica contábil:", err);
            return res.status(500).send("Erro ao editar rubrica contábil");
        }
        res.json({ message: "Rubrica contábil editada com sucesso", result });
    });
});

router.delete('/deletar-rubrica-contabil/:id', (req, res) => {
    const { id } = req.params;

    deletarRubricaContabil(id, (err, result) => {
        if (err) {
            console.error("Erro ao deletar rubrica contábil:", err);
            return res.status(500).send("Erro ao deletar rubrica contábil");
        }
        res.json({ message: "Rubrica contábil deletada com sucesso", result });
    });
});


module.exports = router;
