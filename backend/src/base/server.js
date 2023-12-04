const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const routing = require('../routing')


app.use(express.static(path.join(__dirname, '../frontend/paginaLogin')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

routing(app);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
