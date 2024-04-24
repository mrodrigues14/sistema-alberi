const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 8080;
const routing = require('../routing');
const session = require('express-session');
const {createServer} = require("http");

/*const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/albericonsult.com.br/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/albericonsult.com.br/fullchain.pem'),
};*/

app.use(session({
    secret: '1234',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(express.static(path.join(__dirname, '../../../frontend')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({limit: '50mb'}));
routing(app);

createServer(app).listen( port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
