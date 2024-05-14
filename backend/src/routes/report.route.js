const express = require('express');
const multer = require('multer');
const path = require('path');
const { inserirReport, getReportsByUserId } = require('../repositories/report.repository');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/report/report.html'));
});

router.post('/adicionar', upload.single('file'), (req, res) => {
    const { title, description } = req.body;
    const file = req.file ? req.file.filename : null;
    const userId = req.body.ID_USUARIO;
    const data = new Date();

    inserirReport(title, description, data, file, userId, (err, result) => {
        if (err) {
            console.error('Erro ao inserir report:', err);
            res.status(500).send('Erro ao inserir report');
        } else {
            res.send('Report enviado com sucesso');
        }
    });
});

router.get('/listar', (req, res) => {
    const userId = req.query.ID_USUARIO;

    getReportsByUserId(userId, (err, reports) => {
        if (err) {
            console.error('Erro ao buscar reports:', err);
            res.status(500).send('Erro ao buscar reports');
        } else {
            res.json(reports);
        }
    });
});

module.exports = router;
