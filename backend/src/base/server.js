const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const routing = require('../routing');
const session = require('express-session');

// Localização dos arquivos de certificado
const options = {

    key: fs.readFileSync('/etc/letsencrypt/live/albericonsult.com.br/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/albericonsult.com.br/fullchain.pem'),
};

// Configuração do express-session
app.use(session({
    secret: '1234',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: true, // Atualize esta linha para true para suporte HTTPS
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(express.static(path.join(__dirname, '../../../frontend')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({limit: '50mb'}));
routing(app);

// Criando um servidor HTTPS em vez de usar app.listen
https.createServer(options, app).listen(port, () => {
    console.log(`Server running on https://localhost:${port}`);
});
