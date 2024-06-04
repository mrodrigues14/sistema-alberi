const jsPDF = window.jspdf.jsPDF;

let idEmpresa = 0;
let totalEntrada = 0;
let totalSaida = 0;


function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}
document.addEventListener('DOMContentLoaded', function() {
    fetchTemplate();
    fetchTemplateEstudos();
});

function fetchTemplate(){
    fetch('/templateMenu/template.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('menu-container-estudos').innerHTML = data;

            var link = document.createElement('link');
            link.href = '/templateMenu/styletemplate.css';
            link.rel = 'stylesheet';
            link.type = 'text/css';
            document.head.appendChild(link);

            var script = document.createElement('script');
            script.src = '/templateMenu/templateScript.js';
            script.onload = function() {
                loadAndDisplayUsername();
                handleEmpresa();
            };
            document.body.appendChild(script);
        })
        .catch(error => {
            console.error('Erro ao carregar o template:', error);
        });

}

$(document).ready(function() {
    $('#seletorMesAno').datepicker({
        changeMonth: true,
        changeYear: true,
        showButtonPanel: true,
        dateFormat: 'mm-yy',
        closeText: 'Pronto',
        showTodayButton: false,
        monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
        monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        beforeShow: function(input, inst) {
            $(inst.dpDiv).addClass('hide-calendar');
        },
        onClose: function(dateText, inst) {
            var month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
            var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
            $(this).datepicker('setDate', new Date(year, month, 1));
            $(this).val($.datepicker.formatDate('mm-yy', new Date(year, month, 1)));
            buscarDados();
            buscarDadosCategoria()
                .then(buscarSaidaCategoria)
                .then(atualizarTabelaSaldoDoMes)
                .then(atualizarTabelaSaldoConta);
        }
    });
});

function formatDateToFirstOfMonth(mesAnoString) {
    if (!mesAnoString) return '';

    const [mes, ano] = mesAnoString.split('-');
    return `${ano}-${mes}-01`;
}

window.onload = function() {

    const nomeEmpresa = getStoredEmpresaName();
    fetch(`/insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                console.log('Dados da empresa recebidos:', data);
                idEmpresa = data[0].IDCLIENTE
                console.log('idEmpresa definido como:', idEmpresa);
            } else {
                console.error('Dados da empresa não retornados ou vazios');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados da empresa:', error);
        });
}

let saldoMesAnterior = 0;
function buscarDados() {
    const mesAno = $('#seletorMesAno').val();
    const dataFormatada = formatDateToFirstOfMonth(mesAno);

    const url = `/estudos/resumoMensal/saldoinicial?empresa=${idEmpresa}&data=${dataFormatada}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados recebidos:', data);
            atualizarTabela(data);
        })
        .catch(error => {
            console.error('Erro ao buscar os dados:', error);
        });
}


function atualizarTabela(data) {
    console.log('Atualizando tabela com dados:', data);
    const tbody = document.getElementById('saldoInicialTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    let total = 0;

    data.forEach(item => {
        console.log('Processando item:', item);
        const novaLinha = tbody.insertRow();
        const celulaBanco = novaLinha.insertCell(0);
        const celulaValor = novaLinha.insertCell(1);

        celulaBanco.textContent = item.banco;
        celulaValor.textContent = parseFloat(item.saldo).toFixed(2);
        celulaValor.className = 'right-align';

        total += parseFloat(item.saldo);
    });
    saldoMesAnterior = total;
    const tfoot = document.getElementById('saldoInicialTable').getElementsByTagName('tfoot')[0];
    tfoot.rows[0].cells[1].textContent = total.toFixed(2);
    tfoot.rows[0].cells[1].className = 'right-align';

}

document.getElementById('seletorMesAno').addEventListener('change', buscarDados);
document.getElementById('seletorMesAno').addEventListener('change', buscarDadosCategoria);

function buscarDadosCategoria(){
    const mesAno = $('#seletorMesAno').val();
    const dataFormatada = formatDateToFirstOfMonth(mesAno);
    const url = `/estudos/resumoMensal/entradacategoria?empresa=${idEmpresa}&data=${dataFormatada}`;

    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                atualizarTabelaCategoria(data);
                resolve();
            })
            .catch(error => {
                console.error('Erro ao buscar os dados:', error);
                reject(error);
            });
    });
}


