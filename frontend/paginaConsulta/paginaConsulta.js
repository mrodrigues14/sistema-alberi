
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

let idEmpresa = 0;

function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

window.onload = function() {
    fetch('/templateMenu/template.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('menu-container').innerHTML = data;

            var link = document.createElement('link');
            link.href = '/templateMenu/styletemplate.css';
            link.rel = 'stylesheet';
            link.type = 'text/css';
            document.head.appendChild(link);

            var script = document.createElement('script');
            script.src = '/templateMenu/templateScript.js';
            script.onload = function () {
                loadAndDisplayUsername();
                handleEmpresa();
            };
            document.body.appendChild(script);
        })
        .catch(error => {
            console.error('Erro ao carregar o template:', error);
        });

    fetch('/insercao/dados')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const select = document.getElementById('seletorBanco');
            const campoOculto = document.querySelector('input[name="id_banco"]');
            data.forEach(banco => {
                const option = document.createElement('option');
                option.value = banco.IDBANCO;
                option.textContent = banco.NOME;
                select.appendChild(option);
            });

            campoOculto.value = select.value;

            select.addEventListener('change', function () {
                campoOculto.value = select.value;
            });
        })
        .catch(error => {
            console.error('Erro ao carregar os dados:', error);
        });

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
};

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
        }
    });
});

function formatDateToFirstOfMonth(mesAnoString) {
    if (!mesAnoString) return '';

    const [mes, ano] = mesAnoString.split('-');
    return `${ano}-${mes}-01`;
}


function buscarDados() {
    const idBanco = document.getElementById('seletorBanco').value;
    const mesAno = $('#seletorMesAno').val();
    const dataFormatada = formatDateToFirstOfMonth(mesAno);

    console.log('Buscando dados para o banco:', idBanco, 'e data:', dataFormatada, 'e empresa:', idEmpresa);

    const url = `/consulta/dados?banco=${idBanco}&data=${dataFormatada}&empresa=${idEmpresa}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Dados recebidos:', data);
            atualizarTabela(data);
        })
        .catch(error => {
            console.error('Erro ao buscar os dados:', error);
        });
}

function atualizarTabela(dados) {
    console.log('Atualizando tabela com:', dados);
    const tbody = document.getElementById('consulta').querySelector('tbody');
    tbody.innerHTML = '';
    let saldo = 0;

    dados.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell().textContent = formatDate(item.DATA);
        row.insertCell().textContent = item.CATEGORIA;
        row.insertCell().textContent = item.DESCRICAO;
        row.insertCell().textContent = item.NOME_NO_EXTRATO;
        if(item.TIPO_DE_TRANSACAO == 'ENTRADA'){
            row.insertCell().textContent = item.VALOR.toFixed(2)
            row.insertCell().textContent = ""
            saldo += parseFloat(item.VALOR);
        }
        else{
            row.insertCell().textContent = ""
            row.insertCell().textContent = item.VALOR.toFixed(2);
            saldo -= parseFloat(item.VALOR);
        }
        row.insertCell().textContent = saldo.toFixed(2);
    });
}

function gerarPDF() {
    var { jsPDF } = window.jspdf;
    var doc = new jsPDF();
    var fillColor = [139,172,175];
    var textColor = [0, 0, 0];

    doc.autoTable({
        html: '#consulta',
        didParseCell: function (data) {
            if (data.cell.section === 'head') {
                data.cell.styles.fillColor = fillColor;
                data.cell.styles.textColor = textColor;
            }
        }
    });

    var nomeBanco = document.getElementById('seletorBanco').options[document.getElementById('seletorBanco').selectedIndex].text;
    var nomeEmpresa = getStoredEmpresaName();
    var mesAnoSelecionado = $('#seletorMesAno').val();
    var partesData = mesAnoSelecionado.split('-');
    var dataFormatada = partesData[1] + '-' + partesData[0];
    var nomeArquivo = `Tabela_${nomeEmpresa}_${nomeBanco}_${dataFormatada}.pdf`;

    doc.save(nomeArquivo);
}

function gerarExcel() {
    var wb = XLSX.utils.table_to_book(document.getElementById('consulta'), { sheet: "Sheet1" });
    wb.Sheets['Sheet1']['A2'].z = 'yyyy-mm-dd';
    XLSX.writeFile(wb, 'tabela.xlsx');
}

