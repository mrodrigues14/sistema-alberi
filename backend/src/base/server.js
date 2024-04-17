const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 8080;
const session = require('express-session');
const { auth } = require('express-openid-connect');

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: '36286cee2569a4cb1103a12a4a8e6aa23247d544c3afc7a9b0ca3faa7b5d9bde',
    baseURL: 'http://localhost:8080',
    clientID: 'oLGVuEq7pnHrs1WcfZZVXjrpT3y7RonD',
    issuerBaseURL: 'https://dev-usjcus5lkrz7ygfy.us.auth0.com',
    afterCallback: (req, res, session, decodedState) => {
        res.redirect('/paginaInicial');
    }
};

app.use(session({
    secret: '1234',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(auth(config));

app.use(express.static(path.join(__dirname, '../../../frontend')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({limit: '50mb'}));

const routing = require('../routing');
routing(app);

// Para HTTPS (comente a linha abaixo se quiser usar HTTPS)
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

/* Para HTTPS, descomente e ajuste conforme necessário
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/seusite.com.br/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/seusite.com.br/fullchain.pem'),
};
https.createServer(options, app).listen(port, () => {
    console.log(`Server running securely on https://seusite.com.br:${port}`);
});
*/
