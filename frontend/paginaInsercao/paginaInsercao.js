document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadTemplateAndStyles();
    } catch (error) {
        console.error('Erro ao carregar o template:', error);
    }

    initializePage();
    initializePageConsulta();
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

function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

let IDCLIENTE = 0;
let IDBANCO = 0;

function formatarData(data) {
    if (data === '0000-00-00') return '00/00/0000';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function initializePage() {
    fetch(`/insercao/dados-empresa?nomeEmpresa=${getStoredEmpresaName()}`)
        .then(response => response.json())
        .then(data => {
            IDCLIENTE = data[0].IDCLIENTE;
            document.getElementById('id_empresa').value = IDCLIENTE;
            const nomeEmpresa = getStoredEmpresaName();
            fetch(`/insercao/dados-categoria?idcliente=${encodeURIComponent(IDCLIENTE)}`)
                .then(response => response.json())
                .then(data => {
                    const select = document.getElementById('seletorCategoria');
                    const categorias = construirArvoreDeCategorias(data);
                    adicionarCategoriasAoSelect(select, categorias);
                })
                .catch(error => {
                    console.error('Erro ao carregar os dados:', error);
                });

            fetch(`/insercao/dados?idcliente=${IDCLIENTE}`)
                .then(response => response.json())
                .then(data => {
                    const select = document.getElementById('seletorBanco');
                    data.forEach(banco => {
                        const option = document.createElement('option');
                        option.value = banco.IDBANCO;
                        IDBANCO = option.value;
                        option.textContent = banco.NOME_TIPO;
                        select.appendChild(option);
                    });
                })

            fetch(`/fornecedor/listar?idcliente=${IDCLIENTE}`)
                .then(response => response.json())
                .then(data => {
                    const select = document.getElementById('seletorFornecedor');
                    data.forEach(fornecedor => {
                        const option = document.createElement('option');
                        option.value = fornecedor.IDFORNECEDOR;
                        option.textContent = fornecedor.NOME_TIPO;
                        select.appendChild(option);
                    });
                })
        })
        .catch(error => {
            console.error('Erro ao carregar dados da empresa:', error);
        });
}

function construirArvoreDeCategorias(categorias) {
    let mapa = {};
    let arvore = [];

    categorias.forEach(categoria => {
        mapa[categoria.IDCATEGORIA] = {...categoria, subcategorias: []};
    });

    Object.values(mapa).forEach(categoria => {
        if (categoria.ID_CATEGORIA_PAI) {
            if (mapa[categoria.ID_CATEGORIA_PAI]) {
                mapa[categoria.ID_CATEGORIA_PAI].subcategorias.push(categoria);
            }
        } else {
            arvore.push(categoria);
        }
    });
    return arvore;
}

function resetForm() {
    document.getElementById('meuFormulario').reset();
}

function adicionarCategoriasAoSelect(select, categorias, prefixo = '') {
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.IDCATEGORIA;
        option.textContent = prefixo + categoria.NOME;
        select.appendChild(option);

        if (categoria.subcategorias.length > 0) {
            adicionarCategoriasAoSelect(select, categoria.subcategorias, prefixo + '---');
        }
    });
}

function abrirPopUp() {
    document.getElementById("popup").style.display = "block";
    document.getElementById("sobreposicao").style.display = "block";
}

function fecharPopUp() {
    document.getElementById("popup").style.display = "none";
    document.getElementById("sobreposicao").style.display = "none";
    location.reload();
}

function excelDateToJSDate(excelDate) {
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    const convertedDate = date.toISOString().split('T')[0];
    return convertedDate;
}

function mostrarPopupCarregamento() {
    var popup = document.getElementById('loadingPopup');
    if (popup) {
        popup.style.display = 'block';
    } else {
        console.error('Loading popup element not found');
    }
}

function fecharPopupCarregamento() {
    document.getElementById('loadingPopup').style.display = 'none';
}

