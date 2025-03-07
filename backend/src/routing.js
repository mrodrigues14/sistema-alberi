const autenticacaoRouter = require('./routes/autenticacao.route');
const insercaoRouter = require('./routes/insercao.route');
const tarefas = require('./routes/tarefas.route');
const estudosRouter = require('./routes/estudos.route');
const loginRouter = require('./routes/login.route');
const consultaRouter = require('./routes/consulta.route');
const rubricasRouter = require('./routes/rubricas.route');
const adicionarFornecedorRouter = require('./routes/fornecedor.route');
const editarCategoriaRouter = require('./routes/categoria.route');
const clienteRouter = require('./routes/cadastro.route');
const dadosRouter = require('./routes/dados.route');
const paginaMenuInicial = require('./routes/paginaMenuInicial.route');
const seletorEmpresa = require('./routes/seletorEmpresa.route')
const templateMenu = require('./routes/templateMenu.route')
const report = require('./routes/report.route')
const usuario = require('./routes/usuario.route')
const paginaInicial = require('./routes/paginaInicial.route')
const agenda = require(`./routes/agenda.route`);


function routing(app){
    app.use('/api', autenticacaoRouter);
    app.use('/insercao', insercaoRouter);
    app.use('/tarefas', tarefas);
    app.use('/estudos', estudosRouter);
    app.use('/consulta', consultaRouter);
    app.use('/rubricas', rubricasRouter);
    app.use('/fornecedor', adicionarFornecedorRouter);
    app.use('/categoria', editarCategoriaRouter);
    app.use('/cliente', clienteRouter);
    app.use('/dados', dadosRouter);
    app.use('/', loginRouter);
    app.use('/paginaMenuInicial', paginaMenuInicial);
    app.use('/seletorEmpresa', seletorEmpresa)
    app.use('/templateMenu', templateMenu)
    app.use('/report', report)
    app.use('/usuario', usuario)
    app.use('/paginaInicial', paginaInicial)
    app.use('/agenda', agenda)
}

module.exports = routing;