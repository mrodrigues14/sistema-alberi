const express = require('express');
const multer = require('multer');
const path = require('path');
const mime = require('mime-types');
const JSZip = require('jszip');

const { deletarReport, getReportById, editarReport, recusarReport, inserirReport, getReportFilesByRange, getReportsByUserId , updateReportStatus} = require('../repositories/report.repository');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Usando memória para armazenamento temporário

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/report/report.html'));
});

router.get('/getReport/:id', (req, res) => {
    const reportId = req.params.id;
    getReportById(reportId, (err, report) => {
        if (err) {
            console.error('Erro ao obter detalhes do report:', err);
            res.status(500).send('Erro ao obter detalhes do report');
        } else {
            res.json(report);
        }
    });
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
            } else if (fileTypeResult.mime.startsWith('video/')) {
                detectedFileType = 'VIDEO';
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

router.post('/recusar/:id', (req, res) => {
    const reportId = req.params.id;
    const { motivo } = req.body;

    recusarReport(reportId, motivo, (err, result) => {
        if (err) {
            console.error('Erro ao recusar chamado:', err);
            res.status(500).send('Erro ao recusar chamado');
        } else {
            res.send('Chamado recusado com sucesso');
        }
    });
});

router.get('/download/range', (req, res) => {
    getReportFilesByRange((err, files) => {
        if (err) {
            return res.status(500).send('Error retrieving files');
        }

        if (!files || files.length === 0) {
            return res.status(404).send('No files found');
        }

        const zip = new JSZip();

        files.forEach((file) => {
            try {
                const fileDataArray = JSON.parse(file.ARQUIVO);
                const folderName = `Id_${file.ID}_Titulo_${file.TITULO.replace(/ /g, '_')}`;
                const folder = zip.folder(folderName);

                fileDataArray.forEach((fileData) => {
                    const fileName = fileData.name;
                    const fileBuffer = Buffer.from(fileData.data, 'base64');
                    folder.file(fileName, fileBuffer);
                });
            } catch (parseError) {
                console.error('Error parsing JSON:', parseError);
            }
        });

        zip.generateAsync({ type: 'nodebuffer' })
            .then((content) => {
                res.set('Content-Type', 'application/zip');
                res.set('Content-Disposition', 'attachment; filename=files.zip');
                res.set('Content-Length', content.length);
                res.send(content);
            })
            .catch((zipError) => {
                res.status(500).send('Error generating zip file');
            });
    });
});

router.put('/concluir/:id', (req, res) => {
    const reportId = req.params.id;

    updateReportStatus(reportId, 'Concluido', (err, result) => {
        if (err) {
            console.error('Erro ao atualizar status:', err);
            res.status(500).send('Erro ao atualizar status');
        } else {
            res.send('Status atualizado com sucesso');
        }
    });
});

router.put('/recusar/:id', (req, res) => {
    const reportId = req.params.id;
    const { motivo } = req.body;

    recusarReport(reportId, motivo, (err, result) => {
        if (err) {
            console.error('Erro ao recusar chamado:', err);
            res.status(500).send('Erro ao recusar chamado');
        } else {
            res.send('Chamado recusado com sucesso');
        }
    });
});

router.put('/editar/:id', upload.array('files', 10), async (req, res) => {
    const reportId = req.params.id;
    const { title, description, priority, functionality } = req.body;
    const files = req.files;

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

    const arquivos = JSON.stringify(fileDetails);

    editarReport(reportId, title, description, arquivos, priority, functionality, (err, result) => {
        if (err) {
            console.error('Erro ao atualizar report:', err);
            res.status(500).send('Erro ao atualizar report');
        } else {
            res.send('Report atualizado com sucesso');
        }
    });
});

router.delete('/deletar/:id', (req, res) => {
    const reportId = req.params.id;

    deletarReport(reportId, (err, result) => {
        if (err) {
            console.error('Erro ao deletar report:', err);
            res.status(500).send('Erro ao deletar report');
        } else {
            res.send('Report deletado com sucesso');
        }
    });
});



module.exports = router;
