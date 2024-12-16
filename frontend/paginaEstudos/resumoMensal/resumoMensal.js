
function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadTemplateAndStyles();
    } catch (error) {
        console.error('Erro ao carregar o template:', error);
    }
});

async function loadTemplateAndStyles() {
    const cachedCSS = localStorage.getItem('templateCSS');
    const cachedHTML = localStorage.getItem('templateHTML');

    if (cachedCSS && cachedHTML) {
        applyCSS(cachedCSS);
        applyHTML(cachedHTML);
    } else {
        const [cssData, htmlData] = await Promise.all([
            fetchText('/templateMenu/styletemplate.css'),
            fetchText('/templateMenu/template.html')
        ]);

        localStorage.setItem('templateCSS', cssData);
        localStorage.setItem('templateHTML', htmlData);

        applyCSS(cssData);
        applyHTML(htmlData);
    }

    const script = document.createElement('script');
    script.src = '/templateMenu/templateScript.js';
    script.onload = function() {
        loadAndDisplayUsername();
        handleEmpresa();
        loadNomeEmpresa();
    };
    document.body.appendChild(script);
}

function fetchText(url) {
    return fetch(url).then(response => response.text());
}

function applyCSS(cssData) {
    const style = document.createElement('style');
    style.textContent = cssData;
    document.head.appendChild(style);
}

function applyHTML(htmlData) {
    document.getElementById('menu-container').innerHTML = htmlData;
}



function formatDateToFirstOfMonth(mesAnoString) {
    if (!mesAnoString) return '';

    const [mes, ano] = mesAnoString.split('-');
    return `${ano}-${mes}-01`;
}

let idEmpresa
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

function buscarDados() {
    const mesAno = document.getElementById('mesSelectorValue').value;
    const dataFormatada = formatDateToFirstOfMonth(mesAno);
    console.log(dataFormatada)
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



function buscarDadosCategoria(){
    const mesAno = document.getElementById('mesSelectorValue').value;
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
    const mesAno = document.getElementById('mesSelectorValue').value;
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

/*
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
*/


document.addEventListener('DOMContentLoaded', function () {
    const mesSelector = document.getElementById('mesSelector');
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // Mês atual (0-11)
    const currentYear = currentDate.getFullYear();
    console.log(currentMonth)
    function gerarMeses() {
        mesSelector.innerHTML = ''; // Limpa o conteúdo antes de gerar

        for (let ano = currentYear - 1; ano <= currentYear + 1; ano++) { // Gera do ano anterior até o próximo ano
            for (let mes = 0; mes < 12; mes++) {
                const button = document.createElement('button');
                button.classList.add('mes-button');
                const monthName = new Date(ano, mes).toLocaleString('pt-BR', { month: 'long' });
                button.textContent = `${monthName}/${ano}`;
                button.dataset.mesAno = `${String(mes + 1).padStart(2, '0')}-${ano}`;
                button.addEventListener('click', function () {
                    selecionarMesAno(button.dataset.mesAno);
                });

                mesSelector.appendChild(button);

                if (ano === currentYear && mes === currentMonth) {
                    button.classList.add('active');
                    selecionarMesAno(button.dataset.mesAno);
                }
            }
        }
    }

    gerarMeses();
});

function selecionarMesAno(mesAno) {
    const monthButtons = document.querySelectorAll('.mes-button');
    monthButtons.forEach(btn => btn.classList.remove('active'));

    const selectedButton = [...monthButtons].find(btn => btn.dataset.mesAno === mesAno);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }

    const mesSelectorValue = document.getElementById('mesSelectorValue');
    if (mesSelectorValue) {
        mesSelectorValue.value = mesAno;
    }

    buscarDados()
    buscarDadosCategoria()
    buscarSaidaCategoria()
}


function scrollMeses(direcao) {
    const mesSelector = document.getElementById('mesSelector'); // Corrigido
    const scrollAmount = 150;

    if (direcao === 'left') {
        mesSelector.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else if (direcao === 'right') {
        mesSelector.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
}


$(document).ready(function() {
    $('#mesSelectorValue').datepicker({
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
        }
    });
});