function formatarValorFinanceiro(valor) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lerExcel() {
    var input = document.getElementById('excelFile');
    var reader = new FileReader();
    var idEmpresa = IDCLIENTE;

    reader.onload = function () {
        var fileData = reader.result;
        var workbook = XLSX.read(fileData, { type: 'binary' });
        workbook.SheetNames.forEach(function (sheetName) {
            var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            XL_row_object.forEach(function (row) {
                if (row['Data'] && !isNaN(row['Data'])) {
                    row['Data'] = excelDateToJSDate(row['Data']);
                }
                row['IDCLIENTE'] = idEmpresa;
                row['IDBANCO'] = IDBANCO;

                if (row['Saida']) {
                    row['Saida'] = formatarValorFinanceiro(parseFloat(row['Saida']));
                }
                if (row['Entrada']) {
                    row['Entrada'] = formatarValorFinanceiro(parseFloat(row['Entrada']));
                }
            });
            var json_object = JSON.stringify(XL_row_object);
            console.log("JSON Convertido:", json_object);

            mostrarPopupCarregamento();

            fetch('/insercao/inserir-lote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: json_object
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro na resposta do servidor');
                    }
                    return response.text();
                })
                .then(data => {
                    fecharPopupCarregamento();
                    console.log(data);
                })
                .catch(error => {
                    fecharPopupCarregamento();
                    console.error('Falha ao enviar dados:', error);
                });
        });
    };

    reader.onerror = function (ex) {
        console.log(ex);
    };

    reader.readAsBinaryString(input.files[0]);
}

