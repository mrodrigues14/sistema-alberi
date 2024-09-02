let IDCLIENTE = 0;
let IDBANCO = 0;
let categoriasMap = new Map();
let fornecedoresMap = new Map();
let saldoinicial
let saldo
let linhasSelecionadas = [];
let NOMEBANCO


document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadTemplateAndStyles();
        await initializePage();
        await carregarCategoriasEFornecedores();
        initializePageConsulta();
        fetchSaldoInicial();
        fetchSaldoFinal();
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

function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

function initializePage() {
    fetch(`/insercao/dados-empresa?nomeEmpresa=${getStoredEmpresaName()}`)
        .then(response => response.json())
        .then(data => {
            IDCLIENTE = data[0].IDCLIENTE;
            document.getElementById('id_empresa').value = IDCLIENTE;

            const select = document.getElementById('seletorCategoria');
            while (select.firstChild) {
                select.removeChild(select.firstChild);
            }

            fetch(`/insercao/dados-categoria?idcliente=${IDCLIENTE}`)
                .then(response => response.json())
                .then(data => {
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = 'Selecione uma Rubrica';
                    select.appendChild(defaultOption);

                    const categorias = construirArvoreDeCategorias(data);
                    adicionarCategoriasAoSelect(select, categorias);
                })
                .catch(error => {
                    console.error('Erro ao carregar os dados:', error);
                });

            fetch(`/insercao/dados?idcliente=${IDCLIENTE}`)
                .then(response => response.json())
                .then(data => {
                    const selectBanco = document.getElementById('seletorBanco');
                    data.forEach(banco => {
                        const option = document.createElement('option');
                        option.value = banco.IDBANCO;
                        IDBANCO = option.value;
                        option.textContent = banco.NOME_TIPO;
                        selectBanco.appendChild(option);
                    });
                })

            fetch(`/fornecedor/listar?idcliente=${IDCLIENTE}`)
                .then(response => response.json())
                .then(data => {
                    const selectFornecedor = document.getElementById('seletorFornecedor');
                    data.forEach(fornecedor => {
                        const option = document.createElement('option');
                        option.value = fornecedor.IDFORNECEDOR;
                        option.textContent = fornecedor.NOME_TIPO;
                        selectFornecedor.appendChild(option);
                    });
                })
        })
        .catch(error => {
            console.error('Erro ao carregar dados da empresa:', error);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    const mesSelector = document.getElementById('mesSelector');
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();  // 0-based (Janeiro é 0, Fevereiro é 1, etc.)
    const currentYear = currentDate.getFullYear();

    function gerarMeses() {
        for (let ano = currentYear - 1; ano <= currentYear + 1; ano++) {
            for (let mes = 0; mes < 12; mes++) {
                const button = document.createElement('button');
                button.classList.add('mes-button');
                const monthName = new Date(ano, mes).toLocaleString('pt-BR', { month: 'long' });
                button.textContent = `${monthName}/${ano}`;
                button.dataset.mesAno = `${String(mes + 1).padStart(2, '0')}-${ano}`;
                button.addEventListener('click', function() {
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

    // Armazena o valor selecionado no elemento hidden
    const mesSelectorValue = document.getElementById('mesSelectorValue');
    mesSelectorValue.value = mesAno;

    // Chama a função que atualiza os dados para o mês selecionado
    buscarDados();
}

// Função de rolagem para os botões de mês
function scrollMeses(direcao) {
    const mesSelector = document.getElementById('mesSelectorValue');
    const scrollAmount = 150; // Quantidade de pixels para deslocar a cada clique

    if (direcao === 'left') {
        mesSelector.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else if (direcao === 'right') {
        mesSelector.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
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

document.getElementById('meuFormulario').addEventListener('submit', async function(event) {
    event.preventDefault(); // Previne o envio padrão do formulário

    // Captura os valores do formulário
    const formData = new FormData(this);

    const Data = formData.get('Data');
    const categoria = formData.get('categoria');
    const fornecedor = formData.get('fornecedor');
    const descricao = formData.get('descricao');
    const nomeExtrato = formData.get('nomeExtrato');
    const valorEn = document.getElementById('valorEn').value.replace(/\./g, '').replace(',', '.'); // Captura e formata o valor de entrada
    const valorSa = document.getElementById('valorSa').value.replace(/\./g, '').replace(',', '.'); // Captura e formata o valor de saída
    const id_empresa = formData.get('id_empresa');
    const id_bancoPost = IDBANCO;

    // Monta o objeto para enviar via fetch
    const dados = {
        Data,
        categoria,
        descricao,
        nomeExtrato,
        valorEn,
        valorSa,
        id_bancoPost,
        id_empresa,
        fornecedor
    };
    console.log(dados)
    try {
        const response = await fetch('/insercao/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            // Redireciona ou mostra uma mensagem de sucesso
            window.location.href = '/insercao';
        } else {
            throw new Error('Erro ao inserir dados');
        }
    } catch (error) {
        console.error(error);
        alert('Ocorreu um erro ao inserir os dados. Por favor, tente novamente.');
    }
});

function adicionarCategoriasAoSelect(select, categorias, prefixo = '') {
    categorias.forEach(categoria => {
        const existingOption = Array.from(select.options).find(option => option.value === categoria.IDCATEGORIA.toString());
        if (!existingOption) {
            const option = document.createElement('option');
            option.value = categoria.IDCATEGORIA;
            option.textContent = prefixo + categoria.NOME;

            if (categoria.subcategorias.length > 0) {
                option.disabled = true; // Desabilitar categorias que possuem subcategorias
            }

            select.appendChild(option);

            if (categoria.subcategorias.length > 0) {
                adicionarCategoriasAoSelect(select, categoria.subcategorias, prefixo + '---');
            }
        }
    });
}

function excelDateToJSDate(excelDate) {
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    const convertedDate = date.toISOString().split('T')[0];
    return convertedDate;
}

function formatarValorFinanceiro(valor) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarValorParaInsercao(valor) {
    return parseFloat(valor.replace(/\./g, '').replace(',', '.')).toFixed(2);
}

function formatarValorFinanceiroInput(valor) {
    valor = valor.replace(/\D/g, '');
    valor = (valor / 100).toFixed(2) + '';
    valor = valor.replace(".", ",");
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return valor;
}

function formatarValorParaExibicao(valor) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lerExcel() {
    document.getElementById('loadingSpinner').style.display = 'block';
    var input = document.getElementById('excelFile');
    var reader = new FileReader();

    reader.onload = function () {
        var fileData = reader.result;
        var workbook = XLSX.read(fileData, { type: 'binary' });
        var extrato = [];

        workbook.SheetNames.forEach(function (sheetName) {
            var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);

            XL_row_object.forEach(function (row) {
                if (row['Data'] && !isNaN(row['Data'])) {
                    row['Data'] = excelDateToJSDate(row['Data']);
                }
                extrato.push({
                    data: row['Data'],
                    rubrica: row['Categoria'] ? row['Categoria'].toLowerCase() : '',
                    descricao: row['Descricao'] || ' ',
                    observacao: row['Observacao'] || '',
                    fornecedor: row['Fornecedor'] ? row['Fornecedor'].toLowerCase() : '',
                    tipo: row['Entrada'] && !row['Saida'] ? 'entrada' : 'saida',
                    valor: row['Entrada'] || row['Saida']
                });
            });
        });

        mostrarExtratoPopup(extrato);

        document.getElementById('loadingSpinner').style.display = 'none';
    };

    reader.onerror = function (ex) {
        console.log(ex);
    };

    reader.readAsBinaryString(input.files[0]);
}
function fecharPopupCarregamentoInsercao() {
    document.getElementById('loadingSpinner').style.display = 'none';
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
    const formulario = document.getElementById('meuFormulario');
    const valorEnInput = document.getElementById('valorEn');
    const valorSaInput = document.getElementById('valorSa');

    formulario.addEventListener('submit', function(event) {
        valorEnInput.value = formatarValorParaInsercao(valorEnInput.value);
        valorSaInput.value = formatarValorParaInsercao(valorSaInput.value);
    });

    valorEnInput.addEventListener('input', function() {
        this.value = formatarValorFinanceiroInput(this.value);
    });

    valorSaInput.addEventListener('input', function() {
        this.value = formatarValorFinanceiroInput(this.value);
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
                        // Remover todas as opções existentes antes de adicionar novas
                        while (select.firstChild) {
                            select.removeChild(select.firstChild);
                        }
                        if (data.length > 0) {
                            data.forEach(banco => {
                                const option = document.createElement('option');
                                option.value = banco.IDBANCO;
                                option.textContent = banco.NOME_TIPO;
                                select.appendChild(option);
                            });
                            if (select.options.length > 1) {
                                select.selectedIndex = 1;
                                IDBANCO = select.options[1].value;
                            }
                        }
                    })
                    .then(() => {
                        // Definir o mês atual no seletor de mês/ano
                        const seletorMesAno = document.getElementById('mesSelectorValue');
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
                        // Remover todas as opções existentes antes de adicionar novas
                        while (select.firstChild) {
                            select.removeChild(select.firstChild);
                        }
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

document.addEventListener('DOMContentLoaded', function() {
    const seletorBanco = document.getElementById('seletorBanco');

    seletorBanco.addEventListener('change', function() {
        IDBANCO = this.value;
        buscarDados();
    });
});

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
            buscarDados(); // Realiza a consulta novamente ao trocar de mês/ano
        }
    });
});

function formatDateToFirstOfMonth(mesAnoString) {
    if (!mesAnoString) return '';

    const [mes, ano] = mesAnoString.split('-');
    return `${ano}-${mes}-01`;
}

async function buscarDados() {
    const idBancoElement = document.getElementById('seletorBanco');
    const idBanco = IDBANCO || (idBancoElement ? idBancoElement.value : null);

    if (!idBanco) {
        console.error('Banco não selecionado ou elemento não encontrado.');
        return;
    }

    const mesAno = document.getElementById('mesSelectorValue').value;
    const dataFormatada = formatDateToFirstOfMonth(mesAno);

    console.log('Buscando dados para o banco:', idBanco, 'e data:', dataFormatada, 'e empresa:', idEmpresa);

    try {
        const saldoInicial = await fetchSaldoInicial();

        const response = await fetch(`/consulta/dados?banco=${idBanco}&data=${dataFormatada}&empresa=${idEmpresa}`);
        const data = await response.json();

        atualizarTabela(data, saldoInicial);
        fetchSaldoFinal();
    } catch (error) {
        console.error('Erro ao buscar os dados:', error);
    }
}

function formatarValorNumerico(valor) {
    return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function carregarCategoriasEFornecedores() {
    fetch(`/insercao/dados-categoria?idcliente=${idEmpresa}`)
        .then(response => response.json())
        .then(categorias => {
            console.log("Dados recebidos no front-end:", categorias);

            categorias.forEach(categoria => {
                categoriasMap.set(categoria.IDCATEGORIA, categoria);

                if (categoria.ID_CATEGORIA_PAI) {
                    const categoriaPai = categoriasMap.get(categoria.ID_CATEGORIA_PAI);
                    if (categoriaPai) {
                        const chaveCombinada = `${categoriaPai.NOME.toLowerCase().trim()} - ${categoria.NOME.toLowerCase().trim()}`;
                        categoriasMap.set(chaveCombinada, categoria.IDCATEGORIA);
                    }
                } else {
                    categoriasMap.set(categoria.NOME.toLowerCase().trim(), categoria.IDCATEGORIA);
                }
            });

            console.log("Mapa de categorias:", categoriasMap);
        })
        .catch(error => {
            console.error('Erro ao buscar dados:', error);
        });


    fetch(`/fornecedor/listar?idcliente=${IDCLIENTE}`)
        .then(response => response.json())
        .then(data => {
            data.forEach(fornecedor => {
                fornecedoresMap.set(fornecedor.NOME_TIPO.toLowerCase().trim(), fornecedor.IDFORNECEDOR);
            });
            console.log(fornecedoresMap)
        });
}

function atualizarTabela(dados) {
    const tbody = document.getElementById('extrato-body');
    tbody.innerHTML = '';

    const saldoInicialTable = document.getElementById('saldoInicialTable');
    let saldoInicial = 0;

    if (saldoInicialTable) {
        const saldoInicialRow = saldoInicialTable.querySelector('tbody tr');
        if (saldoInicialRow) {
            const saldoInicialText = saldoInicialRow.cells[0].textContent;
            saldoInicial = parseFloat(saldoInicialText.replace(/\./g, '').replace(',', '.')) || 0;
        } else {
            console.warn('Nenhum saldo inicial encontrado na tabela.');
        }
    } else {
        console.warn('Elemento saldoInicialTable não encontrado.');
    }

    let saldo = saldoInicial;

    dados.forEach((item, index) => {
        if (!item.ID_SUBEXTRATO) {
            const row = tbody.insertRow();
            row.dataset.idextrato = item.IDEXTRATO;

            // Drag handle
            const dragCell = row.insertCell();
            const dragIcon = document.createElement('img');
            dragIcon.src = '/paginaInsercao/imagens/dragItem.png';
            dragIcon.classList.add('drag-handle');
            dragCell.appendChild(dragIcon);

            // Data
            row.insertCell().textContent = formatDate(item.DATA);

            // Categoria
            const categoriaCell = row.insertCell();
            const categoriaText = item.SUBCATEGORIA ? `${item.CATEGORIA} - ${item.SUBCATEGORIA}` : item.CATEGORIA;
            categoriaCell.textContent = categoriaText || 'Categoria não encontrada';

            const categoriaNome = item.SUBCATEGORIA
                ? item.SUBCATEGORIA.toLowerCase()
                : item.CATEGORIA.toLowerCase();

            if (!categoriaNome) {
                categoriaCell.classList.add('blink-red');
            }

            // Nome no Extrato
            row.insertCell().textContent = item.NOME_NO_EXTRATO;

            // Descrição
            row.insertCell().textContent = item.DESCRICAO;

            // Fornecedor
            const fornecedorCell = row.insertCell();
            fornecedorCell.textContent = item.NOME_FORNECEDOR || 'Fornecedor não encontrado';

            const fornecedorNome = item.NOME_FORNECEDOR ? item.NOME_FORNECEDOR.toLowerCase() : '';
            if (!fornecedorNome) {
                fornecedorCell.classList.add('blink-red');
            }

            // Entrada
            const entradaCell = row.insertCell();
            entradaCell.textContent = item.TIPO_DE_TRANSACAO === 'ENTRADA' ? formatarValorParaExibicao(item.VALOR) : "";

            // Saída
            const saidaCell = row.insertCell();
            saidaCell.textContent = item.TIPO_DE_TRANSACAO === 'SAIDA' ? formatarValorParaExibicao(item.VALOR) : "";

            // Saldo
            saldo += (parseFloat(item.VALOR) || 0) * (item.TIPO_DE_TRANSACAO === 'ENTRADA' ? 1 : -1);
            row.insertCell().textContent = formatarValorParaExibicao(saldo);

            // Anexos
            const anexosCell = row.insertCell();
            anexosCell.innerHTML = `<button onclick="abrirPopupAnexos(${item.IDEXTRATO})"><i class="fa fa-paperclip"></i></button>`;

            // Ações (Editar, Selecionar, Deletar)
            const deleteCell = row.insertCell();
            deleteCell.innerHTML = `
                <form action="insercao/deletar-extrato" method="post">
                    <input type="hidden" name="idExtrato" value="${item.IDEXTRATO}">
                    <button type="submit" class="delete-btn" style="width: 2vw; cursor: pointer"><img src="paginaInsercao/imagens/lixeira.png" style="width: 100%;"></button>
                </form>
                <button onclick="editarLinha(this)" data-idextrato="${item.IDEXTRATO}">EDITAR</button>
                <button onclick="selecionarLinha(this)" data-idextrato="${item.IDEXTRATO}">SELECIONAR</button>
            `;
        }
    });

    fetchSaldoInicial(saldo);
    const saldoFinalTable = document.getElementById('saldoFinalTable').querySelector('tbody');
    saldoFinalTable.innerHTML = '';

    const rowFinal = saldoFinalTable.insertRow();
    rowFinal.insertCell().textContent = formatarValorParaExibicao(saldo);
}

async function fetchSaldoInicial() {
    const mesAno = $('#mesSelectorValue').val();
    const dataFormatada = formatDateToFirstOfMonth(mesAno);

    try {
        const response = await fetch(`/consulta/saldoinicial?banco=${document.getElementById('seletorBanco').value}&data=${dataFormatada}&cliente=${idEmpresa}`);
        const data = await response.json();

        const saldoInicialTable = document.getElementById('saldoInicialTable').querySelector('tbody');
        saldoInicialTable.innerHTML = '';

        let saldoinicial = 0;

        if (data && data.SALDO) {
            saldoinicial = parseFloat(data.SALDO || 0);
        }

        const rowInicial = saldoInicialTable.insertRow();
        rowInicial.insertCell().textContent = formatarValorNumerico(saldoinicial);

        return saldoinicial;
    } catch (error) {
        console.error('Erro ao buscar saldo inicial:', error);
        return 0;
    }
}

function fetchSaldoFinal() {
    const extratoBody = document.getElementById('extrato-body');
    const rows = extratoBody.getElementsByTagName('tr');
    const saldoFinalTable = document.getElementById('saldoFinalTable').querySelector('tbody');

    const saldoInicialTable = document.getElementById('saldoInicialTable');
    let saldoInicial = 0;

    if (saldoInicialTable) {
        const saldoInicialRow = saldoInicialTable.querySelector('tbody tr');
        if (saldoInicialRow) {
            const saldoInicialText = saldoInicialRow.cells[0].textContent;
            saldoInicial = parseFloat(saldoInicialText.replace(/\./g, '').replace(',', '.')) || 0;
        } else {
            console.warn('Nenhum saldo inicial encontrado na tabela.');
        }
    } else {
        console.warn('Elemento saldoInicialTable não encontrado.');
    }

    let saldoFinal = saldoInicial;

    if (rows.length > 0) {
        Array.from(rows).forEach(row => {
            const entradaCell = row.cells[6].textContent.trim();
            const saidaCell = row.cells[7].textContent.trim();

            const entrada = parseFloat(entradaCell.replace(/\./g, '').replace(',', '.')) || 0;
            const saida = parseFloat(saidaCell.replace(/\./g, '').replace(',', '.')) || 0;

            saldoFinal += entrada - saida;
        });
    }

    saldoFinalTable.innerHTML = '';
    const rowFinal = saldoFinalTable.insertRow();
    rowFinal.insertCell().textContent = formatarValorNumerico(saldoFinal);
    definirSaldoInicialProximoMes(saldoFinal);
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

            buscarDados();
        }
    }).disableSelection();
});

function definirSaldoInicialProximoMes(saldoFinal) {
    const mesAnoAtual = $('#mesSelectorValue').val();
    const [mes, ano] = mesAnoAtual.split('-');
    let novoMes = parseInt(mes) + 1;
    let novoAno = parseInt(ano);

    if (novoMes > 12) {
        novoMes = 1;
        novoAno += 1;
    }

    const dataProximoMes = `${novoAno}-${String(novoMes).padStart(2, '0')}`;

    fetch(`/insercao/verificarSaldoInicial?cliente=${idEmpresa}&banco=${document.getElementById('seletorBanco').value}&data=${dataProximoMes}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao verificar saldo inicial: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data)
            if (data.definidoManual === 0) {
                fetch('/consulta/definirSaldoInicial', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        cliente: idEmpresa,
                        banco: document.getElementById('seletorBanco').value,
                        data: dataProximoMes,
                        saldo: saldoFinal.toFixed(2)
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Erro ao salvar saldo inicial para o próximo mês: ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .catch(error => {
                        console.error('Erro ao definir saldo inicial do próximo mês:', error);
                    });
            } else if (data.definidoManual === 0) {
                // Se o saldo não foi definido manualmente, define o saldo inicial
                fetch('/consulta/definirSaldoInicial', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        cliente: idEmpresa,
                        banco: document.getElementById('seletorBanco').value,
                        data: dataProximoMes,
                        saldo: saldoFinal.toFixed(2)
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Erro ao salvar saldo inicial para o próximo mês: ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .catch(error => {
                        console.error('Erro ao definir saldo inicial do próximo mês:', error);
                    });
            }
        })
        .catch(error => {
            console.error('Erro ao verificar saldo inicial do próximo mês:', error);
        });
}

let todasLinhasSelecionadas = false;

function selecionarLinha(buttonElement) {
    const idExtrato = buttonElement.getAttribute('data-idextrato');
    const linha = buttonElement.closest('tr');

    if (linhasSelecionadas.includes(idExtrato)) {
        const index = linhasSelecionadas.indexOf(idExtrato);
        linhasSelecionadas.splice(index, 1);
        linha.classList.remove('linha-selecionada');
    } else {
        linhasSelecionadas.push(idExtrato);
        linha.classList.add('linha-selecionada');
    }
}

function selecionarTodasLinhas() {
    const linhas = document.querySelectorAll('#consulta tbody tr');

    if (todasLinhasSelecionadas) {
        linhas.forEach(linha => {
            const idExtrato = linha.querySelector('button[data-idextrato]').getAttribute('data-idextrato');
            const index = linhasSelecionadas.indexOf(idExtrato);
            if (index > -1) {
                linhasSelecionadas.splice(index, 1);
            }
            linha.classList.remove('linha-selecionada');
        });
        todasLinhasSelecionadas = false;
    } else {
        linhas.forEach(linha => {
            const idExtrato = linha.querySelector('button[data-idextrato]').getAttribute('data-idextrato');
            if (!linhasSelecionadas.includes(idExtrato)) {
                linhasSelecionadas.push(idExtrato);
            }
            linha.classList.add('linha-selecionada');
        });
        todasLinhasSelecionadas = true;
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
    var mesAnoSelecionado = $('#mesSelectorValue').val();
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

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    initializePageConsulta();
    fetchSaldoInicial();
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

document.addEventListener('DOMContentLoaded', function() {
    const saldoInicialInput = document.getElementById('saldoInicialInput');
    const editarSaldoInicial = document.getElementById('editarSaldoInicial');
    const salvarSaldoInicialBtn = document.getElementById('salvarSaldoInicialBtn');

    editarSaldoInicial.addEventListener('click', function() {
        saldoInicialInput.removeAttribute('readonly');
        saldoInicialInput.focus();
        editarSaldoInicial.style.display = 'none';
        salvarSaldoInicialBtn.style.display = 'inline';
    });

    salvarSaldoInicialBtn.addEventListener('click', function() {
        const novoSaldo = parseFloat(saldoInicialInput.value.replace('.', '').replace(',', '.')).toFixed(2);
        const cliente = idEmpresa;
        const banco = IDBANCO;
        const data = formatDateToFirstOfMonth($('#mesSelectorValue').val());

        fetch('/consulta/definirSaldoInicial', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cliente, banco, data, saldo: novoSaldo })
        })
            .then(response => response.text())
            .then(data => {
                alert('Saldo inicial atualizado com sucesso!');
                saldoInicialInput.setAttribute('readonly', 'true');
                editarSaldoInicial.style.display = 'inline';
                salvarSaldoInicialBtn.style.display = 'none';
                buscarDados();
            })
            .catch(error => {
                console.error('Erro ao atualizar saldo inicial:', error);
                alert('Erro ao atualizar saldo inicial');
            });
    });

    saldoInicialInput.addEventListener('input', function() {
        this.value = formatarValorFinanceiroInput(this.value);
    });
});

function confirmarEdicao(buttonElement) {
    const row = buttonElement.closest('tr');
    const cells = row.querySelectorAll('td');

    const formatarData = (dataString) => {
        const [dia, mes, ano] = dataString.split('/');
        return `${ano}-${mes}-${dia}`;
    };

    let fornecedor;
    const fornecedorCell = cells[5];

    if (fornecedorCell.querySelector('input')) {
        fornecedor = fornecedorCell.querySelector('input').value || null;
    } else if (fornecedorCell.querySelector('select')) {
        fornecedor = fornecedorCell.querySelector('select').value || null;
    } else {
        fornecedor = null;
    }

    let tipo = null;
    let valor = null;

    if (cells[6].querySelector('input').value) {
        tipo = 'ENTRADA';
        valor = cells[6].querySelector('input').value || null;
    } else if (cells[7].querySelector('input').value) {
        tipo = 'SAIDA';
        valor = cells[7].querySelector('input').value || null;
    }

    const dadosEditados = {
        id: row.dataset.idextrato,
        data: cells[1].querySelector('input').value
            ? formatarData(cells[1].querySelector('input').value)
            : null,
        categoria: cells[2].querySelector('select').value || null,
        nome_no_extrato: cells[3].querySelector('input').value || null,
        descricao: cells[4].querySelector('input').value || null,
        fornecedor: fornecedor,
        tipo: tipo,
        valor: valor
    };

    fetch('consulta/editar/extrato', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosEditados),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro no servidor: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            if (data.affectedRows > 0) {
                alert('Edição confirmada com sucesso!');
                buscarDados();
            } else {
                alert('Nenhuma mudança foi detectada.');
            }
        })
        .catch(error => {
            console.error('Erro ao confirmar a edição:', error);
            alert('Erro ao confirmar a edição. Por favor, tente novamente.');
            cancelarEdicao(buttonElement);
        });
}

function cancelarEdicao(buttonElement) {
    const row = buttonElement.closest('tr');
    const originalData = JSON.parse(row.dataset.originalData);
    const cells = row.querySelectorAll('td');

    originalData.forEach((text, index) => {
        if (index < cells.length - 2) {
            cells[index].textContent = text;
        } else if (index === cells.length - 2) {
            cells[index].innerHTML = `<button onclick="abrirPopupAnexos(${row.dataset.idextrato})"><i class="fa fa-paperclip"></i></button>`;
        } else if (index === cells.length - 1) {
            cells[index].innerHTML = row.dataset.originalButtons;
        }
    });

    // Restaura os botões originais (incluindo o botão de lixeira)
    const ferramentasCell = cells[cells.length - 1];
    ferramentasCell.innerHTML = row.dataset.originalButtons;
}

function editarLinha(buttonElement) {
    const row = buttonElement.closest('tr');
    const idExtrato = row.dataset.idextrato;
    const cells = row.querySelectorAll('td');
    row.dataset.originalData = JSON.stringify(
        Array.from(cells).map(cell => cell.textContent.trim())
    );
    cells.forEach((cell, index) => {
        if (index === 2) {
            const categoriaAtual = cell.textContent.trim();
            const selectCategoria = document.createElement('select');
            selectCategoria.style.width = '100%';

            fetch(`/insercao/dados-categoria?idcliente=${IDCLIENTE}`)
                .then(response => response.json())
                .then(categorias => {
                    const optionDefault = document.createElement('option');
                    optionDefault.value = '';
                    optionDefault.textContent = 'Selecione uma Rubrica';
                    selectCategoria.appendChild(optionDefault);

                    const categoriasTree = construirArvoreDeCategorias(categorias);
                    adicionarCategoriasAoSelect(selectCategoria, categoriasTree);

                    const categoriaSelecionada = Array.from(selectCategoria.options).find(option => option.text === categoriaAtual);
                    if (categoriaSelecionada) {
                        categoriaSelecionada.selected = true;
                    }

                    cell.innerHTML = '';
                    cell.appendChild(selectCategoria);

                    selectCategoria.addEventListener('change', function() {
                        const categoriaSelecionada = this.options[this.selectedIndex].text.toLowerCase();
                        if (categoriaSelecionada === 'cartão de crédito' || categoriaSelecionada === 'cartao de credito' || categoriaSelecionada === 'cartao de crédito') {
                            abrirPopupConfirmacaoDetalhamento(() => {
                                abrirPopupInsercaoSubextrato(idExtrato); // Passa o ID_EXTRATO para o popup de inserção de subextrato
                            });
                        }
                    });
                })
                .catch(error => {
                    console.error('Erro ao buscar categorias:', error);
                });
        } else if (index === 5) {
            const fornecedorAtual = cell.textContent.trim();
            const selectFornecedor = document.createElement('select');
            selectFornecedor.style.width = '100%'; // Garante que o select ocupe 100% da célula

            selectFornecedor.classList.add('fornecedor-select');
            selectFornecedor.name = 'fornecedor';

            fetch(`/fornecedor/listar?idcliente=${IDCLIENTE}`)
                .then(response => response.json())
                .then(fornecedores => {
                    const optionDefault = document.createElement('option');
                    optionDefault.value = '';
                    optionDefault.textContent = 'Selecione um Fornecedor';
                    selectFornecedor.appendChild(optionDefault);

                    fornecedores.forEach(fornecedor => {
                        const option = document.createElement('option');
                        option.value = fornecedor.IDFORNECEDOR;
                        option.textContent = fornecedor.NOME_TIPO;
                        selectFornecedor.appendChild(option);
                    });

                    const fornecedorSelecionado = Array.from(selectFornecedor.options).find(option => option.text === fornecedorAtual);
                    if (fornecedorSelecionado) {
                        fornecedorSelecionado.selected = true;
                    }

                    cell.innerHTML = '';
                    cell.appendChild(selectFornecedor);
                })
                .catch(error => {
                    console.error('Erro ao buscar fornecedores:', error);
                });
        } else if (index > 0 && index < 8) { // Torna as outras células editáveis
            const cellText = cell.textContent.trim();
            cell.innerHTML = `<input type="text" value="${cellText}" class="editavel">`;

            const input = cell.querySelector('input');
            input.style.width = '100%'; // Garante que o input ocupe 100% da célula

            if (index === 6 || index === 7) { // Colunas de entrada (6) e saída (7)
                input.addEventListener('input', function () {
                    this.value = formatarValorFinanceiroInput(this.value);
                });
            }
        }
    });

    const ferramentasCell = cells[cells.length - 1];
    row.dataset.originalButtons = ferramentasCell.innerHTML; // Armazena os botões originais (inclusive a lixeira)
    ferramentasCell.innerHTML = `
        <button onclick="confirmarEdicao(this)" class="confirmar-btn">✔️</button>
        <button onclick="cancelarEdicao(this)" class="cancelar-btn">❌</button>
    `;
}

document.addEventListener('DOMContentLoaded', function() {
    const saldoInicialInput = document.getElementById('saldoInicialInput');

    saldoInicialInput.addEventListener('input', function() {
        this.value = formatarValorFinanceiroInput(this.value);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const saldoInicialInput = document.getElementById('novoSaldoInicial');

    saldoInicialInput.addEventListener('input', function() {
        this.value = formatarValorFinanceiroInput(this.value);
    });
});

function downloadTemplate() {
    const link = document.createElement('a');
    link.href = '/paginaInsercao/template.xlsx'; // Substitua pelo caminho real do arquivo template
    link.download = 'template.xlsx';
    link.click();
}

//-----------------------------------extratos automaticos---------------------//
//funcao principal
async function processarExtrato(nomeBanco = '') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf, .xlsx, .xls';
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            alert('Por favor, selecione um arquivo.');
            return;
        }

        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.split('.').pop();

        if (fileExtension === 'pdf') {
            const typedArray = new Uint8Array(await file.arrayBuffer());
            const pdf = await pdfjsLib.getDocument(typedArray).promise;

            const data = [];
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                textContent.items.forEach((item) => {
                    data.push(item.str);
                });
            }

            // Processamento de PDFs baseado no nomeBanco
            if (nomeBanco.includes('banco do brasil')) {
                // Banco do Brasil
                const linhasExtrato = data.some(item => item.includes("BB Cash - Conta corrente - Consulta autorizaveis - Extrato de conta corrente" || "Consultas - Extrato de conta corrente"))
                    ? processarDadosDoExtratoBancoDoBrasil2(data)
                    : processarDadosDoExtratoBancoDoBrasil(data);
                mostrarExtratoPopup(linhasExtrato);

            } else if (nomeBanco.includes('itau')) {
                // Itaú
                const linhasExtrato = data.some(item => item.includes("Total contratado. O uso do Limite da Conta e Limite da Conta adicional poderá ter cobrança de juros + IOF."))
                    ? processarDadosDoExtratoItauPersonalite(data)
                    : processarDadosDoExtratoItau(data);
                mostrarExtratoPopup(linhasExtrato);

            } else if (nomeBanco.includes('bradesco')) {
                // Bradesco
                const linhasExtrato = data.some(item => item.includes("Bradesco Internet Banking"))
                    ? processarDadosDoExtratoBradesco1(data)
                    : processarDadosDoExtratoBradesco2(data);
                mostrarExtratoPopup(linhasExtrato);

            } else if (nomeBanco.includes('mercado pago')) {
                // Mercado Pago
                const linhasExtrato = data.some(item => item.includes("DETALHE DOS MOVIMENTOS"))
                    ? processarDadosDoExtratoMercadoPago1(data)
                    : processarDadosDoExtratoMercadoPago2(data);
                mostrarExtratoPopup(linhasExtrato);

            } else if (nomeBanco.includes('stone')) {
                // Stone
                const linhasExtrato = processarDadosDoExtratoStone(data);
                mostrarExtratoPopup(linhasExtrato);

            } else if (nomeBanco.includes('sicoob')) {
                // Sicoob
                const linhasExtrato = processarDadosDoExtratoSicoob(data);
                mostrarExtratoPopup(linhasExtrato);

            } else if (nomeBanco.includes('santander')) {
                // Santander
                const linhasExtrato = processarDadosDoExtratoBancoDoSantander(data);
                mostrarExtratoPopup(linhasExtrato);

            } else {
                console.error('Banco não identificado no PDF ou o banco selecionado não corresponde ao conteúdo.');
            }

        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const data = new Uint8Array(await file.arrayBuffer());
            const workbook = XLSX.read(data, { type: 'array' });

            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            if (nomeBanco.includes('caixa')) {
                // Processamento do Excel para Caixa
                const linhasExtrato = processarDadosDoExcelCaixa(jsonData);
                mostrarExtratoPopup(linhasExtrato);

            } else if (nomeBanco === 'extratoTemplate') {
                // Processamento do Excel para o template
                const linhasExtrato = processarDadosDoExcelTemplate(jsonData);
                mostrarExtratoPopup(linhasExtrato);

            } else {
                console.error('Banco não identificado no Excel ou o banco selecionado não corresponde ao conteúdo.');
            }
        } else {
            alert('Formato de arquivo não suportado.');
        }
    };
    input.click();
}

//funcoes auxiliares

//santander
function processarDadosDoExtratoBancoDoSantander(data) {
    const extrato = [];
    const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
    const valueRegex = /-?\d+,\d{2}/;
    const saldoRegex = /saldo\s*\(R\$\)/i;
    const saldoAnteriorRegex = /Saldo anterior/i;

    let linhaAtual = null;
    let dentroDoIntervaloSaldo = false;

    for (let i = 0; i < data.length; i++) {
        const text = data[i].trim();


        if (text.match(saldoAnteriorRegex)) {
            break;
        }

        if (text.match(saldoRegex)) {
            dentroDoIntervaloSaldo = true;
            continue;
        }

        if (dentroDoIntervaloSaldo) {
            if (text.match(dateRegex)) {
                if (linhaAtual && linhaAtual.valor !== null) {
                    extrato.push(linhaAtual);
                }
                linhaAtual = { data: text, descricao: '', valor: null, tipo: null };
            }
            else if (linhaAtual && text.match(valueRegex)) {
                const valorStr = text.replace(/\./g, '').replace(',', '.');
                const valor = parseFloat(valorStr);

                if (linhaAtual.valor === null) {
                    linhaAtual.valor = formatarValorFinanceiro(Math.abs(valor));
                    linhaAtual.tipo = valor < 0 ? 'saida' : 'entrada';
                }
                else {
                    extrato.push(linhaAtual);
                    linhaAtual = null;
                }
            }
            else if (linhaAtual && /^\d+$/.test(text)) {
                continue;
            }
            else if (linhaAtual) {
                linhaAtual.descricao += ` ${text}`.trim();
            }
        }
    }

    if (linhaAtual && linhaAtual.valor !== null) {
        extrato.push(linhaAtual);
    }

    return extrato.filter(linha => linha.data && linha.descricao && linha.valor !== null);
}

//sicoob
function processarDadosDoExtratoSicoob(data) {
    const extrato = [];
    const dateRegex = /\d{2}\/\d{2}/;
    const valueRegex = /\d{1,3}(\.\d{3})*,\d{2}[DC]/;
    const saldoDoDiaRegex = /SALDO DO DIA/i;
    const saldoBloqAnteriorRegex = /SALDO BLOQ.ANTERIOR/i;

    let linhaAtual = null;
    let dentroDoExtrato = false;
    let anoAtual = null; // Variável para armazenar o ano

    for (let i = 0; i < data.length; i++) {
        const text = data[i].trim();

        // Captura o ano a partir do período
        if (text === "PERÍODO:") {
            const periodo = data[i + 1].match(/\d{2}\/\d{2}\/(\d{4})/);
            if (periodo) {
                anoAtual = periodo[1]; // Armazena o ano extraído
            }
            continue;
        }

        // Ignorar tudo até encontrar "SALDO DO DIA" pela primeira vez
        if (text.match(saldoDoDiaRegex)) {
            dentroDoExtrato = true;
            continue;
        }

        // Se encontrar "SALDO BLOQ.ANTERIOR", parar o processamento
        if (text.match(saldoBloqAnteriorRegex)) {
            break;
        }

        if (dentroDoExtrato && anoAtual) { // Certifica-se de que o ano foi capturado
            // Captura a data e inicia uma nova linha do extrato
            if (text.match(dateRegex)) {
                if (linhaAtual && linhaAtual.valor !== null) {
                    extrato.push(linhaAtual);
                }
                linhaAtual = { data: `${text}/${anoAtual}`, descricao: '', valor: null, tipo: null };
            }
            // Captura o valor e define o tipo (entrada ou saída)
            else if (linhaAtual && text.match(valueRegex)) {
                const valorStr = text.replace(/[^\d,-]/g, '').replace(',', '.');
                const valor = parseFloat(valorStr);
                const tipo = text.endsWith('D') ? 'saida' : 'entrada';
                linhaAtual.valor = formatarValorFinanceiro(valor);
                linhaAtual.tipo = tipo;
            }
            // Captura a descrição da transação, ignorando espaços vazios, a 3ª parte e a última parte (doc)
            else if (linhaAtual && !text.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/) && text !== '') {
                if (linhaAtual.descricao) {
                    linhaAtual.descricao += ` - ${text}`;
                } else {
                    linhaAtual.descricao = text;
                }
            }
        }
    }

    // Adiciona a última linha do extrato se ela existir
    if (linhaAtual && linhaAtual.valor !== null) {
        extrato.push(linhaAtual);
    }

    console.log(extrato);

    return extrato.filter(linha => linha.data && linha.descricao && linha.valor !== null);
}

//stone
function processarDadosDoExtratoStone(data) {
    const extrato = [];
    const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
    const valueRegex = /-?\d{1,3}(\.\d{3})*,\d{2}/;
    const startRegex = /contraparte/i;

    let linhaAtual = null;
    let dentroDoIntervalo = false;
    let valorCapturado = false;

    for (let i = 0; i < data.length; i++) {
        const text = data[i].trim();

        // Iniciar a captura após encontrar "CONTRAPARTE"
        if (text.match(startRegex)) {
            dentroDoIntervalo = true;
            continue;
        }

        if (dentroDoIntervalo) {
            // Captura a data para iniciar uma nova linha de extrato
            if (text.match(dateRegex)) {
                if (linhaAtual && linhaAtual.valor !== null) {
                    extrato.push(linhaAtual);
                }
                linhaAtual = { data: text, descricao: '', valor: null, tipo: null };
                valorCapturado = false;
            }
            // Captura o valor da transação antes do saldo
            else if (text.match(valueRegex) && linhaAtual && !valorCapturado) {
                const valorStr = text.replace(/\./g, '').replace(',', '.');
                const valor = parseFloat(valorStr);
                linhaAtual.valor = formatarValorFinanceiro(Math.abs(valor));
                linhaAtual.tipo = valor < 0 ? 'saida' : 'entrada';
                valorCapturado = true;
            }
            // Ignora o saldo e campos específicos como "Parcela", "Transferência", etc.
            else if (valorCapturado && text.match(valueRegex)) {
                // Ignorar o valor de saldo e quaisquer outros valores depois
                continue;
            }
            else if (linhaAtual && !text.match(/(Parcela|Transferência|Pix|Empréstimo)/i) && !text.match(dateRegex)) {
                linhaAtual.descricao += ` ${text}`.trim();
            }
        }
    }

    // Adiciona a última linha se estiver completa
    if (linhaAtual && linhaAtual.valor !== null) {
        extrato.push(linhaAtual);
    }

    console.log(extrato);

    return extrato.filter(linha => linha.data && linha.descricao && linha.valor !== null);
}

//mercadopago
function processarDadosDoExtratoMercadoPago1(data) {
    const extrato = [];
    const dateRegex = /\d{2}-\d{2}-\d{4}/;
    const valueRegex = /^R\$\s*-?\d{1,3}(\.\d{3})*,\d{2}$/;
    const saldoRegex = /saldo/i;

    let linhaAtual = null;
    let capturarValor = false;

    function formatarData(data) {
        return data.replace(/-/g, '/');
    }

    for (let i = 0; i < data.length; i++) {
        const text = data[i].trim();

        // Ignorar fragmentos como "1/4" ou espaços em branco isolados
        if (text.match(/^\d{1,2}$/) || text === "/" || text === "") {
            continue;
        }

        // Ignorar linhas até encontrar a palavra "Saldo"
        if (text.match(saldoRegex)) {
            capturarValor = false;
            continue;
        }

        // Iniciar a captura de uma nova transação ao encontrar uma data
        if (text.match(dateRegex)) {
            if (linhaAtual && linhaAtual.valor !== null) {
                extrato.push(linhaAtual);
            }
            linhaAtual = { data: formatarData(text), descricao: '', valor: null, tipo: null };
            capturarValor = true;
        } else if (text.match(valueRegex) && capturarValor) {
            // Capturar o valor da transação e determinar o tipo (entrada/saida)
            const valorStr = text.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.');
            const valor = parseFloat(valorStr);
            linhaAtual.valor = formatarValorFinanceiro(Math.abs(valor));
            linhaAtual.tipo = valor < 0 ? 'saida' : 'entrada';
            capturarValor = false;
        } else if (linhaAtual && text.match(/^R\$/)) {
            continue;
        } else if (linhaAtual && text.match(/^\d+$/)) {
            continue;
        } else if (linhaAtual) {
            linhaAtual.descricao += ` ${text}`.trim();
        }
    }

    if (linhaAtual && linhaAtual.valor !== null) {
        extrato.push(linhaAtual);
    }

    console.log(extrato);

    return extrato.filter(linha => linha.data && linha.descricao && linha.valor !== null);
}
function processarDadosDoExtratoMercadoPago2(data) {
        const extrato = [];
        const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
        const valueRegex = /-?\d+,\d{2}/;
        const saldoRegex = /saldo/i;

        let linhaAtual = null;
        let dentroDoIntervaloSaldo = false;
        let encontrouPrimeiroSaldo = false;

        for (let i = 0; i < data.length; i++) {
            const text = data[i];

            if (text.match(saldoRegex)) {
                if (encontrouPrimeiroSaldo) {
                    dentroDoIntervaloSaldo = false;
                    break;
                } else {
                    dentroDoIntervaloSaldo = true;
                    encontrouPrimeiroSaldo = true;
                }
            }

            if (dentroDoIntervaloSaldo) {
                if (text.match(valueRegex)) {
                    if (linhaAtual) {
                        extrato.push(linhaAtual);
                    }
                    const valor = parseFloat(text.replace(/\./g, '').replace(',', '.'));
                    const tipo = text.includes('(-)') ? 'saida' : 'entrada';
                    linhaAtual = { valor: formatarValorFinanceiro(Math.abs(valor)), tipo, data: '', descricao: '' };
                } else if (text.match(dateRegex) && linhaAtual) {
                    linhaAtual.data = text;
                } else if (linhaAtual) {
                    linhaAtual.descricao += ` ${text}`.trim();
                }
            }
        }

        if (linhaAtual && dentroDoIntervaloSaldo) {
            extrato.push(linhaAtual);
        }

        return extrato.filter(linha => linha.data && linha.descricao && linha.valor !== null);
    }


//bradesco
function processarDadosDoExtratoBradesco1(data) {
    const extrato = [];
    const saldoAnteriorRegex = /saldo anterior/i;
    const dateRegex = /^\d{2}\/\d{2}\/\d{2}$/;
    const valueRegex = /^-?\d+,\d{2}$/;

    let descricoes = [];
    let coletandoDescricoes = true;
    let transacoes = [];
    let descricaoIndex = 0;
    let ignorarPrimeiraData = true;  // Flag para ignorar a primeira data

    // Coleta as descrições primeiro (antes de "SALDO ANTERIOR")
    for (let i = 0; i < data.length; i++) {
        const text = data[i].trim();

        if (text.match(saldoAnteriorRegex)) {
            coletandoDescricoes = false;
            continue;
        }

        if (coletandoDescricoes) {
            descricoes.unshift(text); // Coletar as descrições em ordem reversa para corrigi-la
        } else {
            // A partir daqui, começa o processamento das transações após "SALDO ANTERIOR"
            if (text.match(dateRegex)) {
                // Ignora a primeira data que corresponde ao "SALDO ANTERIOR"
                if (ignorarPrimeiraData) {
                    ignorarPrimeiraData = false; // Desativa a flag após ignorar a primeira data
                    continue;
                }

                // Nova transação detectada
                transacoes.push({
                    data: text,
                    descricao: descricoes[descricaoIndex++] || '',
                    valores: []
                });
            } else if (text.match(valueRegex)) {
                // Captura os valores relevantes
                if (transacoes.length > 0) {
                    transacoes[transacoes.length - 1].valores.push(parseFloat(text.replace(/\./g, '').replace(',', '.')));
                }
            }
        }
    }

    // Agora, montamos o extrato final, garantindo que apenas as transações com descrições válidas sejam incluídas
    transacoes.forEach(transacao => {
        const valores = transacao.valores;

        valores.forEach(valor => {
            extrato.push({
                data: transacao.data,
                descricao: transacao.descricao,
                valor: formatarValorFinanceiro(valor),
                tipo: valor < 0 ? 'saida' : 'entrada'
            });
        });
    });

    console.log(extrato);

    return extrato.slice(0, descricoes.length);
}
function processarDadosDoExtratoBradesco2(data) {
    const extrato = [];
    console.log(extrato)
    const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
    const valueRegex = /-?\d+,\d{2}/;
    const saldoRegex = /saldo/i;

    let linhaAtual = null;
    let dentroDoIntervaloSaldo = false;
    let encontrouPrimeiroSaldo = false;

    for (let i = 0; i < data.length; i++) {
        const text = data[i];

        if (text.match(saldoRegex)) {
            if (encontrouPrimeiroSaldo) {
                dentroDoIntervaloSaldo = false;
                break;
            } else {
                dentroDoIntervaloSaldo = true;
                encontrouPrimeiroSaldo = true;
            }
        }

        if (dentroDoIntervaloSaldo) {
            if (text.match(valueRegex)) {
                if (linhaAtual) {
                    extrato.push(linhaAtual);
                }
                const valor = parseFloat(text.replace(/\./g, '').replace(',', '.'));
                const tipo = text.includes('(-)') ? 'saida' : 'entrada';
                linhaAtual = { valor: formatarValorFinanceiro(Math.abs(valor)), tipo, data: '', descricao: '' };
            } else if (text.match(dateRegex) && linhaAtual) {
                linhaAtual.data = text;
            } else if (linhaAtual) {
                linhaAtual.descricao += ` ${text}`.trim();
            }
        }
    }

    if (linhaAtual && dentroDoIntervaloSaldo) {
        extrato.push(linhaAtual);
    }

    return extrato.filter(linha => linha.data && linha.descricao && linha.valor !== null);
}

//banco do brasil
function processarDadosDoExtratoBancoDoBrasil(data) {
    const extrato = [];
    const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
    const valueRegex = /-?\d+,\d{2}/;
    const saldoRegex = /saldo/i;

    let linhaAtual = null;
    let dentroDoIntervaloSaldo = false;
    let encontrouPrimeiroSaldo = false;

    for (let i = 0; i < data.length; i++) {
        const text = data[i];

        if (text.match(saldoRegex)) {
            if (encontrouPrimeiroSaldo) {
                dentroDoIntervaloSaldo = false;
                break;
            } else {
                dentroDoIntervaloSaldo = true;
                encontrouPrimeiroSaldo = true;
            }
        }

        if (dentroDoIntervaloSaldo) {
            if (text.match(valueRegex)) {
                if (linhaAtual) {
                    extrato.push(linhaAtual);
                }
                const valor = parseFloat(text.replace(/\./g, '').replace(',', '.'));
                const tipo = text.includes('(-)') ? 'saida' : 'entrada';
                linhaAtual = { valor: formatarValorFinanceiro(Math.abs(valor)), tipo, data: '', descricao: '' };
            } else if (text.match(dateRegex) && linhaAtual) {
                linhaAtual.data = text;
            } else if (linhaAtual) {
                linhaAtual.descricao += ` ${text}`.trim();
            }
        }
    }

    if (linhaAtual && dentroDoIntervaloSaldo) {
        extrato.push(linhaAtual);
    }

    return extrato.filter(linha => linha.data && linha.descricao && linha.valor !== null);
}
function processarDadosDoExtratoBancoDoBrasil2(data) {
    const extrato = [];
    const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
    const valueRegex = /-?\d{1,3}(\.\d{3})*,\d{2} [CD]/;
    const saldoRegex = /saldo anterior/i;
    const finalizacaoExtratoRegex = /S A L D O/i;

    let dentroDoIntervaloSaldo = false;
    let linhaAtual = null
    console.log(extrato)
    for (let i = 0; i < data.length; i++) {
        const text = data[i].trim();

        if (text.match(finalizacaoExtratoRegex)) {
            break;
        }

        if (text.match(saldoRegex)) {
            dentroDoIntervaloSaldo = true;
            continue;
        }

        if (dentroDoIntervaloSaldo && text.match(finalizacaoExtratoRegex)) {
            break;
        }

        if (dentroDoIntervaloSaldo) {
            if (text.match(dateRegex)) {
                if (linhaAtual && linhaAtual.data && linhaAtual.descricao && linhaAtual.valor) {
                    extrato.push(linhaAtual);
                }
                linhaAtual = {
                    data: text,
                    descricao: '',
                    valor: null,
                    tipo: null
                };
            } else if (text.match(valueRegex) && linhaAtual) {
                const valorStr = text.slice(0, -2).replace(/\./g, '').replace(',', '.');
                const tipo = text.endsWith('C') ? 'entrada' : 'saida';
                linhaAtual.valor = formatarValorFinanceiro(parseFloat(valorStr));
                linhaAtual.tipo = tipo;
            } else if (linhaAtual && !text.match(/^\d+$/)) {
                linhaAtual.descricao += ` ${text}`.trim();
            }
        }
    }

    if (linhaAtual && linhaAtual.data && linhaAtual.descricao && linhaAtual.valor) {
        extrato.push(linhaAtual);
    }

    console.log(extrato);

    return extrato.filter(linha => linha.data && linha.descricao && linha.valor !== null);
}

//itau
function processarDadosDoExtratoItau(data) {
    const extrato = [];
    const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
    const valueRegex = /(-?)\s?R\$\s?(\d{1,3}(\.\d{3})*,\d{2})/;
    const descricaoRegex = /^[A-Za-z]/;
    const symbolToIgnore = "";

    let linhaAtual = null;
    let dataAtual = null;
    let ultimaDescricao = null;

    for (let i = 0; i < data.length; i++) {
        const text = data[i].trim();

        if (text === "" || text === symbolToIgnore) {
            continue;
        }

        if (text.match(dateRegex)) {
            dataAtual = text;
        } else if (text.match(valueRegex)) {
            const match = text.match(valueRegex);
            const valor = parseFloat(match[1] + match[2].replace(/\./g, '').replace(',', '.')); // Inclui o sinal de negativo no valor
            const tipo = valor < 0 ? 'saida' : 'entrada';

            if (ultimaDescricao && dataAtual && !ultimaDescricao.toLowerCase().includes('saldo')) {
                linhaAtual = { data: dataAtual, descricao: ultimaDescricao, valor: formatarValorFinanceiro(Math.abs(valor)), tipo };
                extrato.push(linhaAtual);
                linhaAtual = null;
                ultimaDescricao = null;
            } else if (!ultimaDescricao.toLowerCase().includes('saldo')) {
                console.error('Erro: Valor encontrado sem descrição ou data anterior válida:', text);
            }
        } else if (text.match(descricaoRegex)) {
            ultimaDescricao = text;
        } else if (ultimaDescricao) {
            ultimaDescricao += ` ${text}`;
        }
    }

    console.log(JSON.stringify(extrato, null, 2));
    return extrato;
}
function processarDadosDoExtratoItauPersonalite(data) {
    const extrato = [];
    const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
    const valueRegex = /-?\d+,\d{2}/;
    const saldoRegex = /saldo\s*\(R\$\)/i;
    const saldoTotalDiaRegex = /SALDO TOTAL DISPONÍVEL DIA/i;
    const saldoAnteriorRegex = /SALDO ANTERIOR/i;

    let linhaAtual = null;
    let dentroDoIntervaloSaldo = false;
    let encontrouSaldoTotalDia = false;

    for (let i = 0; i < data.length; i++) {
        const text = data[i].trim();

        // Ignorar fragmentos e elementos indesejados
        if (
            text.match(/^\d{1,2}$/) ||
            text === "/" ||
            text === "" ||
            text.includes('extrato-lancamentos') ||
            text.includes('about:blank') ||
            text.match(/^\d{2}\/\d{2}\/\d{2}, \d{2}:\d{2}$/)
        ) {
            continue;
        }

        // Iniciar a captura ao encontrar "saldo (R$)"
        if (text.match(saldoRegex)) {
            dentroDoIntervaloSaldo = true;
            continue;
        }

        if (dentroDoIntervaloSaldo) {
            // Se encontrar "SALDO TOTAL DISPONÍVEL DIA", marcar que encontrou mas continuar processando
            if (text.match(saldoTotalDiaRegex)) {
                encontrouSaldoTotalDia = true;
                continue;
            }

            // Ignorar linhas com "SALDO ANTERIOR"
            if (text.match(saldoAnteriorRegex)) {
                linhaAtual = null;
                continue;
            }

            // Captura a data e inicia uma nova linha de extrato
            if (text.match(dateRegex)) {
                if (linhaAtual && linhaAtual.valor !== null) {
                    extrato.push(linhaAtual);
                }
                linhaAtual = { data: text, descricao: '', valor: null, tipo: null };
            }
            // Captura o valor e define o tipo (entrada ou saída)
            else if (linhaAtual && text.match(valueRegex)) {
                const valorStr = text.replace(/\./g, '').replace(',', '.');
                const valor = parseFloat(valorStr);
                linhaAtual.valor = formatarValorFinanceiro(Math.abs(valor));
                linhaAtual.tipo = valor < 0 ? 'saida' : 'entrada';
            }
            // Captura a descrição da transação
            else if (linhaAtual) {
                linhaAtual.descricao += ` ${text}`.trim();
            }
        }
    }

    if (linhaAtual && linhaAtual.valor !== null) {
        extrato.push(linhaAtual);
    }

    return extrato.filter(linha => linha.data && linha.descricao && linha.valor !== null);
}

//caixa
function excelDateToJSDate(excelDate) {
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
function processarDadosDoExcelCaixa(data) {
    const extrato = [];
    const valorRegex = /(\d{1,3}(\.\d{3})*,\d{2})\s([CD])/;

    data.forEach((row, index) => {
        if (index === 0) return;

        const [dataMov, , historico, valor] = row;

        if (!dataMov || !historico || !valor) return;

        const dataFormatada = typeof dataMov === 'number' ? excelDateToJSDate(dataMov) : dataMov;
        const match = valor.match(valorRegex);
        if (!match) return;

        const valorNumerico = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
        const tipo = match[3] === 'C' ? 'entrada' : 'saida';

        extrato.push({
            data: dataFormatada,
            descricao: historico,
            valor: formatarValorFinanceiro(Math.abs(valorNumerico)),
            tipo: tipo
        });
    });

    return extrato;
}

//extratoTemplate

function processarDadosDoExcelTemplate(jsonData) {
    const linhasExtrato = jsonData.slice(1).map(row => {
        const isEmptyRow = row.every(cell => cell === undefined || cell === null || cell === '');

        if (isEmptyRow) {
            return null;
        }
        const dataFormatada = row[0] ? excelDateToJSDate(row[0]) : '';
        const valorEntrada = row[5] !== undefined && row[5] !== null && row[5] !== '' ? formatarValorFinanceiro(row[5]) : '';
        const valorSaida = row[6] !== undefined && row[6] !== null && row[6] !== '' ? formatarValorFinanceiro(row[6]) : '';

        return {
            data: dataFormatada,
            rubrica: row[1] || '',
            descricao: row[2] || '',
            nome: row[3] || '',
            fornecedor: row[4] || '',
            tipo: valorEntrada ? 'entrada' : (valorSaida ? 'saida' : ''),
            valor: valorEntrada || valorSaida || ''
        };
    }).filter(row => row !== null);

    return linhasExtrato;
}

///------------------------------------------------------------------//

function mostrarExtratoPopup(extrato) {
    const extratoTableBody = document.getElementById('extratoTable').querySelector('tbody');
    document.querySelector('.body-insercao').classList.add('blur-background');

    extratoTableBody.innerHTML = '';

    extrato.forEach((linha, index) => {
        const row = document.createElement('tr');
        row.dataset.index = index;

        // Data
        const dataCell = document.createElement('td');
        const dataInput = document.createElement('input');
        dataInput.type = 'text';
        dataInput.value = linha.data;
        dataCell.appendChild(dataInput);
        row.appendChild(dataCell);

        // Rubrica
        const rubricaCell = document.createElement('td');
        const rubricaSelect = document.createElement('select');
        preencherSelectComOpcoes(rubricaSelect, document.getElementById('seletorCategoria')); // Preenche com as opções de categoria
        rubricaSelect.value = linha.rubrica || ''; // Define o valor atual
        rubricaCell.appendChild(rubricaSelect);
        row.appendChild(rubricaCell);

        // Nome no Extrato
        const nomeCell = document.createElement('td');
        const nomeInput = document.createElement('input');
        nomeInput.type = 'text';
        nomeInput.value = linha.descricao;
        nomeCell.appendChild(nomeInput);
        row.appendChild(nomeCell);

        // Observação
        const obsCell = document.createElement('td');
        const obsInput = document.createElement('input');
        obsInput.type = 'text';
        obsInput.value = linha.observacao || ''; // Campo de observação, se houver
        obsCell.appendChild(obsInput);
        row.appendChild(obsCell);

        // Fornecedor
        const fornecedorCell = document.createElement('td');
        const fornecedorSelect = document.createElement('select');
        preencherSelectComOpcoes(fornecedorSelect, document.getElementById('seletorFornecedor')); // Preenche com as opções de fornecedor
        fornecedorSelect.value = linha.fornecedor || ''; // Define o valor atual
        fornecedorCell.appendChild(fornecedorSelect);
        row.appendChild(fornecedorCell);

        // Saída
        const saidaCell = document.createElement('td');
        const saidaInput = document.createElement('input');
        saidaInput.type = 'text';
        saidaInput.value = linha.tipo === 'saida' ? linha.valor : '';
        saidaCell.appendChild(saidaInput);
        row.appendChild(saidaCell);

        // Entrada
        const entradaCell = document.createElement('td');
        const entradaInput = document.createElement('input');
        entradaInput.type = 'text';
        entradaInput.value = linha.tipo === 'entrada' ? linha.valor : '';
        entradaCell.appendChild(entradaInput);
        row.appendChild(entradaCell);

        // Botão de Remover (Lixeira)
        const removerCell = document.createElement('td');
        const removerButton = document.createElement('button');
        removerButton.innerHTML = '🗑️'; // Ícone de lixeira
        removerButton.classList.add('remover-linha');
        removerButton.addEventListener('click', () => {
            // Remover a linha da tabela visualmente
            row.remove();
            // Remover a linha do array de extrato
            extrato.splice(index, 1);
        });
        removerCell.appendChild(removerButton);
        row.appendChild(removerCell);

        extratoTableBody.appendChild(row);
    });

    document.getElementById('extratoPopup').style.display = 'block';
}

function preencherSelectComOpcoes(selectElement, modelSelectElement) {
    Array.from(modelSelectElement.options).forEach(option => {
        const newOption = document.createElement('option');
        newOption.value = option.value;
        newOption.textContent = option.textContent;
        newOption.disabled = option.disabled; // Mantém a propriedade disabled
        selectElement.appendChild(newOption);
    });
}

function fecharExtratoPopup() {
    document.getElementById('extratoPopup').style.display = 'none';
    document.querySelector('.body-insercao').classList.remove('blur-background');

}

function salvarAlteracoes() {
    document.getElementById('loadingSpinner').style.display = 'block';
    document.querySelector('.body-insercao').classList.add('blur-background');
    document.querySelector('.popup-insercao-container').classList.add('blur-background');


    const tabelaExtrato = document.getElementById('extratoTable').querySelector('tbody');
    const linhas = tabelaExtrato.querySelectorAll('tr');
    const entradas = [];

    linhas.forEach(linha => {
        const data = linha.querySelector('td:nth-child(1) input').value;
        const categoria = linha.querySelector('td:nth-child(2) select').value || '';  // Se não selecionado, fica vazio
        const nome = linha.querySelector('td:nth-child(3) input').value || '';
        const descricao = linha.querySelector('td:nth-child(4) input').value || '';
        const fornecedor = linha.querySelector('td:nth-child(5) select').value || '';  // Se não selecionado, fica vazio
        const saida = linha.querySelector('td:nth-child(6) input').value || '0,00';
        const entrada = linha.querySelector('td:nth-child(7) input').value || '0,00';

        // Determina o tipo de transação
        let tipo = '';
        let valor = '';

        if (entrada !== '0,00') {
            tipo = 'ENTRADA';
            valor = formatarValorParaInsercao(entrada);
        } else if (saida !== '0,00') {
            tipo = 'SAIDA';
            valor = formatarValorParaInsercao(saida);
        }

        entradas.push({
            Data: data,
            Categoria: categoria,
            Descricao: descricao,
            Nome: nome,
            TIPO: tipo,
            VALOR: valor,
            IDBANCO: IDBANCO,
            IDCLIENTE: IDCLIENTE,
            Fornecedor: fornecedor
        });
    });

    const json_object = JSON.stringify(entradas);
    console.log(json_object)
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
            alert('Dados inseridos com sucesso!');
            location.reload();
            fecharExtratoPopup();
        })
        .catch(error => {
            console.error('Falha ao enviar dados:', error);
            alert('Erro ao inserir os dados.');
        });
}

document.getElementById('processarExtratoBtn').addEventListener('click', processarExtrato);

function mostrarOpcoesInsercao() {
    var metodo = document.getElementById('metodoInsercao').value;
    var opcoesAutomatizado = document.getElementById('opcoesAutomatizado');
    var uploadArquivosDiv = document.querySelector('.uploadArquivos');
    var uploadForm = document.getElementById('uploadForm');
    var opcoesManual = document.getElementById('opcoesManual');

    if (metodo === 'automatizado') {
        opcoesAutomatizado.style.display = 'block';
        opcoesManual.style.display = 'none';  // Esconder o formulário manual
    } else if (metodo === 'manual') {
        opcoesManual.style.display = 'block';  // Mostrar o formulário manual
        opcoesAutomatizado.style.display = 'none';  // Esconder as opções automatizadas
        uploadArquivosDiv.style.display = 'none';  // Esconder o upload de arquivos
        uploadForm.style.display = 'none';  // Esconder o formulário de upload
    } else {
        opcoesManual.style.display = 'none';
        opcoesAutomatizado.style.display = 'none';
        uploadArquivosDiv.style.display = 'none';
        uploadForm.style.display = 'none';
    }
}

function executarMetodoAutomatizado() {
    var metodoAutomatizado = document.getElementById('metodoAutomatizado').value;

    if (metodoAutomatizado === 'insercaoExcel') {
        processarExtrato("extratoTemplate");
    } else if (metodoAutomatizado === 'leituraAutomatica') {
        processarExtrato();
    }
}

document.getElementById('excelFile').addEventListener('change', function() {
    if (this.files && this.files[0]) {
        console.log(this.files)
        lerExcel();
    }
});

function abrirPopupInsercaoSubextrato(idExtratoPrincipal) {
    const popupContainer = document.createElement('div');
    popupContainer.id = 'popupInsercaoSubextrato';
    popupContainer.className = 'popup-container';

    popupContainer.innerHTML = `
        <div class="popup-content-subextrato">
            <span class="close-btn" onclick="fecharPopupInsercaoSubextrato()">&times;</span>
            <h3>Inserir Subextrato</h3>
            <div id="opcoesSubextratoManual">
                <form id="formularioSubextrato">
                    <div class="tabela">
                        <table>
                            <thead>
                            <tr>
                                <th>Data</th>
                                <th>Rubrica</th>
                                <th>Fornecedor</th>
                                <th>Observação</th>
                                <th>Descrição</th>
                                <th>Entrada</th>
                                <th>Saída</th>
                            </tr>
                            </thead>
                            <tbody id="subextrato-body">
                            <tr>
                                <td><input type="date" name="Data" id="subextratoDatepicker"></td>
                                <td>
                                    <label>
                                        <select name="categoria" id="seletorSubextratoCategoria"></select>
                                    </label>
                                </td>
                                <td>
                                    <label>
                                        <select name="fornecedor" id="seletorSubextratoFornecedor"></select>
                                    </label>
                                </td>
                                <td class="textosBox" style="padding: 0"><input type="text" name="observacao" class="valor"></td>
                                <td class="textosBox" style="padding: 0"><input type="text" name="descricao" class="valor"></td>
                                <td><input type="text" name="valorEn" id="valorEnSubextrato" class="valor"></td>
                                <td><input type="text" name="valorSa" id="valorSaSubextrato" class="valor"></td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                    <input type="hidden" name="id_extrato_principal" value="${idExtratoPrincipal}">
                    <div class="popup-subextrato-buttons">
                        <button type="button" id="adicionarSubextratoBtn">Adicionar Subextrato</button>
                        <button type="button" onclick="fecharPopupInsercaoSubextrato()">Fechar</button>
                    </div>
                </form>
                <div id="subextrato-adicionados"></div>
            </div>
        </div>
    `;

    document.body.appendChild(popupContainer);

    fetch(`/insercao/dados-categoria?idcliente=${IDCLIENTE}`)
        .then(response => response.json())
        .then(categorias => {
            const selectCategoria = document.getElementById('seletorSubextratoCategoria');
            const optionDefault = document.createElement('option');
            optionDefault.value = '';
            optionDefault.textContent = 'Selecione uma Rubrica';
            selectCategoria.appendChild(optionDefault);

            const categoriasTree = construirArvoreDeCategorias(categorias);
            adicionarCategoriasAoSelect(selectCategoria, categoriasTree);
        })
        .catch(error => {
            console.error('Erro ao buscar categorias:', error);
        });

    fetch(`/fornecedor/listar?idcliente=${IDCLIENTE}`)
        .then(response => response.json())
        .then(fornecedores => {
            const selectFornecedor = document.getElementById('seletorSubextratoFornecedor');
            const optionDefault = document.createElement('option');
            optionDefault.value = '';
            optionDefault.textContent = 'Selecione um Fornecedor';
            selectFornecedor.appendChild(optionDefault);

            fornecedores.forEach(fornecedor => {
                const option = document.createElement('option');
                option.value = fornecedor.IDFORNECEDOR;
                option.textContent = fornecedor.NOME_TIPO;
                selectFornecedor.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao buscar fornecedores:', error);
        });

    document.getElementById('valorEnSubextrato').addEventListener('input', function() {
        this.value = formatarValorFinanceiro(this.value);
    });

    document.getElementById('valorSaSubextrato').addEventListener('input', function() {
        this.value = formatarValorFinanceiro(this.value);
    });

    document.getElementById('adicionarSubextratoBtn').addEventListener('click', async function() {
        const formData = new FormData(document.getElementById('formularioSubextrato'));

        const Data = formData.get('Data');
        const categoria = formData.get('categoria');
        const fornecedor = formData.get('fornecedor');
        const observacao = formData.get('observacao');
        const descricao = formData.get('descricao');
        const valorEn = document.getElementById('valorEnSubextrato').value.replace(/\./g, '').replace(',', '.');
        const valorSa = document.getElementById('valorSaSubextrato').value.replace(/\./g, '').replace(',', '.');
        const id_extrato_principal = formData.get('id_extrato_principal');

        const dadosSubextrato = {
            Data,
            categoria,
            descricao,
            observacao,
            valorEn,
            valorSa,
            id_extrato_principal,
            fornecedor
        };

        try {
            const response = await fetch('/insercao/inserir-subextrato', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosSubextrato)
            });

            if (response.ok) {
                exibirSubextratoAdicionado(dadosSubextrato);
                limparCamposSubextrato();
            } else {
                throw new Error('Erro ao inserir subextrato');
            }
        } catch (error) {
            console.error(error);
            alert('Ocorreu um erro ao inserir os dados do subextrato. Por favor, tente novamente.');
        }
    });
}

function limparCamposSubextrato() {
    document.getElementById('formularioSubextrato').reset();
}

function exibirSubextratoAdicionado(subextrato) {
    const subextratoAdicionadosDiv = document.getElementById('subextrato-adicionados');
    const subextratoItem = document.createElement('div');
    subextratoItem.className = 'subextrato-item';
    subextratoItem.textContent = `Data: ${subextrato.Data}, Categoria: ${subextrato.categoria}, Valor: ${subextrato.valorEn || subextrato.valorSa}`;
    subextratoAdicionadosDiv.appendChild(subextratoItem);
}

function fecharPopupInsercaoSubextrato() {
    const popup = document.getElementById('popupInsercaoSubextrato');
    if (popup) {
        document.body.removeChild(popup);
    }
}

function abrirPopupConfirmacaoDetalhamento(callbackSim) {
    // Cria o container do pop-up
    const popupContainer = document.createElement('div');
    popupContainer.id = 'popupConfirmacaoDetalhamento';
    popupContainer.className = 'popup-confirmacao-container';

    // Conteúdo do pop-up
    popupContainer.innerHTML = `
        <div class="popup-confirmacao-content">
            <h3>Deseja detalhar as transações de "Cartão de Crédito"?</h3>
            <div class="popup-confirmacao-buttons">
                <button id="confirmarSim">Sim</button>
                <button id="confirmarNao">Não</button>
            </div>
        </div>
    `;

    document.body.appendChild(popupContainer);

    document.getElementById('confirmarSim').addEventListener('click', () => {
        fecharPopupConfirmacao();
        callbackSim();
    });

    document.getElementById('confirmarNao').addEventListener('click', () => {
        fecharPopupConfirmacao();
    });
}

function limparCamposSubextrato() {
    document.getElementById('formularioSubextrato').reset();
}

function fecharPopupConfirmacao() {
    const popup = document.getElementById('popupConfirmacaoDetalhamento');
    if (popup) {
        document.body.removeChild(popup);
    }
}
