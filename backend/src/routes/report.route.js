const express = require('express');
const multer = require('multer');
const path = require('path');
const { inserirReport, getReportsByUserId, getReportFileById } = require('../repositories/report.repository');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Usando memória para armazenamento temporário

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/report/report.html'));
});

router.post('/adicionar', upload.array('files', 10), async (req, res) => {
    const { title, description, type, functionality } = req.body;
    const files = req.files;
    const userId = req.body.ID_USUARIO;
    const data = new Date();

    const fileDetails = await Promise.all(files.map(async (file) => {
        const { fileTypeFromBuffer } = await import('file-type'); // Importação dinâmica
        const fileTypeResult = await fileTypeFromBuffer(file.buffer);

        let detectedFileType = null;
        if (fileTypeResult) {
            if (fileTypeResult.mime === 'application/pdf') {
                detectedFileType = 'PDF';
            } else if (fileTypeResult.mime === 'application/msword' || fileTypeResult.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                detectedFileType = 'WORD';
            } else if (fileTypeResult.mime.startsWith('image/')) {
                const extension = fileTypeResult.ext.toUpperCase();
                if (['JPG', 'JPEG', 'PNG'].includes(extension)) {
                    detectedFileType = extension;
                } else {
                    detectedFileType = 'IMAGE';
                }
            } else {
                detectedFileType = fileTypeResult.ext.toUpperCase();
            }
        }

        return {
            name: file.originalname,
            data: file.buffer.toString('base64'),
            type: detectedFileType
        };
    }));

    inserirReport(title, description, data, JSON.stringify(fileDetails), userId, type, null, functionality, (err, result) => {
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const situacao = req.query.situacao || null;

    getReportsByUserId(userId, page, limit, situacao, (err, reports) => {
        if (err) {
            console.error('Erro ao buscar reports:', err);
            res.status(500).send('Erro ao buscar reports');
        } else {
            res.json(reports);
        }
    });
});

router.get('/download/:id', (req, res) => {
    const reportId = req.params.id;

    getReportFileById(reportId, (err, fileData) => {
        if (err) {
            console.error('Erro ao buscar arquivo:', err);
            res.status(500).send('Erro ao buscar arquivo');
        } else {
            if (fileData) {
                const fileDetails = JSON.parse(fileData);
                if (fileDetails.length === 1) {
                    const buffer = Buffer.from(fileDetails[0].data, 'base64');
                    res.setHeader('Content-Disposition', `attachment; filename="${fileDetails[0].name}"`);
                    res.setHeader('Content-Type', 'application/octet-stream');
                    res.send(buffer);
                } else {
                    res.json(fileDetails);
                }
            } else {
                res.status(404).send('Arquivo não encontrado');
            }
        }
    });
});

module.exports = router;