document.addEventListener('DOMContentLoaded', function() {
    const seletorBanco = document.getElementById('seletorBanco');
    const idBancoPost = document.getElementById('id_bancoPost');
    const formulario = document.getElementById('meuFormulario');

    seletorBanco.addEventListener('change', function() {
        IDBANCO = this.value;
        idBancoPost.value = seletorBanco.value;
    });

    formulario.addEventListener('submit', function() {
        idBancoPost.value = seletorBanco.value;
    });
    idBancoPost.value = seletorBanco.value;

    $('#seletorFornecedor').select2({
        placeholder: "Selecione um fornecedor",
        allowClear: true,
        sorter: data => data.sort((a, b) => a.text.localeCompare(b.text))
    });

    $('#seletorCategoria').select2({
        placeholder: "Selecione uma rúbrica",
        allowClear: true
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const valorEnInput = document.getElementById('valorEn');
    const valorSaInput = document.getElementById('valorSa');

    valorEnInput.addEventListener('input', function() {
        this.value = formatarValorFinanceiroInput(this.value);
    });

    valorSaInput.addEventListener('input', function() {
        this.value = formatarValorFinanceiroInput(this.value);
    });
});

function formatarValorFinanceiroInput(valor) {
    valor = valor.replace(/\D/g, '');
    valor = (valor / 100).toFixed(2) + '';
    valor = valor.replace(".", ",");
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return valor;
}

function initializePageConsulta() {
    const nomeEmpresa = getStoredEmpresaName();

    fetch(`insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                console.log('Dados da empresa recebidos:', data);
                idEmpresa = data[0].IDCLIENTE;
                console.log('idEmpresa definido como:', idEmpresa);

                fetch(`/insercao/dados?idcliente=${idEmpresa}`)
                    .then(response => response.json())
                    .then(data => {
                        const select = document.getElementById('seletorBanco');
                        if (data.length > 0) {
                            data.forEach(banco => {
                                const option = document.createElement('option');
                                option.value = banco.IDBANCO;
                                option.textContent = banco.NOME_TIPO;
                                select.appendChild(option);
                            });
                            select.selectedIndex = 1;
                            IDBANCO = select.options[1].value;
                        }
                    })
                    .then(() => {
                        // Definir o mês atual no seletor de mês/ano
                        const seletorMesAno = document.getElementById('seletorMesAno');
                        const hoje = new Date();
                        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                        const ano = hoje.getFullYear();
                        seletorMesAno.value = `${mes}-${ano}`;
                        buscarDados();
                    });

                fetch(`/fornecedor/listar?idcliente=${idEmpresa}`)
                    .then(response => response.json())
                    .then(data => {
                        const select = document.getElementById('seletorFornecedor');
                        const semFornecedor = document.createElement('option');
                        semFornecedor.value = '';
                        semFornecedor.textContent = 'Sem fornecedor';
                        select.appendChild(semFornecedor);
                        data.forEach(fornecedor => {
                            const option = document.createElement('option');
                            option.value = fornecedor.IDFORNECEDOR;
                            option.textContent = fornecedor.NOME_TIPO;
                            select.appendChild(option);
                        });
                    });
            } else {
                console.error('Dados da empresa não retornados ou vazios');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados da empresa:', error);
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
        }
    });
});

function formatDateToFirstOfMonth(mesAnoString) {
    if (!mesAnoString) return '';

    const [mes, ano] = mesAnoString.split('-');
    return `${ano}-${mes}-01`;
}

function buscarDados() {
    const idBanco = IDBANCO || document.getElementById('seletorBanco').value;
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

function formatarValorNumerico(valor) {
    return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function atualizarTabela(dados) {
    console.log('Atualizando tabela com:', dados);
    const tbody = document.getElementById('extrato-body');
    tbody.innerHTML = '';
    let saldo = 0;

    dados.forEach((item, index) => {
        if (!item.ID_SUBEXTRATO) { // Só exibe linhas principais
            const row = tbody.insertRow();
            row.dataset.idextrato = item.IDEXTRATO; // Para jQuery UI Sortable

            const dragCell = row.insertCell();
            const dragIcon = document.createElement('img');

            dragIcon.src = '/paginaInsercao/imagens/dragItem.png';
            dragIcon.classList.add('drag-handle');
            dragCell.appendChild(dragIcon);

            row.insertCell().textContent = formatDate(item.DATA);
            row.insertCell().textContent = item.CATEGORIA;
            row.insertCell().textContent = item.DESCRICAO;
            row.insertCell().textContent = item.NOME_NO_EXTRATO;
            row.insertCell().textContent = item.NOME_FORNECEDOR;

            const entradaCell = row.insertCell();
            const saidaCell = row.insertCell();
            if (item.TIPO_DE_TRANSACAO === 'ENTRADA') {
                entradaCell.textContent = formatarValorNumerico(item.VALOR);
                saidaCell.textContent = "";
                saldo += parseFloat(item.VALOR);
            } else {
                entradaCell.textContent = "";
                saidaCell.textContent = formatarValorNumerico(item.VALOR);
                saldo -= parseFloat(item.VALOR);
            }

            row.insertCell().textContent = formatarValorNumerico(saldo);

            const anexosCell = row.insertCell();
            const deleteCell = row.insertCell();

            anexosCell.innerHTML = `<button onclick="abrirPopupAnexos(${item.IDEXTRATO})"><i class="fa fa-paperclip"></i></button>`;

            deleteCell.innerHTML = `<form action="insercao/deletar-extrato" method="post">
                                        <input type="hidden" name="idExtrato" value="${item.IDEXTRATO}">
                                        <button type="submit" class="delete-btn" style="width: 2vw; cursor: pointer"><img src="paginaInsercao/imagens/lixeira.png" style="width: 100%;"></button>
                                    </form>
                                    <button onclick="editarExtrato(${item.IDEXTRATO})">EDITAR</button>
                                    <button onclick="selecionarLinha(this)" data-idextrato="${item.IDEXTRATO}">SELECIONAR</button>
                                    <button onclick="adicionarSubdivisao(${item.IDEXTRATO})">SUBDIVIDIR</button>`;

            // Adiciona as subdivisões
            dados.forEach(subItem => {
                if (subItem.ID_SUBEXTRATO === item.IDEXTRATO) {
                    const subRow = tbody.insertRow();
                    subRow.classList.add('sub-linha');
                    subRow.dataset.idextrato = subItem.IDEXTRATO;

                    subRow.insertCell().textContent = '';
                    subRow.insertCell().textContent = formatDate(subItem.DATA);
                    subRow.insertCell().textContent = subItem.CATEGORIA;
                    subRow.insertCell().textContent = subItem.DESCRICAO;
                    subRow.insertCell().textContent = subItem.NOME_NO_EXTRATO;
                    subRow.insertCell().textContent = subItem.NOME_FORNECEDOR;

                    const subEntradaCell = subRow.insertCell();
                    const subSaidaCell = subRow.insertCell();
                    if (subItem.TIPO_DE_TRANSACAO === 'ENTRADA') {
                        subEntradaCell.textContent = formatarValorNumerico(subItem.VALOR);
                        subSaidaCell.textContent = "";
                    } else {
                        subEntradaCell.textContent = "";
                        subSaidaCell.textContent = formatarValorNumerico(subItem.VALOR);
                    }

                    subRow.insertCell().textContent = ''; // Subdivisões não exibem saldo

                    const subAnexosCell = subRow.insertCell();
                    const subDeleteCell = subRow.insertCell();

                    subAnexosCell.innerHTML = `<button onclick="abrirPopupAnexos(${subItem.IDEXTRATO})"><i class="fa fa-paperclip"></i></button>`;

                    subDeleteCell.innerHTML = `<form action="insercao/deletar-extrato" method="post">
                                                <input type="hidden" name="idExtrato" value="${subItem.IDEXTRATO}">
                                                <button type="submit" class="delete-btn" style="width: 2vw; cursor: pointer"><img src="paginaInsercao/imagens/lixeira.png" style="width: 100%;"></button>
                                            </form>
                                            <button onclick="editarExtrato(${subItem.IDEXTRATO})">EDITAR</button>
                                            <button onclick="selecionarLinha(this)" data-idextrato="${subItem.IDEXTRATO}">SELECIONAR</button>`;
                }
            });
        }
    });
    fetchSaldoInicialEFinal(saldo);
}

function adicionarSubdivisao(idExtrato) {
    const row = document.querySelector(`[data-idextrato='${idExtrato}']`);
    const newRow = document.createElement('tr');
    newRow.classList.add('sub-linha');
    newRow.innerHTML = `
        <td></td>
        <td><input type="date" name="dataSub" required></td>
        <td><input type="text" name="categoriaSub" required></td>
        <td><input type="text" name="descricaoSub" required></td>
        <td><input type="text" name="nomeExtratoSub" required></td>
        <td><input type="text" name="fornecedorSub" required></td>
        <td><input type="number" name="valorEntradaSub"></td>
        <td><input type="number" name="valorSaidaSub"></td>
        <td></td>
        <td><input type="file" name="anexoSub"></td>
        <td><button onclick="salvarSubdivisao(${idExtrato}, this)">Salvar</button></td>
    `;
    row.insertAdjacentElement('afterend', newRow);
}

function salvarSubdivisao(idExtratoPrincipal, button) {
    const row = button.closest('tr');
    const data = row.querySelector('input[name="dataSub"]').value;
    const categoria = row.querySelector('input[name="categoriaSub"]').value;
    const descricao = row.querySelector('input[name="descricaoSub"]').value;
    const nomeExtrato = row.querySelector('input[name="nomeExtratoSub"]').value;
    const fornecedor = row.querySelector('input[name="fornecedorSub"]').value;
    const valorEntrada = row.querySelector('input[name="valorEntradaSub"]').value || 0;
    const valorSaida = row.querySelector('input[name="valorSaidaSub"]').value || 0;
    const anexo = row.querySelector('input[name="anexoSub"]').files[0];

    const formData = new FormData();
    formData.append('idExtratoPrincipal', idExtratoPrincipal);
    formData.append('data', data);
    formData.append('categoria', categoria);
    formData.append('descricao', descricao);
    formData.append('nomeExtrato', nomeExtrato);
    formData.append('fornecedor', fornecedor);
    formData.append('valorEntrada', valorEntrada);
    formData.append('valorSaida', valorSaida);
    if (anexo) {
        formData.append('anexo', anexo);
    }

    fetch('/insercao/salvar-subdivisao', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Subdivisão salva com sucesso');
                buscarDados();
            } else {
                alert('Erro ao salvar subdivisão');
            }
        })
        .catch(error => {
            console.error('Erro ao salvar subdivisão:', error);
            alert('Erro ao salvar subdivisão');
        });
}

function fetchSaldoInicialEFinal(saldoAtual) {
    const mesAno = $('#seletorMesAno').val();
    const dataFormatada = formatDateToFirstOfMonth(mesAno);

    fetch(`/consulta/saldoinicial?banco=${document.getElementById('seletorBanco').value}&data=${dataFormatada}`)
        .then(response => response.json())
        .then(data => {
            const table = document.getElementById('saldoInicialTable');
            const tbody = table.querySelector('tbody');
            tbody.innerHTML = '';
            let saldoinicial = 0;
            data.forEach(item => {
                const row = tbody.insertRow();
                saldoinicial += parseFloat(item.saldo);
                row.insertCell().textContent = formatarValorNumerico(item.saldo);
            });

            // Limpar conteúdo da tabela de saldo final
            const table2 = document.getElementById('saldoFinalTable');
            const tbodysaldofinal = table2.querySelector('tbody');
            tbodysaldofinal.innerHTML = ''; // Limpar antes de adicionar novas linhas
            const saldoFinal = saldoAtual + saldoinicial;
            const rowFinal = tbodysaldofinal.insertRow();
            rowFinal.insertCell().textContent = formatarValorNumerico(saldoFinal);
        });
}

let linhasSelecionadas = [];
function selecionarLinha(buttonElement) {
    const idExtrato = buttonElement.getAttribute('data-idextrato');
    if (linhasSelecionadas.includes(idExtrato)) {
        const index = linhasSelecionadas.indexOf(idExtrato);
        linhasSelecionadas.splice(index, 1);
        buttonElement.classList.remove('selecionado');
    } else {
        linhasSelecionadas.push(idExtrato);
        buttonElement.classList.add('selecionado');
    }
}

function deletarSelecionados() {
    if (linhasSelecionadas.length === 0) {
        alert('Selecione ao menos uma linha para deletar');
        return;
    }

    if (!confirm(`Tem certeza que deseja deletar ${linhasSelecionadas.length} extrato(s) selecionado(s)?`)) {
        return;
    }

    const form = document.createElement('form');
    form.action = '/insercao/deletar-extrato';
    form.method = 'post';

    linhasSelecionadas.forEach(idExtrato => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'idExtrato';
        input.value = idExtrato;
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
}

function gerarPDF() {
    var { jsPDF } = window.jspdf;
    var doc = new jsPDF('l', 'mm', 'a4');

    var fillColor = [139, 172, 175];
    var textColor = [0, 0, 0];

    var dadosTabela = [];
    $('#consulta thead tr').each(function() {
        var linha = [];
        $('th', this).each(function(index) {
            if (index !== 8) {
                linha.push($(this).text());
            }
        });
        dadosTabela.push(linha);
    });

    $('#consulta tbody tr').each(function() {
        var linha = [];
        $('td', this).each(function(index) {
            if (index !== 8) {
                linha.push($(this).text());
            }
        });
        dadosTabela.push(linha);
    });

    doc.autoTable({
        head: [dadosTabela[0]],
        body: dadosTabela.slice(1),
        startY: 10,
        margin: { horizontal: 10 },
        didParseCell: function(data) {
            if (data.cell.section === 'head') {
                data.cell.styles.fillColor = fillColor;
                data.cell.styles.textColor = textColor;
            }
        }
    });

    ['saldoInicial', 'saldoFinal'].forEach(id => {
        var saldoTabela = [];
        $(`#${id}Table thead tr`).each(function() {
            var linhaCabecalho = [];
            $('th', this).each(function() {
                linhaCabecalho.push($(this).text());
            });
            saldoTabela.push(linhaCabecalho);
        });

        $(`#${id}Table tbody tr`).each(function() {
            var linhaDados = [];
            $('td', this).each(function() {
                linhaDados.push($(this).text());
            });
            saldoTabela.push(linhaDados);
        });

        var startY = doc.autoTable.previous ? doc.autoTable.previous.finalY + 10 : 10;

        doc.autoTable({
            head: [saldoTabela[0]],
            body: saldoTabela.slice(1),
            startY: startY,
            margin: { horizontal: 10 },
            theme: 'grid',
            didParseCell: function(data) {
                if (data.cell.section === 'head') {
                    data.cell.styles.fillColor = fillColor;
                    data.cell.styles.textColor = textColor;
                }
            }
        });
    });

    var nomeBanco = document.getElementById('seletorBanco').options[document.getElementById('seletorBanco').selectedIndex].text;
    var nomeEmpresa = getStoredEmpresaName();
    var mesAnoSelecionado = $('#seletorMesAno').val();
    var partesData = mesAnoSelecionado.split('-');
    var dataFormatada = partesData[1] + '-' + partesData[0];
    var nomeArquivo = `Tabela_${nomeEmpresa}_${nomeBanco}_${dataFormatada}.pdf`;

    // Salva o PDF
    doc.save(nomeArquivo);
}