function atualizarTabelaCategoria(data) {
    console.log('Atualizando tabela com dados:', data);
    const tbody = document.getElementById('EntradaCategoriaTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    let total = 0;

    const dadosFiltrados = data.filter(item => parseFloat(item.valor) > 0);

    dadosFiltrados.forEach(item => {
        const novaLinha = tbody.insertRow();
        const celulaCategoria = novaLinha.insertCell(0);
        const celulaValor = novaLinha.insertCell(1);

        celulaCategoria.textContent = item.categoria;
        celulaValor.textContent = parseFloat(item.valor).toFixed(2);
        celulaValor.className = 'right-align';

        total += parseFloat(item.valor);
    });

    totalEntrada = total;
    const tfoot = document.getElementById('EntradaCategoriaTable').getElementsByTagName('tfoot')[0];
    tfoot.rows[0].cells[1].textContent = total.toFixed(2);
    tfoot.rows[0].cells[1].className = 'right-align';
}

function buscarSaidaCategoria(){
    const mesAno = $('#seletorMesAno').val();
    const dataFormatada = formatDateToFirstOfMonth(mesAno);
    const url = `/estudos/resumoMensal/saidacategoria?empresa=${idEmpresa}&data=${dataFormatada}`;

    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                atualizarTabelaSaidaCategoria(data);
                resolve();
            })
            .catch(error => {
                console.error('Erro ao buscar os dados:', error);
                reject(error);
            });
    });
}


function atualizarTabelaSaidaCategoria(data) {
    console.log('Atualizando tabela com dados:', data);
    const tbody = document.getElementById('saidaCategoriaTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    let total = 0;

    data.forEach(item => {
        if(parseFloat(item.valor) <= 0)
            return;
        const novaLinha = tbody.insertRow();
        const celulaCategoria = novaLinha.insertCell(0);
        const celulaValor = novaLinha.insertCell(1);

        celulaCategoria.textContent = item.categoria;
        celulaValor.textContent = parseFloat(item.valor).toFixed(2);
        celulaValor.className = 'right-align';

        total += parseFloat(item.valor);
    });
    totalSaida = total;

    const tfoot = document.getElementById('saidaCategoriaTable').getElementsByTagName('tfoot')[0];
    tfoot.rows[0].cells[1].textContent = total.toFixed(2);
    tfoot.rows[0].cells[1].className = 'right-align';
}

function atualizarTabelaSaldoDoMes(){
    const saldo = totalEntrada - totalSaida;
    const tbody = document.getElementById('saldoDoMesTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    const novaLinha = tbody.insertRow();
    const celulaSaldo = novaLinha.insertCell(0);
    celulaSaldo.textContent = saldo.toFixed(2);
    celulaSaldo.className = 'right-align';
}

function atualizarTabelaSaldoConta(){
    const saldoMesAtual = totalEntrada - totalSaida;
    const saldo = saldoMesAnterior + saldoMesAtual;
    const tbody = document.getElementById('saldoContaTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    const novaLinha = tbody.insertRow();
    const celulaSaldo = novaLinha.insertCell(0);
    celulaSaldo.textContent = saldo.toFixed(2);
    celulaSaldo.className = 'right-align';
}

function gerarPDF() {
    var doc = new jsPDF('l', 'mm', 'a4');

    var fillColor = [139, 172, 175];
    var textColor = [0, 0, 0];

    function adicionarTabelaAoPDF(selector, startX, startY, tableTitle) {
        var head = [];
        var body = [];

        $(selector + ' thead th').each(function() {
            head.push($(this).text());
        });
        $(selector + ' tbody tr').each(function() {
            var dataRow = [];
            $(this).find('td').each(function() {
                dataRow.push($(this).text());
            });
            body.push(dataRow);
        });

        if (tableTitle) {
            doc.text(tableTitle, startX, startY - 5);
        }

        doc.autoTable({
            head: [head],
            body: body,
            startY: startY,
            startX: startX,
            theme: 'grid',
            styles: {
                fillColor: fillColor,
                textColor: textColor
            }
        });
    }

    var margin = 10;
    var pageWidth = doc.internal.pageSize.width;
    var middleOfPage = pageWidth / 2;

    adicionarTabelaAoPDF('#saldoInicialTable', margin, 20, 'Saldo Inicial');
    adicionarTabelaAoPDF('#EntradaCategoriaTable', middleOfPage + margin, 20, 'Entrada por Categoria');

    var currentY = doc.autoTable.previous.finalY + margin;
    adicionarTabelaAoPDF('#saidaCategoriaTable', margin, currentY, 'Saída por Categoria');
    adicionarTabelaAoPDF('#saldoDoMesTable', middleOfPage + margin, currentY, 'Saldo do Mês');

    doc.save('Resumo_Mensal.pdf');

}


