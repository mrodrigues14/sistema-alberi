const autenticacaoRouter = require('./routes/autenticacao.route');
const insercaoRouter = require('./routes/insercao.route');
const loginRouter = require('./routes/login.route');
const paginaInicialRouter = require('./routes/paginaInicial.route');

function routing(app){
    app.use('/api', autenticacaoRouter);
    app.use('/insercao', insercaoRouter);
    app.use('/paginainicial', paginaInicialRouter);
    app.use('/', loginRouter);
}

module.exports = routing;