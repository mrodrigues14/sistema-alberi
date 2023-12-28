const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const routing = require('../routing');
const session = require('express-session');

// Configuração do express-session
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

routing(app);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
