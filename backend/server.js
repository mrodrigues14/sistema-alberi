const express = require('express');
const path = require('path');
const app = express();
const port = 3000;


app.use(express.static(path.join(__dirname, '../frontend/paginaLogin')));

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const autenticacaoRoutes = require('./routes/autenticacaoRoutes');
app.use('/api', autenticacaoRoutes);