function gerarExcel() {
    var wb = XLSX.utils.table_to_book(document.getElementById('consulta'), { sheet: "Sheet1" });
    wb.Sheets['Sheet1']['A2'].z = 'yyyy-mm-dd';
    XLSX.writeFile(wb, 'tabela.xlsx');
}

function editarExtrato(idExtrato) {
    const urlDeEdicao = `/consulta/editar?id=${idExtrato}`;

    const iframe = document.createElement('iframe');
    iframe.src = urlDeEdicao;
    iframe.style.width = "100%";
    iframe.style.height = "100%";

    const iframeContainer = document.getElementById('iframe-container');
    iframeContainer.innerHTML = '';
    iframeContainer.appendChild(iframe);

    iframeContainer.style.display = 'block';
}

function abrirPopupAnexos(idExtrato) {
    document.getElementById('idExtratoAnexo').value = idExtrato;
    const popup = document.getElementById('anexo-popup');
    const anexoContent = document.getElementById('anexo-content');
    anexoContent.innerHTML = '';

    fetch(`/insercao/anexos?idExtrato=${idExtrato}`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                anexoContent.innerHTML = '<p>Sem anexos</p>';
            } else {
                data.forEach(anexo => {
                    const link = document.createElement('a');
                    link.href = `/consulta/download-anexo/${anexo.NOME_ARQUIVO}`;
                    link.target = '_blank';

                    const img = document.createElement('img');
                    if (anexo.NOME_ARQUIVO.toLowerCase().endsWith('.pdf')) {
                        img.src = '/paginaInsercao/imagens/pdfImage.png';
                    } else if (anexo.NOME_ARQUIVO.toLowerCase().endsWith('.xlsx') || anexo.NOME_ARQUIVO.toLowerCase().endsWith('.xls')) {
                        img.src = '/paginaInsercao/imagens/excelIcon.jpeg';
                    } else if (anexo.NOME_ARQUIVO.toLowerCase().endsWith('.doc') || anexo.NOME_ARQUIVO.toLowerCase().endsWith('.docx')) {
                        img.src = '/paginaInsercao/imagens/wordIcon.jpeg';
                    } else if (anexo.NOME_ARQUIVO.toLowerCase().endsWith('.png') || anexo.NOME_ARQUIVO.toLowerCase().endsWith('.jpg') || anexo.NOME_ARQUIVO.toLowerCase().endsWith('.jpeg')) {
                        img.src = `/paginaInsercao/imagens/imagesIcon.png`;
                    } else {
                        img.src = '/paginaInsercao/imagens/unknownFile.png';
                    }

                    link.appendChild(img);

                    const text = document.createElement('span');
                    text.textContent = anexo.NOME_ARQUIVO;
                    text.classList.add('anexo-text');

                    link.appendChild(text);
                    anexoContent.appendChild(link);
                });
            }
            popup.style.display = 'flex';
        })
        .catch(error => {
            console.error('Erro ao carregar anexos:', error);
            anexoContent.innerHTML = '<p>Erro ao carregar anexos</p>';
            popup.style.display = 'flex';
        });
}

