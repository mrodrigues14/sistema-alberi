const autenticacaoRouter = require('./routes/autenticacao.route');
const insercaoRouter = require('./routes/insercao.route');
const paginaInicialRouter = require('./routes/paginaInicial.route');
const estudosRouter = require('./routes/estudos.route');
const loginRouter = require('./routes/login.route');
const consultaRouter = require('./routes/consulta.route');
const rubricasRouter = require('./routes/rubricas.route');
const adicionarFornecedorRouter = require('./routes/fornecedor.route');
const editarCategoriaRouter = require('./routes/categoria.route');
const cadastroRouter = require('./routes/cadastro.route');
const dadosRouter = require('./routes/dados.route');
const paginaMenuInicial = require('./routes/paginaMenuInicial.route');
const seletorEmpresa = require('./routes/seletorEmpresa.route')
const templateMenu = require('./routes/templateMenu.route')

function routing(app){
    app.use('/api', autenticacaoRouter);
    app.use('/insercao', insercaoRouter);
    app.use('/paginainicial', paginaInicialRouter);
    app.use('/estudos', estudosRouter);
    app.use('/consulta', consultaRouter);
    app.use('/rubricas', rubricasRouter);
    app.use('/fornecedor', adicionarFornecedorRouter);
    app.use('/categoria', editarCategoriaRouter);
    app.use('/cadastro', cadastroRouter);
    app.use('/dados', dadosRouter);
    app.use('/', loginRouter);
    app.use('/paginaMenuInicial', paginaMenuInicial);
    app.use('/seletorEmpresa', seletorEmpresa)
    app.use('/templateMenu', templateMenu)

}

module.exports = routing;