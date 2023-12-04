const autenticacaoRouter = require('./routes/autenticacao.route');

function routing(app){
    app.use('/api', autenticacaoRouter);

}

module.exports = routing;