function fecharPopup() {
    document.getElementById('anexo-popup').style.display = 'none';
}

function uploadAnexo() {
    const formData = new FormData();
    const anexoFile = document.getElementById('anexoFile').files[0];
    const idExtrato = document.getElementById('idExtratoAnexo').value;

    formData.append('anexo', anexoFile);
    formData.append('idExtrato', idExtrato);

    fetch('/insercao/upload-anexo', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                fecharPopup();
                alert('Anexo enviado com sucesso');
            } else {
                alert('Erro ao enviar anexo');
            }
        })
        .catch(error => {
            console.error('Erro ao enviar anexo:', error);
            alert('Erro ao enviar anexo');
        });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

$(function() {
    $("#consulta tbody").sortable({
        handle: '.drag-handle',
        stop: function(event, ui) {
            let order = [];
            $("#consulta tbody tr").each(function(index) {
                const idExtrato = $(this).data("idextrato");
                order.push({ idExtrato: idExtrato, ordem: index + 1 });
            });
            salvarOrdem(order);
        }
    }).disableSelection();
});


function salvarOrdem(ordem) {
    if (!Array.isArray(ordem)) {
        console.error('Formato de ordem inválido');
        return;
    }

    fetch('/consulta/salvar-ordem', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ordem: ordem })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Ordem salva com sucesso');
            } else {
                console.error('Erro ao salvar ordem');
            }
        })
        .catch(error => {
            console.error('Erro ao salvar ordem:', error);
        });
}

