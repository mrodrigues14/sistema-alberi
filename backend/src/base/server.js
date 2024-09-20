const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const app = express();
const port = 8080;
const routing = require('../routing');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

app.set('trust proxy', 1);

app.use(session({
    secret: '1234',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 4 * 60 * 60 * 1000,
        sameSite: 'None'
    }
}));

app.use(express.static(path.join(__dirname, '../../../frontend')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));

app.get('/api/isLoggedIn', (req, res) => {
    if (req.session.username) {
        res.json({ isLoggedIn: true });
    } else {
        res.json({ isLoggedIn: false });
    }
});

routing(app);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
