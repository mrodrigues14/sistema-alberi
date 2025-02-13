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

            const selectCategoria = document.getElementById('seletorCategoria'); // Select já existente
            const selectFornecedor = document.getElementById('seletorFornecedor'); // Select já existente
            const selectRubricaContabil = document.getElementById('seletorRubricaContabil'); // Novo select para Rubrica Contábil

            // Limpar selects
            [selectCategoria, selectFornecedor, selectRubricaContabil].forEach(select => {
                while (select.firstChild) {
                    select.removeChild(select.firstChild);
                }
            });

            // Carregar categorias (Rubrica Financeira)
            fetch(`/insercao/dados-categoria?idcliente=${IDCLIENTE}`)
                .then(response => response.json())
                .then(data => {
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = 'Selecione uma Rubrica';
                    selectCategoria.appendChild(defaultOption);

                    const categorias = construirArvoreDeCategorias(data);
                    adicionarCategoriasAoSelect(selectCategoria, categorias);
                })
                .catch(error => {
                    console.error('Erro ao carregar as categorias:', error);
                });

            // Carregar rubricas contábeis
            fetch(`/insercao/listar-rubricas-contabeis`) // Rota para listar Rubricas Contábeis
                .then(response => response.json())
                .then(data => {
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = '';
                    selectRubricaContabil.appendChild(defaultOption);

                    data.forEach(rubrica => {
                        const option = document.createElement('option');
                        option.value = rubrica.IDRUBRICA;
                        option.textContent = rubrica.NOME;
                        selectRubricaContabil.appendChild(option);
                    });
                })
                .catch(error => {
                    console.error('Erro ao carregar as rubricas contábeis:', error);
                });

            // Carregar fornecedores
            fetch(`/fornecedor/listar?idcliente=${IDCLIENTE}`)
                .then(response => response.json())
                .then(data => {
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = 'Selecione um Fornecedor';
                    selectFornecedor.appendChild(defaultOption);

                    data.forEach(fornecedor => {
                        const option = document.createElement('option');
                        option.value = fornecedor.IDFORNECEDOR;
                        option.textContent = fornecedor.NOME_TIPO;
                        selectFornecedor.appendChild(option);
                    });
                })
                .catch(error => {
                    console.error('Erro ao carregar os fornecedores:', error);
                });
        })
        .catch(error => {
            console.error('Erro ao carregar os dados da empresa:', error);
        });
}

document.addEventListener('DOMContentLoaded', function () {
    const mesSelector = document.getElementById('mesSelector');
    const currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth(); // 0-based (Janeiro é 0, Fevereiro é 1, etc.)

    function gerarMeses(ano, startMonth = 0, endMonth = 11, prepend = false) {
        const fragment = document.createDocumentFragment();
        for (let mes = startMonth; mes <= endMonth; mes++) {
            const button = document.createElement('button');
            button.classList.add('mes-button');
            const monthName = new Date(ano, mes).toLocaleString('pt-BR', { month: 'long' });
            button.textContent = `${monthName}/${ano}`;
            button.dataset.mesAno = `${String(mes + 1).padStart(2, '0')}-${ano}`;
            button.addEventListener('click', function () {
                selecionarMesAno(button.dataset.mesAno);
            });

            fragment.appendChild(button);

            if (ano === currentYear && mes === currentMonth) {
                button.classList.add('active');
                selecionarMesAno(button.dataset.mesAno);
            }
        }

        if (prepend) {
            mesSelector.prepend(fragment);
        } else {
            mesSelector.appendChild(fragment);
        }
    }

    // Gera os meses iniciais
    gerarMeses(currentYear - 1);
    gerarMeses(currentYear);
    gerarMeses(currentYear + 1);

    window.gerarMeses = gerarMeses; // Exporta para ser acessível por outras funções
});

function selecionarMesAno(mesAno) {
    const monthButtons = document.querySelectorAll('.mes-button');
    monthButtons.forEach(btn => btn.classList.remove('active'));

    const selectedButton = [...monthButtons].find(btn => btn.dataset.mesAno === mesAno);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }

    const mesSelectorValue = document.getElementById('mesSelectorValue');
    mesSelectorValue.value = mesAno;

    limparTabela(); // Limpa a tabela antes de buscar novos dados
    buscarDados();
}

function limparTabela() {
    const tbody = document.getElementById('extrato-body');
    if (tbody) {
        tbody.innerHTML = ''; // Remove todas as linhas da tabela
    }
}


function scrollMeses(direcao) {
    const mesSelector = document.getElementById('mesSelector');
    const scrollAmount = 150;

    if (direcao === 'left') {
        mesSelector.scrollBy({ left: -scrollAmount, behavior: 'smooth' });

        // Gera mais meses se o scroll estiver no início
        if (mesSelector.scrollLeft <= 0) {
            const firstMonthButton = mesSelector.querySelector('.mes-button:first-child');
            const [firstMonth, firstYear] = firstMonthButton.dataset.mesAno.split('-').map(Number);
            const prevYear = firstMonth === 1 ? firstYear - 1 : firstYear;
            const prevStartMonth = firstMonth === 1 ? 11 : 0;
            const prevEndMonth = firstMonth === 1 ? 11 : firstMonth - 2;

            gerarMeses(prevYear, prevStartMonth, prevEndMonth, true);
        }
    } else if (direcao === 'right') {
        mesSelector.scrollBy({ left: scrollAmount, behavior: 'smooth' });

        // Gera mais meses se o scroll estiver no final
        if (mesSelector.scrollLeft + mesSelector.clientWidth >= mesSelector.scrollWidth - 1) {
            const lastMonthButton = mesSelector.querySelector('.mes-button:last-child');
            const [lastMonth, lastYear] = lastMonthButton.dataset.mesAno.split('-').map(Number);
            const nextYear = lastMonth === 12 ? lastYear + 1 : lastYear;
            const nextStartMonth = lastMonth === 12 ? 0 : lastMonth;
            const nextEndMonth = 11;

            gerarMeses(nextYear, nextStartMonth, nextEndMonth, false);
        }
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
/*document.getElementById('recorrente').addEventListener('click', function() {
    const recorrenteOptions = document.getElementById('recorrenteOptions');

    if (this.checked) {
        recorrenteOptions.style.display = 'block';
    } else {
        recorrenteOptions.style.display = 'none';
    }
});*/
const datepicker = document.getElementById('datepicker');

datepicker.addEventListener('input', function() {
    let value = this.value.replace(/\D/g, ''); // Remove qualquer caractere que não seja número
    if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2); // Adiciona o primeiro "-"
    if (value.length > 5) value = value.slice(0, 5) + '/' + value.slice(5); // Adiciona o segundo "-"
    this.value = value.slice(0, 10); // Limita ao formato dd-mm-aaaa
});

function formatarDataParaAmericano(data) {
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes}-${dia}`;
}

document.getElementById('meuFormulario').addEventListener('submit', async function(event) {
    event.preventDefault(); // Previne o envio padrão do formulário

    // Captura os valores do formulário
    const formData = new FormData(this);
    let Data = formData.get('Data'); // Data inicial


    Data = formatarDataParaAmericano(Data);
    const categoria = formData.get('categoria'); // ID da categoria
    const descricao = formData.get('descricao');
    const nomeExtrato = formData.get('nomeExtrato');
    const valorEn = document.getElementById('valorEn').value.replace(/\./g, '').replace(',', '.');
    const valorSa = document.getElementById('valorSa').value.replace(/\./g, '').replace(',', '.');
    const id_empresa = formData.get('id_empresa');

    // Captura a rubrica contábil
    const rubricaContabilSelecionada = document.getElementById('seletorRubricaContabil');
    const rubricaContabil = rubricaContabilSelecionada.options[rubricaContabilSelecionada.selectedIndex].textContent.trim();

    // Captura o nome do fornecedor
    const fornecedorSelecionado = document.getElementById('seletorFornecedor');
    const fornecedor = fornecedorSelecionado.options[fornecedorSelecionado.selectedIndex].textContent.trim();

    // Captura o banco selecionado
    const idBancoElement = document.getElementById('seletorBanco');
    const idBanco = idBancoElement ? idBancoElement.value : null;

    // Monta os dados para inserção
    const dadosParaInserir = {
        Data: Data,
        Categoria: categoria, // ID da categoria
        Descricao: descricao,
        Nome: nomeExtrato,
        TIPO: valorEn ? 'Entrada' : 'Saída', // Determina se é entrada ou saída
        VALOR: valorEn || valorSa,
        IDBANCO: idBanco,
        IDCLIENTE: id_empresa, // Ajuste conforme a necessidade
        FORNECEDOR: fornecedor, // Nome do fornecedor
        rubrica_contabil: rubricaContabil, // Inclui a Rubrica Contábil no objeto de dados
        rubrica_do_mes: 0 // Inclui o valor da Rubrica do Mês (1 ou 0)
    };


    // Envia os dados ao backend
    try {
        const response = await fetch('/insercao/inserir-individual', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosParaInserir) // Envia os dados
        });

        if (!response.ok) {
            throw new Error('Erro ao inserir dados');
        }

        await buscarDados(); // Chama a função que busca os dados
        resetForm(); // Reseta o formulário após o envio
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
            option.value = categoria.IDCATEGORIA; // ID da categoria
            option.textContent = prefixo + categoria.NOME; // Nome exibido ao usuário
            option.setAttribute('data-nome', categoria.NOME.toLowerCase()); // Nome como atributo data-nome

            if (categoria.subcategorias.length > 0) {
                option.disabled = true; // Desabilita categorias que têm subcategorias
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

    // Função para configurar o botão de adição no Select2
    function configurarSelect2ComBotao(selector, placeholder, opcaoSelecionada) {
        $(selector).select2({
            placeholder: placeholder,
            allowClear: true,
            language: {
                noResults: function() {
                    return `<button class="btn-add-opcao" data-opcao="${opcaoSelecionada}">Adicionar ${opcaoSelecionada}</button>`;
                }
            },
            escapeMarkup: function(markup) {
                return markup;
            }
        });
    }

    // Configura os Select2 com botões de adição
    configurarSelect2ComBotao('#seletorCategoria', 'Selecione uma rúbrica', 'rubricas');
    configurarSelect2ComBotao('#seletorFornecedor', 'Selecione um fornecedor', 'fornecedor');
    configurarSelect2ComBotao('#seletorRubricaContabil', 'Selecione uma rubrica contábil', 'rubricas');

    // Evento para capturar cliques nos botões dinâmicos
    $(document).on('click', '.btn-add-opcao', function(e) {
        e.preventDefault();
        const opcao = $(this).data('opcao');
        abrirPopupOpcao(opcao); // Chama o popup com a opção correta
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


function initializePageConsulta() {
    const nomeEmpresa = getStoredEmpresaName();

    fetch(`insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                idEmpresa = data[0].IDCLIENTE;

                fetch(`/insercao/dados?idcliente=${idEmpresa}`)
                    .then(response => response.json())
                    .then(data => {
                        const select = document.getElementById('seletorBanco');
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
                        semFornecedor.textContent = '';
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


function formatarValorNumerico(valor) {
    return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function carregarCategoriasEFornecedores() {
    fetch(`/insercao/dados-categoria?idcliente=${idEmpresa}`)
        .then(response => response.json())
        .then(categorias => {

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
        });
}

async function buscarDados(fromEdit = false) {
    const idBancoElement = document.getElementById('seletorBanco');
    const idBanco = IDBANCO || (idBancoElement ? idBancoElement.value : null);

    if (!idBanco) {
        console.error('Banco não selecionado ou elemento não encontrado.');
        return;
    }

    const mesAno = document.getElementById('mesSelectorValue').value;
    const dataFormatada = formatDateToFirstOfMonth(mesAno);

    console.log(dataFormatada);
    // Salva a posição de rolagem antes de atualizar
    const scrollPosition = fromEdit ? window.scrollY : 0;

    try {
        const saldoInicial = await fetchSaldoInicial();

        const response = await fetch(`/consulta/dados?banco=${idBanco}&data=${dataFormatada}&empresa=${idEmpresa}`);
        const data = await response.json();

        if (fromEdit) {
            atualizarLinhasExistentes(data, saldoInicial);
        } else {
            configurarCarregamentoIncremental(data, saldoInicial);
        }

        fetchSaldoFinal();

        // Restaura a posição de rolagem após a atualização, se acionado por edição
        if (fromEdit) {
            setTimeout(() => window.scrollTo(0, scrollPosition), 0);
        }
    } catch (error) {
        console.error('Erro ao buscar os dados:', error);
    }
}

function atualizarLinhasExistentes(dados, saldoInicial) {
    const tbody = document.getElementById('extrato-body');
    const linhasExistentes = Array.from(tbody.querySelectorAll('tr'));

    let saldo = saldoInicial;

    dados.forEach(item => {
        // Localiza a linha correspondente na tabela
        const linhaExistente = linhasExistentes.find(row => row.dataset.idextrato == item.IDEXTRATO);

        if (linhaExistente) {
            // Atualiza os dados da linha existente
            const cells = linhaExistente.querySelectorAll('td');
            cells[0].textContent = formatDate(item.DATA); // Data
            cells[1].textContent = item.CATEGORIA || ''; // Categoria
            cells[2].textContent = item.NOME_FORNECEDOR || ''; // Fornecedor
            cells[3].textContent = item.DESCRICAO || ''; // Observação
            cells[4].textContent = item.NOME_NO_EXTRATO || ''; // Nome no Extrato
            cells[5].textContent = item.RUBRICA_CONTABIL || ''; // Rubrica Contábil

            // Atualiza os valores de entrada e saída
            cells[6].textContent = item.TIPO_DE_TRANSACAO === 'ENTRADA' ? formatarValorParaExibicao(item.VALOR) : '';
            cells[7].textContent = item.TIPO_DE_TRANSACAO === 'SAIDA' ? formatarValorParaExibicao(item.VALOR) : '';

            // Recalcula e atualiza o saldo
            saldo += (parseFloat(item.VALOR) || 0) * (item.TIPO_DE_TRANSACAO === 'ENTRADA' ? 1 : -1);
            cells[8].textContent = formatarValorParaExibicao(saldo);
        }
    });
}

// Função para configurar o carregamento incremental
function configurarCarregamentoIncremental(dados, saldoInicial) {
    let startIndex = 0;
    const batchSize = 20; // Número de linhas carregadas por vez
    let saldoAcumulado = saldoInicial; // Saldo contínuo, começa com o saldo inicial

    // Função para carregar o próximo lote de dados
    async function carregarMais() {
        if (startIndex >= dados.length) return; // Não há mais dados para carregar

        const endIndex = Math.min(startIndex + batchSize, dados.length);
        const dadosLote = dados.slice(startIndex, endIndex);

        // Atualiza a tabela com o lote de dados e passa o saldo acumulado
        saldoAcumulado = await atualizarTabela(dadosLote, saldoAcumulado);

        startIndex = endIndex; // Atualiza o índice de início para o próximo lote
    }

    // Adiciona o evento de scroll para carregar mais dados ao chegar ao fim da página
    window.onscroll = async function () {
        if (
            window.innerHeight + window.scrollY >= document.body.offsetHeight &&
            startIndex < dados.length
        ) {
            await carregarMais();
        }
    };

    // Carrega o primeiro lote de dados
    carregarMais();
}



let editMode = false;

function alternarModoEdicao() {
    const tabela = document.getElementById('extrato-body');
    if (!tabela) {
        console.error('Tabela não encontrada!');
        return;
    }

    const linhas = tabela.querySelectorAll('tr');

    if (linhas.length === 0) {
        console.warn('Nenhuma linha encontrada na tabela.');
        return;
    }

    if (!editMode) {
        // Ativar modo de edição
        linhas.forEach(linha => {
            const cells = linha.querySelectorAll('td');
            linha.dataset.originalData = JSON.stringify(
                Array.from(cells).map(cell => cell.textContent.trim()) // Armazenando os valores originais das células
            );

            // Armazena o conteúdo HTML da célula de anexos
            const anexosCell = cells[cells.length - 2]; // Supondo que a penúltima célula seja a dos anexos
            linha.dataset.originalAnexos = anexosCell.innerHTML;

            cells.forEach((cell, index) => {
                if (index === 0) { // Data (primeira coluna)
                    const dataAtual = cell.textContent.trim();
                    let dataFormatada = '';
                    if (dataAtual.includes('/')) {
                        const [dia, mes, ano] = dataAtual.split('/');
                        if (dia && mes && ano) {
                            dataFormatada = `${ano}-${mes}-${dia}`;
                        }
                    } else {
                        dataFormatada = dataAtual;
                    }

                    const inputData = document.createElement('input');
                    inputData.type = 'date';
                    inputData.value = dataFormatada;
                    inputData.classList.add('editavel');
                    inputData.style.width = '100%';

                    cell.innerHTML = '';
                    cell.appendChild(inputData);

                } else if (index === 1) { // Categoria (segunda coluna)
                    const categoriaAtual = cell.textContent.trim();
                    const selectCategoria = document.createElement('select');
                    selectCategoria.classList.add('styled-select');
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

                            const categoriaSelecionada = Array.from(selectCategoria.options).find(option => option.text.trim() === categoriaAtual);
                            if (categoriaSelecionada) {
                                categoriaSelecionada.selected = true;
                            }

                            cell.innerHTML = '';
                            cell.appendChild(selectCategoria);
                        })
                        .catch(error => {
                            console.error('Erro ao buscar categorias:', error);
                        });

                } else if (index === 2) { // Fornecedor (terceira coluna)
                    const fornecedorAtual = cell.textContent.trim();
                    const selectFornecedor = document.createElement('select');
                    selectFornecedor.classList.add('styled-select');
                    selectFornecedor.style.width = '100%';

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

                            const fornecedorSelecionado = Array.from(selectFornecedor.options).find(option => option.text.trim() === fornecedorAtual);
                            if (fornecedorSelecionado) {
                                fornecedorSelecionado.selected = true;
                            }

                            cell.innerHTML = '';
                            cell.appendChild(selectFornecedor);
                        })
                        .catch(error => {
                            console.error('Erro ao buscar fornecedores:', error);
                        });

                } else if (index === 5) { // Rubrica Contábil (sexta coluna)
                    const rubricaContabilAtual = cell.textContent.trim();
                    const selectRubricaContabil = document.createElement('select');
                    selectRubricaContabil.classList.add('styled-select');
                    selectRubricaContabil.style.width = '100%';

                    fetch(`/insercao/listar-rubricas-contabeis`)
                        .then(response => response.json())
                        .then(rubricasContabeis => {
                            const optionDefault = document.createElement('option');
                            optionDefault.value = '';
                            optionDefault.textContent = 'Selecione uma Rubrica Contábil';
                            selectRubricaContabil.appendChild(optionDefault);

                            rubricasContabeis.forEach(rubrica => {
                                const option = document.createElement('option');
                                option.value = rubrica.IDRUBRICA;
                                option.textContent = rubrica.NOME;
                                selectRubricaContabil.appendChild(option);
                            });

                            const rubricaSelecionada = Array.from(selectRubricaContabil.options).find(option => option.text.trim() === rubricaContabilAtual);
                            if (rubricaSelecionada) {
                                rubricaSelecionada.selected = true;
                            }

                            cell.innerHTML = '';
                            cell.appendChild(selectRubricaContabil);
                        })
                        .catch(error => {
                            console.error('Erro ao buscar rubricas contábeis:', error);
                        });

                } else if (index > 0 && index < 8) { // Outras colunas, incluindo Entrada e Saída
                    const cellText = cell.textContent.trim();
                    cell.innerHTML = `<input type="text" value="${cellText}" class="editavel">`;

                    const input = cell.querySelector('input');
                    input.style.width = '100%';

                    if (index === 6 || index === 7) { // Entrada e Saída
                        input.addEventListener('input', function () {
                            this.value = formatarValorFinanceiroInput(this.value);
                        });
                    }
                }
            });

            const ferramentasCell = cells[cells.length - 1];
            linha.dataset.originalButtons = ferramentasCell.innerHTML;
            ferramentasCell.innerHTML = `
                <button onclick="confirmarEdicao(this, ${linha.dataset.idextrato})" class="confirmar-btn"><i class="fas fa-check"></i></button>
                <button onclick="cancelarEdicao(this)" class="cancelar-btn"><i class="fas fa-times"></i></button>
            `;
        });

        editMode = true; // Modo de edição ativado
    } else {
        // Desativar modo de edição (restaurar os valores originais)
        linhas.forEach(linha => {
            const cells = linha.querySelectorAll('td');
            const dadosOriginais = JSON.parse(linha.dataset.originalData); // Pega os dados originais

            cells.forEach((cell, index) => {
                cell.textContent = dadosOriginais[index]; // Restaura o conteúdo original da célula
            });

            // Restaurar anexos
            const anexosCell = cells[cells.length - 2]; // Supondo que a penúltima célula seja a dos anexos
            anexosCell.innerHTML = linha.dataset.originalAnexos;

            const ferramentasCell = cells[cells.length - 1];
            ferramentasCell.innerHTML = linha.dataset.originalButtons; // Restaura os botões originais
        });

        editMode = false; // Modo de visualização ativado
    }
}

// Adiciona evento ao botão de alternância de edição
document.getElementById('botaoEditarTodas').addEventListener('click', alternarModoEdicao);

async function atualizarTabela(dados, saldoInicial) {
    // Exibe o spinner de carregamento
    document.getElementById('loadingSpinner').style.display = 'block';
    document.querySelector('.body-insercao').classList.add('blur-background');
    document.querySelector('.popup-insercao-container').classList.add('blur-background');

    const tbody = document.getElementById('extrato-body');

    let saldo = saldoInicial;
    let processedCount = 0; // Contador de itens processados

    for (const item of dados) {
        const subextratos = await buscarSubextratos(item.IDEXTRATO);

        // Cria a linha do extrato principal
        const row = tbody.insertRow();
        row.dataset.idextrato = item.IDEXTRATO;

        row.insertCell().textContent = formatDate(item.DATA); // Data
        row.insertCell().textContent = item.CATEGORIA || ''; // Categoria
        row.insertCell().textContent = item.NOME_FORNECEDOR || ''; // Fornecedor
        row.insertCell().textContent = item.DESCRICAO || ''; // Observação
        row.insertCell().textContent = item.NOME_NO_EXTRATO || ''; // Nome no Extrato
        row.insertCell().textContent = item.RUBRICA_CONTABIL || ''; // Rubrica Contábil

        const entradaCell = row.insertCell();
        const saidaCell = row.insertCell();
        entradaCell.textContent = item.TIPO_DE_TRANSACAO === 'ENTRADA' ? formatarValorParaExibicao(item.VALOR) : "";
        saidaCell.textContent = item.TIPO_DE_TRANSACAO === 'SAIDA' ? formatarValorParaExibicao(item.VALOR) : "";

        saldo += (parseFloat(item.VALOR) || 0) * (item.TIPO_DE_TRANSACAO === 'ENTRADA' ? 1 : -1);
        row.insertCell().textContent = formatarValorParaExibicao(saldo);

        // Anexos e Ferramentas
        const anexosCell = row.insertCell();
        anexosCell.innerHTML = `
            <button onclick="abrirPopupAnexos(${item.IDEXTRATO})">
                <i class="fa-solid fa-circle-plus"></i>
            </button>
        `;

        const anexos = await buscarAnexos(item.IDEXTRATO);
        if (anexos.length > 0) {
            anexos.forEach(anexo => {
                const anexoButton = document.createElement('button');
                anexoButton.textContent = anexo.TIPO_EXTRATO_ANEXO; // Exibe o tipo (CP, DC/NF, etc.)
                anexoButton.classList.add('anexo-button');
                anexoButton.onclick = () => window.open(`/consulta/download-anexo/${anexo.NOME_ARQUIVO}`, '_blank');
                anexosCell.insertBefore(anexoButton, anexosCell.firstChild);
            });
        }

        const deleteCell = row.insertCell();
        deleteCell.innerHTML = `
            <div class="dropdown-extrato-opcoes">
                <div class="dropdown-content-extrato-opcoes">
                    <button onclick="abrirLinhaSubextrato(this)"><i class="fa-solid fa-divide"></i></button>
                    <button onclick="editarLinha(this)" data-idextrato="${item.IDEXTRATO}" class="edit-btn-extrato-opcoes">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="selecionarLinha(this)" data-idextrato="${item.IDEXTRATO}" class="select-btn-extrato-opcoes">
                        <i class="fas fa-hand-pointer"></i>
                    </button>
                    <form onsubmit="return deletarLinhaExtrato(event, ${item.IDEXTRATO})">
                        <input type="hidden" name="idExtrato" value="${item.IDEXTRATO}">
                        <button type="submit" class="delete-btn-extrato-opcoes">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </form>

                </div>
            </div>
        `;

        processedCount++;

        // Para o spinner e remove os efeitos de carregamento após 20 itens
        if (processedCount >= 20) {
            document.getElementById('loadingSpinner').style.display = 'none';
            document.querySelector('.body-insercao').classList.remove('blur-background');
            document.querySelector('.popup-insercao-container').classList.remove('blur-background');
        }

        // Renderiza os subextratos
        if (subextratos.length > 0) {
            let totalEntradas = 0;
            let totalSaidas = 0;

            subextratos.forEach(sub => {
                if (sub.TIPO_DE_TRANSACAO === 'ENTRADA') {
                    totalEntradas += parseFloat(sub.VALOR || 0);
                } else if (sub.TIPO_DE_TRANSACAO === 'SAIDA') {
                    totalSaidas += parseFloat(sub.VALOR || 0);
                }
            });

            const valorPrincipal = parseFloat(item.VALOR) || 0;
            const discrepancia =
                (item.TIPO_DE_TRANSACAO === 'ENTRADA' && totalEntradas !== valorPrincipal) ||
                (item.TIPO_DE_TRANSACAO === 'SAIDA' && totalSaidas !== valorPrincipal);

            subextratos.forEach(sub => {
                const subRow = tbody.insertRow();
                subRow.dataset.subextrato = sub.ID_SUBEXTRATO;
                subRow.dataset.idextratoprincipal = item.IDEXTRATO;
                subRow.classList.add('subextrato-row');
                if (discrepancia) {
                    subRow.classList.add('erro-subextrato'); // Adiciona erro visual
                }

                subRow.innerHTML = `
                    <td>${formatDate(sub.DATA)}</td>
                    <td>${sub.CATEGORIA || ''}</td>
                    <td>${sub.NOME_FORNECEDOR || ''}</td>
                    <td>${sub.OBSERVACAO || ''}</td>
                    <td>${sub.DESCRICAO || ''}</td>
                    <td>${sub.RUBRICA_CONTABIL || ''}</td>
                    <td>${sub.TIPO_DE_TRANSACAO === 'ENTRADA' ? formatarValorParaExibicaoSub(sub.VALOR) : ''}</td>
                    <td>${sub.TIPO_DE_TRANSACAO === 'SAIDA' ? formatarValorParaExibicaoSub(sub.VALOR) : ''}</td>
                    <td></td>
                    <td>
                        <button onclick="abrirPopupAnexos(${sub.ID_SUBEXTRATO})">
                            <i class="fa fa-paperclip"></i>
                        </button>
                    </td>
                    <td>
                        <button onclick="editarSubextrato(${sub.ID_SUBEXTRATO}, this)" class="edit-btn-extrato-opcoes">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deletarSubextrato(${sub.ID_SUBEXTRATO}, this)" class="delete-btn-extrato-opcoes">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
            });
        }
    }

    // Esconde o spinner de carregamento
    document.getElementById('loadingSpinner').style.display = 'none';
    document.querySelector('.body-insercao').classList.remove('blur-background');
    document.querySelector('.popup-insercao-container').classList.remove('blur-background');
    return saldo;
}

async function deletarLinhaExtrato(event, idExtrato) {
    event.preventDefault(); // Impede o recarregamento da página

    const confirmacao = confirm("Tem certeza que deseja deletar este extrato?");
    if (!confirmacao) return; // Se o usuário cancelar, não faz nada

    try {
        const response = await fetch('/insercao/deletar-extrato', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `idExtrato=${encodeURIComponent(idExtrato)}`
        });

        if (!response.ok) {
            throw new Error("Erro ao deletar extrato");
        }

        console.log("Extrato deletado com sucesso!");

        // Atualiza os dados chamando buscarDados(true)
        limparTabela()
        await buscarDados();

    } catch (error) {
        console.error("Erro ao deletar extrato:", error);
    }
}
async function buscarAnexos(idExtrato) {
    try {
        const response = await fetch(`/insercao/anexos?idExtrato=${idExtrato}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar anexos');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao carregar anexos:', error);
        return [];
    }
}

function formatarValorParaExibicaoSub(valor) {
    if (typeof valor === 'number') {
        valor = valor.toFixed(2); // Garante duas casas decimais
    }

    return valor
        .toString()
        .replace('.', ',') // Troca o separador decimal
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Adiciona pontos como separador de milhar
}

function deletarSubextrato(idSubextrato, buttonElement) {
    const subextratoRow = buttonElement.closest('tr'); // Linha atual do subextrato
    let extratoRow = subextratoRow.previousElementSibling; // Procura a linha anterior

    // Encontra a linha do extrato principal associada
    while (extratoRow && !extratoRow.dataset.idextrato) {
        extratoRow = extratoRow.previousElementSibling;
    }

    if (!extratoRow || !extratoRow.dataset.idextrato) {
        console.error('Não foi possível encontrar o extrato principal associado.');
        return;
    }

    const idExtratoPrincipal = extratoRow.dataset.idextrato;

    if (confirm('Tem certeza que deseja deletar este subextrato?')) {
        fetch(`/insercao/deletar-subextrato/${idSubextrato}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        })
            .then(response => {
                if (!response.ok) throw new Error('Erro ao deletar subextrato');
                return response.json();
            })
            .then(result => {
                alert(result.message);
                // Atualiza apenas a linha do extrato principal e seus subextratos
                atualizarTabelaComSubextrato(idExtratoPrincipal);
            })
            .catch(error => {
                console.error(error);
                alert('Erro ao deletar subextrato');
            });
    }
}
function criarDropdownPersonalizado(lista, tipo, abrirPopupOpcao, valorAtual = '') {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '100%';

    // Campo de pesquisa
    const inputSearch = document.createElement('input');
    inputSearch.type = 'text';
    inputSearch.placeholder = `Pesquisar ${tipo}...`;
    inputSearch.value = valorAtual; // Define o texto inicial como o valor atual
    inputSearch.style.width = '100%';
    inputSearch.style.padding = '5px';
    inputSearch.style.boxSizing = 'border-box';

    // Estilo inicial para o caso de valor não encontrado
    let valorEncontrado = lista.some(item => item.nome === valorAtual);
    if (!valorEncontrado && valorAtual) {
        inputSearch.style.border = '2px solid red';
        inputSearch.title = `${tipo} atual não está na lista!`;
    }

    // Lista de opções
    const dropdown = document.createElement('div');
    dropdown.style.position = 'absolute';
    dropdown.style.width = '100%';
    dropdown.style.border = '1px solid #ccc';
    dropdown.style.borderRadius = '4px';
    dropdown.style.background = '#fff';
    dropdown.style.maxHeight = '150px';
    dropdown.style.overflowY = 'auto';
    dropdown.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    dropdown.style.zIndex = '1000';
    dropdown.style.display = 'none'; // Inicialmente escondido

    // Adicionar opções da lista
    lista.forEach(item => {
        const option = document.createElement('div');
        option.textContent = item.nome; // Usa a propriedade "nome" do objeto
        option.dataset.id = item.id; // Armazena o ID da categoria
        option.style.padding = '5px 10px';
        option.style.cursor = 'pointer';
        option.style.borderBottom = '1px solid #eee';
        option.addEventListener('mouseover', () => (option.style.background = '#f0f0f0'));
        option.addEventListener('mouseout', () => (option.style.background = '#fff'));
        option.addEventListener('click', () => {
            inputSearch.value = item.nome; // Define o nome selecionado no campo de busca
            inputSearch.dataset.selectedId = item.id; // Armazena o ID selecionado
            dropdown.style.display = 'none'; // Fecha o dropdown
            inputSearch.style.border = ''; // Remove a borda vermelha
            inputSearch.title = ''; // Remove o título de erro
        });
        dropdown.appendChild(option);
    });

    // Adicionar o valor atual (se não encontrado) como uma opção em vermelho
    if (!valorEncontrado && valorAtual) {
        const optionAtual = document.createElement('div');
        optionAtual.textContent = valorAtual;
        optionAtual.style.padding = '5px 10px';
        optionAtual.style.color = 'red'; // Texto vermelho
        optionAtual.style.fontStyle = 'italic';
        optionAtual.style.cursor = 'default';
        optionAtual.title = `${tipo} atual não está na lista!`;
        dropdown.appendChild(optionAtual);
    }

    // Opção para adicionar novo
    const adicionarNovo = document.createElement('div');
    adicionarNovo.textContent = 'Adicionar Novo';
    adicionarNovo.style.padding = '5px 10px';
    adicionarNovo.style.cursor = 'pointer';
    adicionarNovo.style.fontWeight = 'bold';
    adicionarNovo.style.background = '#f9f9f9';
    adicionarNovo.style.borderTop = '1px solid #eee';
    adicionarNovo.addEventListener('click', () => {
        abrirPopupOpcao(tipo); // Chama a função do popup
        dropdown.style.display = 'none'; // Fecha o dropdown
    });
    dropdown.appendChild(adicionarNovo);

    // Filtrar opções ao digitar no campo de busca
    inputSearch.addEventListener('input', () => {
        const searchTerm = inputSearch.value.toLowerCase();
        Array.from(dropdown.children).forEach(option => {
            if (option.textContent.toLowerCase().includes(searchTerm) || option === adicionarNovo) {
                option.style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        });
    });

    // Exibir dropdown ao focar no campo de pesquisa
    inputSearch.addEventListener('focus', () => {
        dropdown.style.display = 'block';
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (event) => {
        if (!container.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });

    // Monta o container
    container.appendChild(inputSearch);
    container.appendChild(dropdown);

    return container;
}

function editarLinha(buttonElement) {
    const row = buttonElement.closest('tr');
    const idExtrato = row.dataset.idextrato;
    const cells = row.querySelectorAll('td');
    row.dataset.originalData = JSON.stringify(
        Array.from(cells).map(cell => cell.textContent.trim())
    );

    cells.forEach((cell, index) => {
        if (index === 0) { // Data (primeira coluna)
            const dataAtual = cell.textContent.trim();
            let dataFormatada = '';

            // Verifica e formata a data inicial no formato dd/mm/aaaa
            if (dataAtual.includes('/')) {
                const [dia, mes, ano] = dataAtual.split('/');
                if (dia && mes && ano) {
                    dataFormatada = `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
                }
            } else if (dataAtual.includes('-')) {
                const [ano, mes, dia] = dataAtual.split('-');
                if (ano && mes && dia) {
                    dataFormatada = `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
                }
            }

            const inputData = document.createElement('input');
            inputData.type = 'text'; // Define o campo como texto para aceitar formatação personalizada
            inputData.value = dataFormatada; // Preenche com a data formatada
            inputData.classList.add('editavel');
            inputData.placeholder = 'dd/mm/aaaa'; // Define o placeholder
            inputData.style.width = '100%';

            // Formata automaticamente enquanto o usuário digita
            inputData.addEventListener('input', function () {
                let value = this.value.replace(/\D/g, ''); // Remove caracteres não numéricos
                if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2); // Adiciona o primeiro "/"
                if (value.length > 5) value = value.slice(0, 5) + '/' + value.slice(5); // Adiciona o segundo "/"
                this.value = value.slice(0, 10); // Limita ao formato dd/mm/aaaa
            });

            // Valida a data ao perder o foco
            inputData.addEventListener('blur', function () {
                const valor = inputData.value.trim();
                const match = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); // Valida o formato dd/mm/aaaa

                if (match) {
                    const [_, dia, mes, ano] = match;

                    // Validações adicionais (dias e meses válidos)
                    if (parseInt(dia, 10) > 31 || parseInt(mes, 10) > 12) {
                        alert('Data inválida. Verifique o dia e o mês.');
                        this.value = '';
                        return;
                    }

                    this.value = `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`; // Ajusta o formato final
                } else {
                    alert('Data inválida. Por favor, use o formato dd/mm/aaaa.');
                    this.value = ''; // Limpa o campo se a data for inválida
                }
            });

            cell.innerHTML = '';
            cell.appendChild(inputData);
        } else if (index === 1) { // Categoria (segunda coluna)
            const categoriaAtual = cell.textContent.trim(); // Obtém a categoria atual
            const selectCategoria = document.createElement('select');
            selectCategoria.classList.add('styled-select'); // Adicionando a classe estilizada
            selectCategoria.style.width = '100%';

            // Busca as categorias disponíveis
            fetch(`/insercao/dados-categoria?idcliente=${IDCLIENTE}`)
                .then(response => response.json())
                .then(categorias => {
                    const listaCategorias = categorias.map(categoria => ({
                        id: categoria.IDCATEGORIA,
                        nome: categoria.NOME,
                    }));
                    // Criar dropdown personalizado
                    const valorAtual = cell.textContent.trim(); // Pega o valor da célula antes de editar

                    const dropdownCategorias = criarDropdownPersonalizado(
                        listaCategorias,
                        'rubricas',
                        (tipo) => abrirPopupOpcao(tipo),
                        valorAtual
                    );

                    cell.innerHTML = ''; // Limpa a célula
                    cell.appendChild(dropdownCategorias);
                })
                .catch(error => {
                    console.error('Erro ao buscar categorias:', error);
                });



            // Adiciona estilos para destacar categorias não encontradas
            const style = document.createElement('style');
            style.textContent = `
        .styled-select.error {
            border: 2px solid red;
            animation: shake 0.3s;
        }

        .styled-select .not-found {
            color: red;
            font-style: italic;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
        }
    `;
            document.head.appendChild(style);
        } else if (index === 2) { // Fornecedor (terceira coluna)
            const fornecedorAtual = cell.textContent.trim();
            const selectFornecedor = document.createElement('select');
            selectFornecedor.classList.add('styled-select'); // Adicionando a classe
            selectFornecedor.style.width = '100%';
            selectFornecedor.classList.add('fornecedor-select');
            selectFornecedor.name = 'fornecedor';

            fetch(`/fornecedor/listar?idcliente=${IDCLIENTE}`)
                .then(response => response.json())
                .then(fornecedores => {
                    const listaFornecedores = fornecedores.map(fornecedor => fornecedor.NOME_TIPO);

                    const valorAtual = cell.textContent.trim(); // Pega o valor da célula antes de editar

                    // Criar dropdown personalizado
                    const dropdownFornecedores = criarDropdownPersonalizado(
                        listaFornecedores, // Lista de fornecedores
                        'fornecedor',      // Tipo
                        (tipo) => abrirPopupOpcao(tipo), // Callback para abrir o popup
                        valorAtual         // Valor atual da célula
                    );


                    cell.innerHTML = ''; // Limpa a célula
                    cell.appendChild(dropdownFornecedores);
                })
                .catch(error => {
                    console.error('Erro ao buscar fornecedores:', error);
                });


        } else if (index === 5) { // Rubrica Contábil (sexta coluna)
            const rubricaContabilAtual = cell.textContent.trim();
            const selectRubricaContabil = document.createElement('select');
            selectRubricaContabil.classList.add('styled-select'); // Adicionando a classe
            selectRubricaContabil.style.width = '100%';

            fetch(`/insercao/listar-rubricas-contabeis`)
                .then(response => response.json())
                .then(rubricasContabeis => {
                    // Formata a lista de rubricas no formato esperado pelo dropdown personalizado
                    const listaRubricas = rubricasContabeis.map(rubrica => ({
                        id: rubrica.IDRUBRICA,
                        nome: rubrica.NOME
                    }));

                    const valorAtual = cell.textContent.trim(); // Valor atual da célula antes de editar

                    // Cria o dropdown personalizado para rubricas
                    const dropdownRubricas = criarDropdownPersonalizado(
                        listaRubricas, // Lista de rubricas
                        'rubricas',     // Tipo
                        (tipo) => abrirPopupOpcao(tipo),
                        valorAtual      // Valor atual da célula
                    );

                    cell.innerHTML = ''; // Limpa a célula
                    cell.appendChild(dropdownRubricas); // Adiciona o dropdown na célula
                })
                .catch(error => {
                    console.error('Erro ao buscar rubricas contábeis:', error);
                });

        } else if (index > 0 && index < 8) {
            const cellText = cell.textContent.trim();
            cell.innerHTML = `<input type="text" value="${cellText}" class="editavel">`;

            const input = cell.querySelector('input');
            input.style.width = '100%';

            if (index === 6 || index === 7) { // Entrada e Saída
                input.addEventListener('input', function () {
                    this.value = formatarValorFinanceiroInput(this.value);
                });
            }
        }
    });

    const ferramentasCell = cells[cells.length - 1];
    row.dataset.originalButtons = ferramentasCell.innerHTML;
    ferramentasCell.innerHTML = `
        <button onclick="confirmarEdicao(this, ${idExtrato})" class="confirmar-btn">
            <i class="fas fa-check"></i>
        </button>
        <button onclick="cancelarEdicao(this)" class="cancelar-btn">
            <i class="fas fa-times"></i>
        </button>

    `;
}

function confirmarEdicao(buttonElement) {
    const row = buttonElement.closest('tr');
    const cells = row.querySelectorAll('td');

    // Recuperando os dados originais armazenados antes da edição
    const dadosOriginais = JSON.parse(row.dataset.originalData);

    let fornecedor;
    const fornecedorCell = cells[2]; // Fornecedor (terceira coluna)

    if (fornecedorCell.querySelector('input')) {
        fornecedor = fornecedorCell.querySelector('input').value || null;
    } else if (fornecedorCell.querySelector('select')) {
        const selectFornecedor = fornecedorCell.querySelector('select');
        fornecedor = selectFornecedor.options[selectFornecedor.selectedIndex].textContent.trim(); // Obtém o nome do fornecedor
    } else {
        fornecedor = dadosOriginais[2]; // Valor original do fornecedor
    }

    let tipo = null;
    let valor = null; // Apenas um valor, seja entrada ou saída

    // Verifica se o campo de entrada possui valor
    if (cells[6].querySelector('input').value) {
        tipo = 'ENTRADA';
        valor = parseFloat(cells[6].querySelector('input').value.replace(/\./g, '').replace(',', '.')) || null;
    }
    // Verifica se o campo de saída possui valor
    else if (cells[7].querySelector('input').value) {
        tipo = 'SAIDA';
        valor = parseFloat(cells[7].querySelector('input').value.replace(/\./g, '').replace(',', '.')) || null;
    }

    const categoriaCell = cells[1]; // Categoria (segunda coluna)
    let categoriaNome;

    if (categoriaCell.querySelector('input')) {
        // Caso o dropdown seja um campo de input, captura o valor do input
        categoriaNome = categoriaCell.querySelector('input').value.trim();
    } else if (categoriaCell.querySelector('select')) {
        const selectCategoria = categoriaCell.querySelector('select');
        const categoriaSelecionada = selectCategoria.selectedOptions[0]; // Obtém a opção selecionada
        categoriaNome = categoriaSelecionada ? categoriaSelecionada.textContent.trim() : dadosOriginais[1];
    } else {
        categoriaNome = dadosOriginais[1]; // Usa o valor original se nenhum for selecionado
    }


    // Obtém o nome da rubrica contábil selecionada
    const rubricaContabilCell = cells[5]; // Rubrica Contábil (sexta coluna)
    let rubricaContabil;

    if (rubricaContabilCell.querySelector('input')) {
        // Caso o dropdown seja um campo de input, captura o valor do input
        rubricaContabil = rubricaContabilCell.querySelector('input').value.trim();
    } else if (rubricaContabilCell.querySelector('select')) {
        const selectRubrica = rubricaContabilCell.querySelector('select');
        const rubricaSelecionada = selectRubrica.selectedOptions[0]; // Obtém a opção selecionada
        rubricaContabil = rubricaSelecionada ? rubricaSelecionada.textContent.trim() : dadosOriginais[5];
    } else {
        rubricaContabil = dadosOriginais[5]; // Usa o valor original se nenhum for selecionado
    }

    // Formata a data
    const dataEditFormatada = formatarDataParaAmericano(cells[0].querySelector('input').value);

    // Monta o objeto com os dados editados
    const dadosEditados = {
        id: row.dataset.idextrato,
        data: dataEditFormatada, // Pegando o valor da data do input
        categoria: categoriaNome, // Rubrica Financeira
        fornecedor: fornecedor, // Nome do fornecedor
        descricao: cells[3].querySelector('input').value || dadosOriginais[3], // Observação
        nome_no_extrato: cells[4].querySelector('input').value || dadosOriginais[4], // Nome no Extrato
        rubrica_contabil: rubricaContabil, // Nome da Rubrica Contábil selecionada
        tipo: tipo,
        valor: valor // Apenas o valor, seja de entrada ou saída
    };


    // Envia os dados para o backend
    enviarEdicaoExtrato(dadosEditados, buttonElement);
}

function enviarEdicaoExtrato(dadosEditados, buttonElement) {
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
            if (data.affectedRows > 0) {
                alert('Edição confirmada com sucesso!');
            } else {
                alert('Nenhuma mudança foi detectada.');
            }
            cancelarEdicao(buttonElement);
            // Atualiza a tabela preservando o scroll
            buscarDados(true);
        })
        .catch(error => {
            console.error('Erro ao confirmar a edição:', error);
            alert('Erro ao confirmar a edição. Por favor, tente novamente.');
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

async function buscarSubextratos(idExtratoPrincipal) {
    try {
        const response = await fetch(`/insercao/subextratos?idExtrato=${idExtratoPrincipal}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar subextratos');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar subextratos:', error);
        return [];
    }
}

function adicionarLinhaSubextrato(idExtratoPrincipal, row) {
    const tbody = row.parentElement;

    const newRow = document.createElement('tr');
    newRow.dataset.subextrato = idExtratoPrincipal;
    newRow.classList.add('subextrato-row');

    newRow.innerHTML = `
        <td>
            <input type="text" name="Data" class="editavel" placeholder="dd/mm/aaaa" required style="width: 100%;">
        </td>
        <td></td>
        <td></td>
        <td><input type="text" name="observacao" class="editavel" placeholder="Observação" style="width: 100%;"></td>
        <td><input type="text" name="descricao" class="editavel" placeholder="Descrição" style="width: 100%;"></td>
        <td></td>
        <td><input type="text" name="valorEn" class="editavel" placeholder="Entrada" style="width: 100%;"></td>
        <td><input type="text" name="valorSa" class="editavel" placeholder="Saída" style="width: 100%;"></td>
        <td colspan="2">
            <button onclick="confirmarSubextrato(${idExtratoPrincipal}, this)" class="confirmar-btn">
                <i class="fas fa-check"></i>
            </button>
            <button onclick="cancelarSubextrato(this)" class="cancelar-btn">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;

    row.insertAdjacentElement('afterend', newRow);

    // Configuração do campo de data
    const inputData = newRow.querySelector('input[name="Data"]');
    inputData.addEventListener('input', function () {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
        if (value.length > 5) value = value.slice(0, 5) + '/' + value.slice(5);
        this.value = value.slice(0, 10);
    });

    inputData.addEventListener('blur', function () {
        const valor = this.value.trim();
        const match = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

        if (match) {
            const [_, dia, mes, ano] = match;
            if (parseInt(dia, 10) > 31 || parseInt(mes, 10) > 12) {
                alert('Data inválida. Verifique o dia e o mês.');
                this.value = '';
                return;
            }
            this.value = `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
        } else {
            alert('Data inválida. Por favor, use o formato dd/mm/aaaa.');
            this.value = '';
        }
    });

    // Buscar e popular as categorias
    fetch(`/insercao/dados-categoria?idcliente=${IDCLIENTE}`)
        .then(response => response.json())
        .then(categorias => {
            const categoriaCell = newRow.children[1];
            const dropdownCategorias = criarDropdownPersonalizado(
                categorias.map(categoria => ({ id: categoria.IDCATEGORIA, nome: categoria.NOME })),
                'rubricas',
                (tipo) => abrirPopupOpcao(tipo)
            );
            categoriaCell.appendChild(dropdownCategorias);
        })
        .catch(error => console.error('Erro ao buscar categorias:', error));

    // Buscar e popular os fornecedores
    fetch(`/fornecedor/listar?idcliente=${IDCLIENTE}`)
        .then(response => response.json())
        .then(fornecedores => {
            const fornecedorCell = newRow.children[2];
            const dropdownFornecedores = criarDropdownPersonalizado(
                fornecedores.map(fornecedor => fornecedor.NOME_TIPO),
                'fornecedor',
                (tipo) => abrirPopupOpcao(tipo)
            );
            fornecedorCell.appendChild(dropdownFornecedores);
        })
        .catch(error => console.error('Erro ao buscar fornecedores:', error));

    // Buscar e popular as rubricas contábeis
    fetch(`/insercao/listar-rubricas-contabeis`)
        .then(response => response.json())
        .then(rubricasContabeis => {
            const rubricaCell = newRow.children[5];
            const dropdownRubricas = criarDropdownPersonalizado(
                rubricasContabeis.map(rubrica => ({ id: rubrica.IDRUBRICA, nome: rubrica.NOME })),
                'rubricas',
                (tipo) => abrirPopupOpcao(tipo)
            );
            rubricaCell.appendChild(dropdownRubricas);
        })
        .catch(error => console.error('Erro ao buscar rubricas contábeis:', error));

    // Adiciona formatação ao campo de entrada e saída
    const inputEntrada = newRow.querySelector('input[name="valorEn"]');
    const inputSaida = newRow.querySelector('input[name="valorSa"]');

    inputEntrada.addEventListener('input', function () {
        this.value = formatarValorFinanceiroInput(this.value);
    });

    inputSaida.addEventListener('input', function () {
        this.value = formatarValorFinanceiroInput(this.value);
    });
}

function confirmarSubextrato(idExtratoPrincipal, buttonElement) {
    const row = buttonElement.closest('tr');

    // Valida valores de entrada ou saída
    let valorEn = row.querySelector('[name="valorEn"]').value.trim();
    let valorSa = row.querySelector('[name="valorSa"]').value.trim();

    valorEn = valorEn ? parseFloat(valorEn.replace(/\./g, '').replace(',', '.')) || null : null;
    valorSa = valorSa ? parseFloat(valorSa.replace(/\./g, '').replace(',', '.')) || null : null;

    // Determinar tipo de transação corretamente
    let tipo = null;

    if (valorEn !== null && valorEn > 0) {
        tipo = 'ENTRADA';
    }
    if (valorSa !== null && valorSa > 0) {
        tipo = 'SAIDA';
    }

    // Se nenhum valor for válido, exibe erro
    if (!tipo) {
        alert('Por favor, insira um valor válido para entrada ou saída.');
        return;
    }

    // Validação dos campos obrigatórios
    const dataField = row.querySelector('[name="Data"]');
    const categoriaSelect = row.querySelector('[name="categoria"]');
    const fornecedorSelect = row.querySelector('[name="fornecedor"]');
    const rubricaContabilSelect = row.querySelector('[name="rubricaContabil"]');

    if (!dataField.value.trim()) {
        alert('Por favor, insira uma data válida.');
        return;
    }

    const categoriaNome = categoriaSelect.options[categoriaSelect.selectedIndex].text;
    const fornecedorNome = fornecedorSelect.options[fornecedorSelect.selectedIndex].text;
    const rubricaContabilNome = rubricaContabilSelect.options[rubricaContabilSelect.selectedIndex].text;

    if (categoriaNome === 'Selecione uma Categoria') {
        alert('Por favor, selecione uma categoria válida.');
        return;
    }

    // Os campos de fornecedor e rubrica contábil podem ser deixados em branco
    const fornecedor = fornecedorNome !== 'Selecione um Fornecedor' ? fornecedorNome : '';
    const rubricaContabil = rubricaContabilNome !== 'Selecione uma Rubrica' ? rubricaContabilNome : '';

    // Dados formatados para envio
    const data = {
        Data: formatarDataParaAmericano(dataField.value.trim()),
        categoria: categoriaNome,
        fornecedor: fornecedor,
        descricao: row.querySelector('[name="descricao"]').value,
        observacao: row.querySelector('[name="observacao"]').value,
        valorEn: valorEn,
        valorSa: valorSa,
        rubricaContabil: rubricaContabil,
        id_extrato_principal: idExtratoPrincipal
    };
    console.log(data)
    fetch('/insercao/inserir-subextrato', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) throw new Error('Erro ao inserir subextrato');
            return response.json();
        })
        .then(async result => {
            alert(result.message);
            atualizarTabelaComSubextrato(idExtratoPrincipal); // Atualiza subextratos na tabela principal
            row.remove(); // Remove a linha de edição após confirmação
        })
        .catch(error => {
            console.error(error);
            alert('Erro ao inserir subextrato');
        });
}

function atualizarTabelaComSubextrato(idExtratoPrincipal) {

    // Função interna para formatar os valores no formato 2.300,30
    function formatarValorComPonto(valor) {
        if (!valor) return '0,00';
        return parseFloat(valor)
            .toFixed(2) // Garante duas casas decimais
            .replace('.', ',') // Substitui o ponto decimal por vírgula
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Adiciona os pontos como separadores de milhar
    }

    fetch(`/insercao/subextratos?idExtrato=${idExtratoPrincipal}`)
        .then(response => response.json())
        .then(data => {
            const tabela = document.getElementById('extrato-body');
            const extratoRow = tabela.querySelector(`tr[data-idextrato="${idExtratoPrincipal}"]`);

            if (!extratoRow) {
                console.error(`Linha do extrato com ID ${idExtratoPrincipal} não encontrada.`);
                return;
            }

            // Remove subextratos existentes logo após a linha do extrato
            let nextRow = extratoRow.nextElementSibling;
            while (nextRow && nextRow.classList.contains('subextrato-row')) {
                nextRow.remove();
                nextRow = extratoRow.nextElementSibling;
            }

            // Define o tipo de transação com base nos valores de entrada e saída
            const entradaCell = extratoRow.querySelector("td:nth-last-child(5)").textContent.trim();
            const saidaCell = extratoRow.querySelector("td:nth-last-child(4)").textContent.trim();
            const tipoTransacao = entradaCell ? 'ENTRADA' : saidaCell ? 'SAIDA' : '';

            // Calcula o valor principal
            const valorPrincipal = parseFloat((entradaCell || saidaCell).replace(/\./g, '').replace(',', '.')) || 0;

            let totalEntradas = 0;
            let totalSaidas = 0;

            // Soma os valores de entradas e saídas dos subextratos
            data.forEach(subextrato => {
                const valorSub = parseFloat(subextrato.VALOR) || 0;
                if (subextrato.TIPO_DE_TRANSACAO === 'ENTRADA') {
                    totalEntradas += valorSub;
                } else if (subextrato.TIPO_DE_TRANSACAO === 'SAIDA') {
                    totalSaidas += valorSub;
                }
            });

            // Verifica se há discrepância
            const discrepancia =
                (tipoTransacao === 'ENTRADA' && totalEntradas !== valorPrincipal) ||
                (tipoTransacao === 'SAIDA' && totalSaidas !== valorPrincipal);

            // Adiciona as linhas de subextrato com a verificação de discrepância
            data.forEach(subextrato => {
                const subRow = document.createElement('tr');
                subRow.dataset.subextrato = subextrato.ID_SUBEXTRATO;
                subRow.classList.add('subextrato-row');

                if (discrepancia) {
                    subRow.classList.add('erro-subextrato'); // Adiciona erro visual se houver discrepância
                }

                subRow.innerHTML = `
                    <td>${formatDate(subextrato.DATA)}</td>
                    <td>${subextrato.CATEGORIA || ''}</td>
                    <td>${subextrato.NOME_FORNECEDOR || ''}</td>
                    <td>${subextrato.OBSERVACAO || ''}</td>
                    <td>${subextrato.DESCRICAO || ''}</td>
                    <td>${subextrato.RUBRICA_CONTABIL || ''}</td>
                    <td class="text-right">${subextrato.TIPO_DE_TRANSACAO === 'ENTRADA' ? formatarValorComPonto(subextrato.VALOR) : ''}</td>
                    <td class="text-right">${subextrato.TIPO_DE_TRANSACAO === 'SAIDA' ? formatarValorComPonto(subextrato.VALOR) : ''}</td>
                    <td></td>
                    <td>
                        <button onclick="abrirPopupAnexos(${subextrato.ID_SUBEXTRATO})">
                            <i class="fa fa-paperclip"></i>
                        </button>
                    </td>   
                    <td>
                        <button onclick="editarSubextrato(${subextrato.ID_SUBEXTRATO}, this)" class="edit-btn-extrato-opcoes">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deletarSubextrato(${subextrato.ID_SUBEXTRATO}, this)" class="delete-btn-extrato-opcoes">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;

                // Insere a nova linha de subextrato logo após a linha do extrato principal
                extratoRow.insertAdjacentElement('afterend', subRow);
            });

            // Aplica a classe de erro na linha principal, se houver discrepância
            if (discrepancia) {
                extratoRow.classList.add('erro-principal');
            } else {
                extratoRow.classList.remove('erro-principal');
            }

        })
        .catch(error => {
            console.error('Erro ao atualizar subextratos:', error);
        });
}

function cancelarSubextrato(buttonElement) {
    const row = buttonElement.closest('tr');

    // Verifica se a linha é uma linha de subextrato adicionada dinamicamente
    if (row.classList.contains('subextrato-row')) {
        // Remove a linha do DOM
        row.remove();
    } else {
        // Caso contrário, restaura os dados originais
        const originalData = JSON.parse(row.dataset.originalData);
        const cells = row.querySelectorAll('td');

        cells.forEach((cell, index) => {
            cell.textContent = originalData[index];
        });

        const ferramentasCell = cells[cells.length - 1];
        ferramentasCell.innerHTML = row.dataset.originalButtons;
    }
}

function abrirLinhaSubextrato(buttonElement) {
    const row = buttonElement.closest('tr');
    const idExtratoPrincipal = row.dataset.idextrato;

    adicionarLinhaSubextrato(idExtratoPrincipal, row);
}

function editarSubextrato(idSubextrato, buttonElement) {
    const row = buttonElement.closest('tr');
    const cells = row.querySelectorAll('td');
    row.dataset.originalData = JSON.stringify(
        Array.from(cells).map(cell => cell.textContent.trim())
    );

    cells.forEach((cell, index) => {
        if (index === 0) { // Data
            const dataAtual = cell.textContent.trim();
            const inputData = document.createElement('input');
            inputData.type = 'date';
            inputData.value = dataAtual.split('/').reverse().join('-'); // Ajusta o formato da data
            cell.innerHTML = '';
            cell.appendChild(inputData);
        } else if (index === 1) { // Categoria
            const categoriaAtual = cell.textContent.trim();
            const selectCategoria = document.createElement('select');
            selectCategoria.classList.add('styled-select');
            selectCategoria.style.width = '100%';

            // Buscar categorias
            fetch(`/insercao/dados-categoria?idcliente=${IDCLIENTE}`)
                .then(response => response.json())
                .then(categorias => {
                    const optionDefault = document.createElement('option');
                    optionDefault.value = '';
                    optionDefault.textContent = 'Selecione uma Rubrica';
                    selectCategoria.appendChild(optionDefault);

                    const categoriasTree = construirArvoreDeCategorias(categorias);
                    adicionarCategoriasAoSelect(selectCategoria, categoriasTree);

                    const categoriaSelecionada = Array.from(selectCategoria.options).find(option => option.text.trim() === categoriaAtual);
                    if (categoriaSelecionada) {
                        categoriaSelecionada.selected = true;
                    }

                    cell.innerHTML = '';
                    cell.appendChild(selectCategoria);
                })
                .catch(error => {
                    console.error('Erro ao buscar categorias:', error);
                });
        } else if (index === 2) { // Fornecedor
            const fornecedorAtual = cell.textContent.trim();
            const selectFornecedor = document.createElement('select');
            selectFornecedor.classList.add('styled-select');
            selectFornecedor.style.width = '100%';

            // Buscar fornecedores
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

                    const fornecedorSelecionado = Array.from(selectFornecedor.options).find(option => option.text.trim() === fornecedorAtual);
                    if (fornecedorSelecionado) {
                        fornecedorSelecionado.selected = true;
                    }

                    cell.innerHTML = '';
                    cell.appendChild(selectFornecedor);
                })
                .catch(error => {
                    console.error('Erro ao buscar fornecedores:', error);
                });
        } else if (index === 3) { // Observação
            const observacaoAtual = cell.textContent.trim();
            cell.innerHTML = `<input type="text" value="${observacaoAtual}" class="editavel" style="width: 100%;">`;
        } else if (index === 4) { // Descrição
            const descricaoAtual = cell.textContent.trim();
            cell.innerHTML = `<input type="text" value="${descricaoAtual}" class="editavel" style="width: 100%;">`;
        } else if (index === 5) { // Rubrica Contábil
            const rubricaContabilAtual = cell.textContent.trim();
            const selectRubricaContabil = document.createElement('select');
            selectRubricaContabil.classList.add('styled-select');
            selectRubricaContabil.style.width = '100%';

            // Buscar rubricas contábeis
            fetch(`/insercao/listar-rubricas-contabeis`)
                .then(response => response.json())
                .then(rubricasContabeis => {
                    const optionDefault = document.createElement('option');
                    optionDefault.value = '';
                    optionDefault.textContent = 'Selecione uma Rubrica Contábil';
                    selectRubricaContabil.appendChild(optionDefault);

                    rubricasContabeis.forEach(rubrica => {
                        const option = document.createElement('option');
                        option.value = rubrica.IDRUBRICA;
                        option.textContent = rubrica.NOME;
                        selectRubricaContabil.appendChild(option);
                    });

                    const rubricaSelecionada = Array.from(selectRubricaContabil.options).find(option => option.text.trim() === rubricaContabilAtual);
                    if (rubricaSelecionada) {
                        rubricaSelecionada.selected = true;
                    }

                    cell.innerHTML = '';
                    cell.appendChild(selectRubricaContabil);
                })
                .catch(error => {
                    console.error('Erro ao buscar rubricas contábeis:', error);
                });
        } else if (index > 5 && index < 8) { // Entrada ou Saída
            const valorAtual = cell.textContent.trim() === '0' ? '' : cell.textContent.trim(); // Se o valor for '0', deixa em branco
            cell.innerHTML = `<input type="text" value="${valorAtual}" class="editavel">`;

            const input = cell.querySelector('input');
            input.style.width = '100%';


            if (index === 6 || index === 7) { // Formatar entrada e saída
                input.addEventListener('input', function () {
                    this.value = formatarValorFinanceiroInput(this.value);
                });
            }
        }
    });

    const ferramentasCell = cells[cells.length - 1];
    ferramentasCell.innerHTML = `
        <button onclick="confirmarEdicaoSubextrato(${idSubextrato}, this)" class="confirmar-btn">
            <i class="fas fa-check"></i>
        </button>
        <button onclick="cancelarEdicaoSubextrato(this)" class="cancelar-btn">
            <i class="fas fa-times"></i>
        </button>
    `;
}

function confirmarEdicaoSubextrato(idSubextrato, buttonElement) {
    const row = buttonElement.closest('tr');
    const cells = row.querySelectorAll('td');

    // Obter o idExtratoPrincipal a partir do dataset
    const idExtratoPrincipal = row.dataset.idextratoprincipal;

    const dadosEditados = {
        idSubextrato: idSubextrato,
        data: cells[0].querySelector('input') ? cells[0].querySelector('input').value : '',
        categoria: cells[1].querySelector('select')
            ? (cells[1].querySelector('select').selectedOptions[0]?.text.trim() || '')
            : '',
        fornecedor: cells[2].querySelector('select')
            ? (cells[2].querySelector('select').selectedOptions[0]?.text.trim() || '')
            : '',
        observacao: cells[3].querySelector('input') ? cells[3].querySelector('input').value.trim() || '' : '',
        descricao: cells[4].querySelector('input') ? cells[4].querySelector('input').value.trim() || '' : '',
        rubricaContabil: cells[5].querySelector('select')
            ? (cells[5].querySelector('select').selectedOptions[0]?.text.trim() || '')
            : '',
        entrada: cells[6].querySelector('input')
            ? (cells[6].querySelector('input').value === '0,00' ? '' : parseFloat(cells[6].querySelector('input').value.replace(/\./g, '').replace(',', '.')) || '')
            : '',
        saida: cells[7].querySelector('input')
            ? (cells[7].querySelector('input').value === '0,00' ? '' : parseFloat(cells[7].querySelector('input').value.replace(/\./g, '').replace(',', '.')) || '')
            : ''
    };

    // Chamada à API para salvar a edição do subextrato
    fetch('/insercao/editar-subextrato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosEditados)
    })
        .then(response => {
            if (!response.ok) throw new Error('Erro ao editar subextrato');
            return response.json();
        })
        .then(result => {
            alert(result.message);

            // Remove a linha editada antes de atualizar a tabela
            row.remove();

            // Atualiza a tabela completa com os subextratos atualizados
            atualizarTabelaComSubextrato(idExtratoPrincipal);
        })
        .catch(error => {
            console.error(error);
            alert('Erro ao editar subextrato');
        });
}

function cancelarEdicaoSubextrato(buttonElement) {
    const row = buttonElement.closest('tr');
    const originalData = JSON.parse(row.dataset.originalData);
    const cells = row.querySelectorAll('td');
    originalData.forEach((text, index) => {
        cells[index].textContent = text;
    });
}

function popularSelectCategoria(selectElement) {
    fetch(`/insercao/dados-categoria?idcliente=${IDCLIENTE}`)
        .then(response => response.json())
        .then(categorias => {
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.IDCATEGORIA;
                option.textContent = categoria.NOME;
                selectElement.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao buscar categorias:', error));
}

function popularSelectFornecedor(selectElement) {
    fetch(`/fornecedor/listar?idcliente=${IDCLIENTE}`)
        .then(response => response.json())
        .then(fornecedores => {
            fornecedores.forEach(fornecedor => {
                const option = document.createElement('option');
                option.value = fornecedor.IDFORNECEDOR;
                option.textContent = fornecedor.NOME_TIPO;
                selectElement.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao buscar fornecedores:', error));
}

function popularSelectRubricaContabil(selectElement) {
    fetch(`/insercao/listar-rubricas-contabeis`)
        .then(response => response.json())
        .then(rubricasContabeis => {
            rubricasContabeis.forEach(rubrica => {
                const option = document.createElement('option');
                option.value = rubrica.IDRUBRICA;
                option.textContent = rubrica.NOME;
                selectElement.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao buscar rubricas contábeis:', error));
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

async function fetchSaldoFinal() {
    const idBancoElement = document.getElementById('seletorBanco');
    const idBanco = IDBANCO || (idBancoElement ? idBancoElement.value : null);

    if (!idBanco) {
        console.error('Banco não selecionado ou elemento não encontrado.');
        return;
    }

    const mesAno = document.getElementById('mesSelectorValue').value;
    const dataFormatada = formatDateToFirstOfMonth(mesAno);


    try {
        // Pega o saldo inicial
        const saldoInicial = await fetchSaldoInicial();

        // Busca os dados diretamente do servidor
        const response = await fetch(`/consulta/dados?banco=${idBanco}&data=${dataFormatada}&empresa=${idEmpresa}`);
        const data = await response.json();

        let saldoFinal = saldoInicial;

        // Percorre os dados e calcula o saldo final
        data.forEach(item => {
            const valor = parseFloat(item.VALOR) || 0;
            if (item.TIPO_DE_TRANSACAO === 'ENTRADA') {
                saldoFinal += valor;
            } else if (item.TIPO_DE_TRANSACAO === 'SAIDA') {
                saldoFinal -= valor;
            }
        });


        // Atualiza a interface com o saldo final
        const saldoFinalTable = document.getElementById('saldoFinalTable').querySelector('tbody');
        saldoFinalTable.innerHTML = '';
        const rowFinal = saldoFinalTable.insertRow();
        rowFinal.insertCell().textContent = formatarValorNumerico(saldoFinal);

        // Define o saldo inicial para o próximo mês
        definirSaldoInicialProximoMes(saldoFinal);

    } catch (error) {
        console.error('Erro ao calcular o saldo final:', error);
    }
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
            // Só define o saldo se definidoManual for false
            if (data.definidoManual === false || data.definidoManual === 0) {
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
            } else {
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
    const urlDeEdicao = `/consulta/editar/extratoLink?id=${idExtrato}`;

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
    const overlay = document.getElementById('anexo-overlay');
    const anexoContent = document.getElementById('anexo-content');
    anexoContent.innerHTML = ''; // Limpa conteúdo anterior

    // Chama os anexos via fetch e abre o popup
    fetch(`/insercao/anexos?idExtrato=${idExtrato}`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                anexoContent.innerHTML = '<p>Sem anexos</p>';
            } else {
                data.forEach(anexo => {
                    const container = document.createElement('div');
                    container.classList.add('anexo-container');

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
                        img.classList.add('preview-image');
                    } else {
                        img.src = '/paginaInsercao/imagens/unknownFile.png';
                    }

                    link.appendChild(img);

                    const infoContainer = document.createElement('div');
                    infoContainer.classList.add('anexo-info');

                    const text = document.createElement('span');

                    // Limita o nome do arquivo a 6 caracteres mais a extensão
                    const nomeArquivo = anexo.NOME_ARQUIVO;
                    const limite = 6;
                    const ext = nomeArquivo.slice(nomeArquivo.lastIndexOf('.')); // Pega a extensão
                    const nomeCortado = nomeArquivo.length > limite + ext.length ? nomeArquivo.slice(0, limite) + '...' + ext : nomeArquivo;

                    text.textContent = nomeCortado; // Nome cortado exibido
                    text.classList.add('anexo-text');

                    const tipoText = document.createElement('span');
                    tipoText.textContent = anexo.TIPO_EXTRATO_ANEXO;
                    tipoText.classList.add('anexo-tipo');

                    infoContainer.appendChild(text);
                    infoContainer.appendChild(tipoText);
                    container.appendChild(link);
                    container.appendChild(infoContainer);

                    anexoContent.appendChild(container);
                });
            }
            popup.style.display = 'flex'; // Mostra o popup
            overlay.style.display = 'block'; // Mostra o fundo escuro
        })
        .catch(error => {
            console.error('Erro ao carregar anexos:', error);
            anexoContent.innerHTML = '<p>Erro ao carregar anexos</p>';
            popup.style.display = 'flex';
            overlay.style.display = 'block';
        });
}

function fecharPopup() {
    document.getElementById('anexo-popup').style.display = 'none';
    document.getElementById('anexo-overlay').style.display = 'none';
}


function uploadAnexo() {
    const formData = new FormData();
    const anexoFile = document.getElementById('anexoFile').files[0];
    const idExtrato = document.getElementById('idExtratoAnexo').value;
    const tipoExtratoAnexo = document.getElementById('tipoExtratoAnexo').value; // Novo campo de dropdown

    formData.append('anexo', anexoFile);
    formData.append('idExtrato', idExtrato);
    formData.append('tipoExtratoAnexo', tipoExtratoAnexo);

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
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
}

document.addEventListener('DOMContentLoaded', function() {
    initializePageConsulta();
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
async function processarExtrato(nomeBanco) {
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
            if (nomeBanco.toLowerCase().includes('banco do brasil')) {
                // Banco do Brasil
                const linhasExtrato = data.some(item => item.includes("BB Cash - Conta corrente - Consulta autorizaveis - Extrato de conta corrente" || "Consultas - Extrato de conta corrente"))
                    ? processarDadosDoExtratoBancoDoBrasil(data)
                    : processarDadosDoExtratoBancoDoBrasil2(data);
                mostrarExtratoPopup(linhasExtrato);

            } else if (nomeBanco.toLowerCase().includes('itau')) {
                // Itaú
                const linhasExtrato = data.some(item => item.includes("Total contratado. O uso do Limite da Conta e Limite da Conta adicional poderá ter cobrança de juros + IOF."))
                    ? processarDadosDoExtratoItauPersonalite(data)
                    : processarDadosDoExtratoItau(data);
                mostrarExtratoPopup(linhasExtrato);

            } else if (nomeBanco.toLowerCase().includes('bradesco')) {
                // Bradesco
                const linhasExtrato = data.some(item => item.includes("Bradesco Internet Banking"))
                    ? processarDadosDoExtratoBradesco1(data)
                    : processarDadosDoExtratoBradesco2(data);
                mostrarExtratoPopup(linhasExtrato);

            } else if (nomeBanco.toLowerCase().includes('mercado pago')) {
                // Mercado Pago
                const linhasExtrato = data.some(item => item.includes("DETALHE DOS MOVIMENTOS"))
                    ? processarDadosDoExtratoMercadoPago1(data)
                    : processarDadosDoExtratoMercadoPago2(data);
                mostrarExtratoPopup(linhasExtrato);

            } else if (nomeBanco.toLowerCase().includes('stone')) {
                // Stone
                const linhasExtrato = processarDadosDoExtratoStone(data);
                mostrarExtratoPopup(linhasExtrato);

            } else if (nomeBanco.toLowerCase().includes('sicoob')) {
                // Sicoob
                const linhasExtrato = processarDadosDoExtratoSicoob(data);
                mostrarExtratoPopup(linhasExtrato);

            } else if (nomeBanco.toLowerCase().includes('santander')) {
                // Santander
                const linhasExtrato = data.some(item => item.includes("Internet Banking Empresarial"))
                    ? processarDadosSantander2(data) // Se for "Internet Banking Empresarial"
                    : processarDadosDoExtratoBancoDoSantander(data); // Outros formatos do Santander
                mostrarExtratoPopup(linhasExtrato);
            } else if (nomeBanco.toLowerCase().includes('sicredi')) {
                const linhasExtrato = processarDadosSicredi(data);
                mostrarExtratoPopup(linhasExtrato);
            } else if (nomeBanco.toLowerCase().includes('nubank')) {
                const linhasExtrato = processarDadosNubank(data);
                mostrarExtratoPopup(linhasExtrato);
            } else if (nomeBanco.toLowerCase().includes('c6')) {
                const linhasExtrato = processarDadosC6(data);
                mostrarExtratoPopup(linhasExtrato);
            } else if (nomeBanco.toLowerCase().includes('caixa')) {
                const linhasExtrato = processarCartoesCaixa(data);
                mostrarExtratoPopup(linhasExtrato);
            }
            else {
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

//c6
function processarDadosC6(data) {
    const extrato = [];
    const dateRegex = /^(\d{2}) ([a-z]{3})$/i;
    const valueRegex = /^\d{1,3}(?:\.\d{3})*,\d{2}$/;
    const meses = {
        "jan": "01", "fev": "02", "mar": "03", "abr": "04",
        "mai": "05", "jun": "06", "jul": "07", "ago": "08",
        "set": "09", "out": "10", "nov": "11", "dez": "12"
    };

    let capturando = false;
    let anoAtual = "2024"; // Ajuste se necessário

    for (let i = 0; i < data.length; i++) {
        const text = data[i].trim();

        if (text.includes("Subtotal deste cartão")) {
            capturando = true;
            continue;
        }

        if (text.includes("Formas de pagamento")) {
            break;
        }

        const match = text.match(dateRegex);
        if (capturando && match) {
            let dia = match[1];
            let mes = meses[match[2].toLowerCase()] || "01";
            let dataFormatada = `${dia}/${mes}/${anoAtual}`;

            let descricao = data[i + 2]?.trim();
            let valor = data[i + 4]?.trim();

            let tipo = "saida";
            if (descricao && descricao.toLowerCase().includes("inclusao de pagamento")) {
                tipo = "entrada";
            }

            if (descricao && valor.match(valueRegex)) {
                extrato.push({
                    data: dataFormatada,
                    descricao: descricao,
                    valor: valor,
                    tipo: tipo
                });
                i += 4;
            }
        }
    }

    return extrato;
}

//nubank
function processarDadosNubank(data) {
    const resultado = [];
    let currentDate = "";
    // Regex para identificar datas no formato "DD MÊS AAAA" (ex.: "03 DEZ 2024")
    const dateRegex = /^[0-9]{1,2}\s+[A-ZÀ-Ú]{3,}\s+\d{4}$/;
    // Regex para identificar valores monetários: aceita valores inteiros ou com decimais (ex.: "2", "172,00", "+ 15.814,00")
    const moneyRegex = /^[+\-]?\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?$/;

    // Palavras-chave que indicam o início de uma transação
    const transactionKeywords = [
        "Transferência enviada",
        "Transferência recebida",
        "Transferência Recebida",
        "Pagamento de boleto efetuado",
        "Depósito recebido",
        "Pagamento de fatura",
        "Compra no débito"
    ];

    // Função para formatar datas de "DD MÊS AAAA" para "DD/MM/AAAA"
    function formatarData(dataStr) {
        const tokens = dataStr.split(" ").filter(t => t.trim() !== "");
        let day, month, year;
        if (tokens.length === 3) {
            [day, month, year] = tokens;
        } else {
            // Exemplo: "01 DE DEZEMBRO DE 2024"
            day = tokens[0];
            year = tokens[tokens.length - 1];
            month = tokens.find(token => {
                const upper = token.toUpperCase();
                return upper === "JAN" || upper === "JANEIRO" ||
                    upper === "FEV" || upper === "FEVEREIRO" ||
                    upper === "MAR" || upper === "MARÇO" || upper === "MARCO" ||
                    upper === "ABR" || upper === "ABRIL" ||
                    upper === "MAI" || upper === "MAIO" ||
                    upper === "JUN" || upper === "JUNHO" ||
                    upper === "JUL" || upper === "JULHO" ||
                    upper === "AGO" || upper === "AGOSTO" ||
                    upper === "SET" || upper === "SETEMBRO" ||
                    upper === "OUT" || upper === "OUTUBRO" ||
                    upper === "NOV" || upper === "NOVEMBRO" ||
                    upper === "DEZ" || upper === "DEZEMBRO";
            });
            if (!month) {
                month = tokens[1]; // fallback
            }
        }
        month = month.toUpperCase();
        const monthMap = {
            'JAN': '01',
            'JANEIRO': '01',
            'FEV': '02',
            'FEVEREIRO': '02',
            'MAR': '03',
            'MARÇO': '03',
            'MARCO': '03',
            'ABR': '04',
            'ABRIL': '04',
            'MAI': '05',
            'MAIO': '05',
            'JUN': '06',
            'JUNHO': '06',
            'JUL': '07',
            'JULHO': '07',
            'AGO': '08',
            'AGOSTO': '08',
            'SET': '09',
            'SETEMBRO': '09',
            'OUT': '10',
            'OUTUBRO': '10',
            'NOV': '11',
            'NOVEMBRO': '11',
            'DEZ': '12',
            'DEZEMBRO': '12'
        };
        const mesFormatado = monthMap[month] || month;
        if (day.length === 1) day = '0' + day;
        return `${day}/${mesFormatado}/${year}`;
    }

    for (let i = 0; i < data.length; i++) {
        let text = data[i].trim();
        if (!text) continue; // pula linhas vazias

        // Se for uma data, atualiza a variável currentDate formatada
        if (dateRegex.test(text)) {
            currentDate = formatarData(text);
            continue;
        }

        // Ignora marcadores e cabeçalhos que não fazem parte de transações
        if (
            text === "Total de entradas" ||
            text === "Total de saídas" ||
            text === "Saldo do dia" ||
            text === "VALORES EM $" ||
            text === "CNPJ" ||
            text === "Agência" ||
            text === "Conta" ||
            text === "a"
        ) {
            if (i + 1 < data.length && moneyRegex.test(data[i + 1].trim())) {
                i++;
            }
            continue;
        }

        // Verifica se a linha inicia com alguma das palavras-chave definidas para transação
        const isTransaction = transactionKeywords.some(keyword =>
            text.startsWith(keyword)
        );
        if (isTransaction) {
            let linhaAtual = { data: currentDate, descricao: text, valor: null, tipo: null };

            // Define o tipo da transação
            if (text.includes("recebida") || text.includes("Depósito") || text.includes("Recebida")) {
                linhaAtual.tipo = "entrada";
            } else if (text.includes("enviada") || text.includes("Pagamento") || text.includes("Compra")) {
                linhaAtual.tipo = "saida";
            }

            // Acumula linhas adicionais na descrição até encontrar um valor ou outro marcador
            let descricaoExtra = "";
            while (i + 1 < data.length) {
                let prox = data[i + 1].trim();
                if (!prox) {
                    i++;
                    continue;
                }
                if (
                    moneyRegex.test(prox) ||
                    dateRegex.test(prox) ||
                    transactionKeywords.some(keyword => prox.startsWith(keyword)) ||
                    prox === "Total de entradas" ||
                    prox === "Total de saídas" ||
                    prox === "Saldo do dia"
                ) {
                    break;
                }
                descricaoExtra += " " + prox;
                i++;
            }
            linhaAtual.descricao += descricaoExtra;

            // Verifica se a próxima linha é um valor monetário
            if (i + 1 < data.length && moneyRegex.test(data[i + 1].trim())) {
                let candidate = data[i + 1].trim();
                // Se o candidato for muito curto (por exemplo, "2") e a linha seguinte tiver vírgula, usa a linha seguinte
                if (candidate.length <= 2 && i + 2 < data.length && moneyRegex.test(data[i + 2].trim()) && data[i + 2].includes(',')) {
                    i += 2;
                    linhaAtual.valor = data[i].trim();
                } else {
                    i++;
                    linhaAtual.valor = candidate;
                }
            }
            resultado.push(linhaAtual);
        }
    }
    return resultado;
}

//sicredi
function processarDadosSicredi(data) {
    const extrato = [];
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    const valueRegex = /^-?\d{1,3}(?:\.\d{3})*,\d{2}$/;
    let linhaAtual = null;
    let capturandoDescricao = false;
    let capturandoValor = false;    let proximoEhValor = false;
    let ignorarProximo = false;

    for (let i = 0; i < data.length; i++) {
        const text = data[i].trim();

        if (text.match(dateRegex)) {
            if (linhaAtual && linhaAtual.valor !== null) {
                extrato.push(linhaAtual);
            }
            linhaAtual = { data: text, descricao: '', valor: null, tipo: null };
            capturandoDescricao = true;
            capturandoValor = false;
            ignorarProximo = false;
        }
        else if (linhaAtual && capturandoDescricao) {
            if (text === '') {
                continue; // Pula o espaço vazio após a data
            }
            linhaAtual.descricao = text.replace(/\d+/g, '').trim();
            capturandoDescricao = false;
            ignorarProximo = true;
        }
        else if (ignorarProximo) {
            ignorarProximo = false;
            proximoEhValor = true;
        }
        else if (linhaAtual && proximoEhValor && text.match(valueRegex)) {
            const valorNumerico = parseFloat(text.replace(/\./g, '').replace(',', '.'));
            linhaAtual.valor = Math.abs(valorNumerico).toFixed(2).replace('.', ',');
            linhaAtual.tipo = valorNumerico < 0 ? 'saida' : 'entrada';
            proximoEhValor = false;
        }
    }

    if (linhaAtual && linhaAtual.valor !== null) {
        extrato.push(linhaAtual);
    }

    return extrato;
}

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

function processarDadosSantander2(data) {
    const extrato = [];
    const dateRegex = /\d{2}\/\d{2}\/\d{4}/; // Regex para datas
    const valueRegex = /\d{1,3}(\.\d{3})*,\d{2}/; // Regex para valores numéricos

    let linhaAtual = null;

    for (let i = 0; i < data.length; i++) {
        const text = data[i].trim();

        if (text.match(dateRegex)) {
            // Inicia uma nova linha para a data
            if (linhaAtual && linhaAtual.data && linhaAtual.descricao && linhaAtual.valor) {
                extrato.push(linhaAtual);
            }

            linhaAtual = {
                data: text,
                descricao: '',
                valor: null,
                tipo: null,
            };
        } else if (linhaAtual && text === "-" && data[i + 1]?.trim() === "R") {
            // Marca como saída se "-" estiver imediatamente antes do "R$"
            linhaAtual.tipo = "saida";
        } else if (text === "Saldo do dia") {
        // Ignora a linha quando for "Saldo do dia"
        linhaAtual = null;
        } else if (linhaAtual && valueRegex.test(text)) {
            // Captura o valor e formata no estilo brasileiro
            const valorStr = text.replace(/\./g, '').replace(',', '.');
            linhaAtual.valor = parseFloat(valorStr).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

            // Define como entrada se ainda não foi marcado como saída
            if (!linhaAtual.tipo) {
                linhaAtual.tipo = "entrada";
            }
        } else if (linhaAtual && text) {
            // Captura a descrição e limpa símbolos e códigos indesejados
            linhaAtual.descricao += ` ${text}`.trim();
            linhaAtual.descricao = linhaAtual.descricao
                .replace(/R\$||-/g, '') // Remove "R$", "", "-" da descrição
                .trim();
        }
    }

    // Adiciona a última linha válida
    if (linhaAtual && linhaAtual.data && linhaAtual.descricao && linhaAtual.valor) {
        extrato.push(linhaAtual);
    }

    return extrato;
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

    for (let i = 0; i < data.length; i++) {
        const text = data[i].trim();

        if (text.match(saldoAnteriorRegex)) {
            coletandoDescricoes = false;
            continue;
        }

        if (coletandoDescricoes) {
            descricoes.unshift(text); // Coletar as descrições em ordem reversa para corrigi-la
        } else {
            if (text.match(dateRegex)) {
                if (ignorarPrimeiraData) {
                    ignorarPrimeiraData = false; // Desativa a flag após ignorar a primeira data
                    continue;
                }

                transacoes.push({
                    data: text,
                    descricao: descricoes[descricaoIndex++] || '',
                    valores: []
                });
            } else if (text.match(valueRegex)) {
                if (transacoes.length > 0) {
                    transacoes[transacoes.length - 1].valores.push(parseFloat(text.replace(/\./g, '').replace(',', '.')));
                }
            }
        }
    }

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


    return extrato.slice(0, descricoes.length);
}
function processarDadosDoExtratoBradesco2(data) {
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
    const dateRegex = /\d{2}\/\d{2}\/\d{4}/; // Regex para datas
    const valueRegex = /-?\d{1,3}(\.\d{3})*,\d{2} [CD]/; // Regex para valores
    const saldoRegex = /saldo anterior/i; // Regex para identificar saldo anterior
    const finalizacaoExtratoRegex = /S A L D O/i; // Regex para identificar fim do extrato

    let dentroDoIntervaloSaldo = false;
    let linhaAtual = null;
    let ultimaData = null; // Guarda a última data processada
    let encontrouValor = false; // Marca se já encontrou um valor no dia

    for (let i = 0; i < data.length; i++) {
        const text = data[i].trim();

        if (text.match(finalizacaoExtratoRegex)) {
            break; // Fim do extrato
        }

        if (text.match(saldoRegex)) {
            dentroDoIntervaloSaldo = true; // Começa após o saldo anterior
            continue;
        }

        if (dentroDoIntervaloSaldo) {
            if (text.match(dateRegex)) {
                // Nova data
                if (linhaAtual && linhaAtual.data && linhaAtual.descricao && linhaAtual.valor) {
                    extrato.push(linhaAtual);
                }

                // Inicia uma nova transação
                ultimaData = text;
                linhaAtual = {
                    data: text,
                    descricao: '',
                    valor: null,
                    tipo: null
                };
                encontrouValor = false; // Reseta o controle de valores para o novo dia
            } else if (text.match(valueRegex) && linhaAtual) {
                // Captura o valor e o tipo (C ou D)
                const valorStr = text.slice(0, -2).replace(/\./g, '').replace(',', '.');
                const tipo = text.endsWith('C') ? 'entrada' : 'saida';

                // Se já encontrou um valor no dia, verifica se é o saldo final
                if (encontrouValor && linhaAtual.data === ultimaData) {
                    continue; // Ignora o saldo final
                }

                // Registra o valor atual e formata no estilo brasileiro
                linhaAtual.valor = formatarValorFinanceiro(parseFloat(valorStr));
                linhaAtual.tipo = tipo;
                encontrouValor = true; // Marca que encontrou um valor
            } else if (linhaAtual && !text.match(/^\d+$/)) {
                // Limpa números/códigos antes da descrição
                const descricaoLimpa = text.replace(/^\d{3,}.*?\s/, ''); // Remove códigos longos no início
                linhaAtual.descricao += ` ${descricaoLimpa}`.trim();
            }
        }
    }

    // Adiciona a última linha válida
    if (linhaAtual && linhaAtual.data && linhaAtual.descricao && linhaAtual.valor) {
        extrato.push(linhaAtual);
    }

    return extrato.filter(linha => linha.data && linha.descricao && linha.valor !== null);
}
function formatarValorFinanceiro(valor) {
    return valor
        .toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
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
    const epochStart = (excelDate - 25569) * 86400 * 1000; // Converter para milissegundos
    const date = new Date(epochStart); // Criar objeto Date

    const day = String(date.getUTCDate()).padStart(2, '0'); // Dia (sem UTC)
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Mês (sem UTC)
    const year = date.getUTCFullYear(); // Ano
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

function processarCartoesCaixa(data) {
    const extrato = [];
    const dateRegex = /^(\d{2})\/(\d{2})$/; // Captura datas no formato dd/mm (ex: 19/10)
    const valueRegex = /^(\d{1,3}(?:\.\d{3})*,\d{2})([DC])$/; // Captura valores seguidos de D ou C

    let capturando = false;
    let anoAtual = "2024"; // Definir ano apropriado

    for (let i = 0; i < data.length; i++) {
        const text = data[i].trim();

        if (text.includes("Demonstrativo")) {
            capturando = true;
            continue;
        }

        if (!capturando) continue;

        if (text.includes("Total final") || text.includes("Valor total desta fatura")) {
            break;
        }

        if (text.match(dateRegex)) {
            let [_, dia, mes] = text.match(dateRegex);
            let dataFormatada = `${dia}/${mes}/${anoAtual}`;

            let descricao = data[i + 2]?.trim();
            let cidade = data[i + 4]?.trim();
            let valorMatch = data[i + 6]?.trim().match(valueRegex);

            if (valorMatch) {
                let valor = valorMatch[1]; // Valor numérico
                let tipo = valorMatch[2] === "D" ? "saida" : "entrada"; // Define se é saída ou entrada

                extrato.push({
                    data: dataFormatada,
                    descricao: descricao,
                    valor: valor,
                    tipo: tipo
                });

                i += 6; // Avança para evitar capturas erradas
            }
        }
    }

    return extrato;
}

//extratoTemplate

function processarDadosDoExcelTemplate(jsonData) {
    const linhasExtrato = jsonData.slice(1).map(row => {
        const isEmptyRow = row.every(cell => cell === undefined || cell === null || cell === '');

        if (isEmptyRow) {
            return null;
        }

        // Função auxiliar para extrair o valor real de uma célula
        const extrairValorCelula = (cell) => {
            if (typeof cell === 'object' && cell.v !== undefined) {
                return cell.v; // Valor real da célula
            }
            return cell || ''; // Retorna o valor diretamente se não for um objeto
        };

        // Formatar os campos conforme a estrutura do Excel
        const dataFormatada = row[0] ? excelDateToJSDate(extrairValorCelula(row[0])) : ''; // Data
        const categoria = extrairValorCelula(row[1]); // Categoria
        const fornecedor = extrairValorCelula(row[2]); // Fornecedor
        const descricao = extrairValorCelula(row[3]); // Descrição
        const nome = extrairValorCelula(row[4]); // Nome
        const rubricaContabil = extrairValorCelula(row[5]); // Rubrica Contábil

        // Verificar se o valor é de entrada ou saída
        const valorEntrada = row[6] !== undefined && row[6] !== null && row[6] !== '' ? formatarValorFinanceiro(row[6]) : '';
        const valorSaida = row[7] !== undefined && row[7] !== null && row[7] !== '' ? formatarValorFinanceiro(row[7]) : '';

        // Determinar se a linha é de entrada ou saída
        const tipo = valorEntrada ? 'entrada' : (valorSaida ? 'saida' : '');
        return {
            data: dataFormatada,
            categoria: categoria,
            fornecedor: fornecedor,
            descricao: descricao,
            nome: nome,
            rubricaContabil: rubricaContabil,
            tipo: tipo,
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

        // Função para normalizar texto
        function normalizarTexto(texto) {
            if (typeof texto !== 'string') return '';
            return texto
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();
        }

        // Criar dropdown customizado com pesquisa dinâmica
        function criarDropdownCustomizado(valorInicial, selectModel, tipo) {
            const container = document.createElement("div");
            container.classList.add("custom-select-container");
            container.dataset.tipo = tipo; // 🔹 Identifica se é Rubrica ou Fornecedor

            const selected = document.createElement("div");
            selected.classList.add("selected");
            selected.textContent = valorInicial || "Selecione uma opção";

            const optionsContainer = document.createElement("div");
            optionsContainer.classList.add("options-container");

            const searchBox = document.createElement("input");
            searchBox.type = "text";
            searchBox.classList.add("search-box");
            searchBox.placeholder = "Digite para buscar...";

            const optionsList = document.createElement("div");
            optionsList.classList.add("options-list");

            // Criar opções baseadas no select original
            Array.from(selectModel.options).forEach(option => {
                const optionDiv = document.createElement("div");
                optionDiv.classList.add("option");
                optionDiv.textContent = option.textContent;

                optionDiv.addEventListener("click", () => {
                    selected.textContent = optionDiv.textContent;
                    optionsContainer.classList.remove("active");
                });

                optionsList.appendChild(optionDiv);
            });

            optionsContainer.appendChild(searchBox);
            optionsContainer.appendChild(optionsList);
            container.appendChild(selected);
            container.appendChild(optionsContainer);

            // Toggle de exibição
            selected.addEventListener("click", (event) => {
                optionsContainer.classList.toggle("active");
                searchBox.value = "";
                filtrarOpcoes("", optionsList);
                searchBox.focus();
                event.stopPropagation(); // Evita fechar imediatamente ao abrir
            });

            // Fechar ao clicar fora
            document.addEventListener("click", (event) => {
                if (!container.contains(event.target)) {
                    optionsContainer.classList.remove("active");
                }
            });

            // Filtrar opções com base no input
            searchBox.addEventListener("keyup", function(e) {
                const searchTerm = e.target.value;
                filtrarOpcoes(searchTerm, optionsList);

                // Verifica se a opção não existe
                if (!existeOpcao(searchTerm, optionsList)) {
                    const addOptionDiv = document.createElement("div");
                    addOptionDiv.classList.add("option", "add-new-option");
                    addOptionDiv.textContent = `Adicionar "${searchTerm}"`;

                    addOptionDiv.addEventListener("click", () => {
                        abrirPopupOpcao(tipo);
                        optionsContainer.classList.remove("active");
                    });

                    // Remove qualquer opção de "Adicionar" antiga antes de adicionar a nova
                    const existingAddOption = optionsContainer.querySelector(".add-new-option");
                    if (existingAddOption) {
                        existingAddOption.remove();
                    }

                    optionsContainer.appendChild(addOptionDiv);
                }
            });

            return container;
        }

        function filtrarOpcoes(searchTerm, optionsList) {
            searchTerm = normalizarTexto(searchTerm);
            Array.from(optionsList.children).forEach(option => {
                let label = normalizarTexto(option.textContent);
                option.style.display = label.includes(searchTerm) ? "block" : "none";
            });
        }

        function existeOpcao(searchTerm, optionsList) {
            searchTerm = normalizarTexto(searchTerm);
            return Array.from(optionsList.children).some(option => normalizarTexto(option.textContent) === searchTerm);
        }

        // Data
        const dataCell = document.createElement('td');
        const dataInput = document.createElement('input');
        dataInput.type = 'text';
        dataInput.value = linha.data;
        dataCell.appendChild(dataInput);
        row.appendChild(dataCell);

        // Rubrica (categoria) - Dropdown customizado com pesquisa
        const rubricaCell = document.createElement('td');
        const rubricaDropdown = criarDropdownCustomizado(linha.categoria, document.getElementById('seletorCategoria'), "rubricas");
        rubricaCell.appendChild(rubricaDropdown);
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
        obsInput.value = linha.observacao || '';
        obsCell.appendChild(obsInput);
        row.appendChild(obsCell);

        // Fornecedor - Dropdown customizado com pesquisa
        const fornecedorCell = document.createElement('td');
        const fornecedorDropdown = criarDropdownCustomizado(linha.fornecedor, document.getElementById('seletorFornecedor'), "fornecedor");
        fornecedorCell.appendChild(fornecedorDropdown);
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

        extratoTableBody.appendChild(row);
    });

    document.getElementById('extratoPopup').style.display = 'block';
}

function preencherSelectComOpcoesContabil(selectElement, modelSelectElement) {
    Array.from(modelSelectElement.options).forEach(option => {
        const newOption = document.createElement('option');
        newOption.value = option.textContent;
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
        const data = linha.querySelector('td:nth-child(1) input')?.value || ''; // Data

        // 🔹 Captura a categoria do dropdown customizado e verifica se é "Selecione uma opção"
        const categoriaElement = linha.querySelector('td:nth-child(2) .selected');
        let categoria = categoriaElement ? categoriaElement.textContent.trim() : '';
        categoria = (categoria === "Selecione uma opção") ? "" : categoria;

        const nome = linha.querySelector('td:nth-child(3) input')?.value || ''; // Nome no extrato
        const descricao = linha.querySelector('td:nth-child(4) input')?.value || ''; // Observação

        // 🔹 Captura o fornecedor do dropdown customizado e verifica se é "Selecione uma opção"
        const fornecedorElement = linha.querySelector('td:nth-child(5) .selected');
        let fornecedor = fornecedorElement ? fornecedorElement.textContent.trim() : '';
        fornecedor = (fornecedor === "Selecione uma opção") ? "" : fornecedor;

        const rubricaContabilInput = linha.querySelector('td:nth-child(6) input');
        const rubricaContabil = rubricaContabilInput ? rubricaContabilInput.value : '';  // Rubrica contábil

        const saida = linha.querySelector('td:nth-child(7) input')?.value || '0,00';  // Saída
        const entrada = linha.querySelector('td:nth-child(8) input')?.value || '0,00';  // Entrada

        let tipo = '';
        let valor = '';

        if (entrada !== '0,00') {
            tipo = 'ENTRADA';
            valor = formatarValorParaInsercao(entrada);
        } else if (saida !== '0,00') {
            tipo = 'SAIDA';
            valor = formatarValorParaInsercao(saida);
        }

        console.log(`✅ Registro capturado: Categoria: ${categoria}, Fornecedor: ${fornecedor}, Valor: ${valor}`);

        const idBancoElement = document.getElementById('seletorBanco');
        const idBanco = IDBANCO || (idBancoElement ? idBancoElement.value : null);

        entradas.push({
            Data: data,
            Categoria: categoria,
            Descricao: descricao,
            Nome: nome,
            TIPO: tipo,
            VALOR: valor,
            IDBANCO: idBanco,
            IDCLIENTE: IDCLIENTE,
            FORNECEDOR: fornecedor,
            RubricaContabil: rubricaContabil // Incluindo rubrica contábil
        });
    });

    const json_object = JSON.stringify(entradas);
    console.log("📤 Enviando JSON:", json_object);

    // Enviar os dados via fetch
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
            alert('✅ Dados inseridos com sucesso!');
            location.reload();
            fecharExtratoPopup();
        })
        .catch(error => {
            console.error('❌ Falha ao enviar dados:', error);
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
        opcoesManual.style.display = 'none';
    } else if (metodo === 'manual') {
        opcoesManual.style.display = 'block';
        opcoesAutomatizado.style.display = 'none';
        uploadArquivosDiv.style.display = 'none';
        uploadForm.style.display = 'none';
    } else {
        opcoesManual.style.display = 'none';
        opcoesAutomatizado.style.display = 'none';
        uploadArquivosDiv.style.display = 'none';
        uploadForm.style.display = 'none';
    }
}

function executarMetodoAutomatizado() {
    var metodoAutomatizado = document.getElementById('metodoAutomatizado').value;
    var nomeBanco = document.getElementById('seletorBanco').options[document.getElementById('seletorBanco').selectedIndex].text;

    if (metodoAutomatizado === 'insercaoExcel') {
        processarExtrato("extratoTemplate");
    } else if (metodoAutomatizado === 'leituraAutomatica') {
        processarExtrato(nomeBanco);
    }
}

document.getElementById('excelFile').addEventListener('change', function() {
    if (this.files && this.files[0]) {
        lerExcel();
    }
});

function abrirPopupOpcao(opcaoSelecionada) {
    var url = "";

    if (opcaoSelecionada === "rubricas") {
        url = "/rubricas"; // Página de Rubricas
    } else if (opcaoSelecionada === "fornecedor") {
        url = "/fornecedor"; // Página de Fornecedor
    } else if (opcaoSelecionada === "banco") {
        url = "/dados"; // Página de Banco
    }

    if (url) {
        // Exibir o fundo escuro
        $("#popupBackdrop").fadeIn();

        $("#popupOpcoesModal").dialog({
            modal: true,
            width: 800,
            height: 600,
            title: "Configuração",
            open: function () {
                $("#popupIframe").attr("src", url);

                // Ajustar z-index do popup e do fundo escuro
                $(".ui-dialog").css("z-index", "99999");
                $(".ui-widget-overlay").css("z-index", "99998"); // Fundo escuro correto
            },
            close: function () {
                $("#popupIframe").attr("src", "");
                $("#popupBackdrop").fadeOut(); // Esconder fundo escuro ao fechar

                // 🔹 Aguarda um pequeno tempo para garantir que os selects foram atualizados
                setTimeout(() => {
                    atualizarListasDropdown();
                }, 300);

                initializePage();
            }
        });
    }
}

function atualizarListasDropdown() {
    console.log("Atualizando listas...");

    // Obtém os selects originais novamente
    const seletorCategoria = document.getElementById('seletorCategoria');
    const seletorFornecedor = document.getElementById('seletorFornecedor');

    // Atualiza todas as instâncias do dropdown customizado
    document.querySelectorAll('.custom-select-container').forEach(container => {
        const tipo = container.dataset.tipo; // Identifica se é rubrica ou fornecedor

        let selectModel;
        if (tipo === "rubricas") {
            selectModel = seletorCategoria;
        } else if (tipo === "fornecedor") {
            selectModel = seletorFornecedor;
        }

        if (selectModel) {
            // Remove todas as opções existentes no dropdown
            const optionsList = container.querySelector('.options-list');
            optionsList.innerHTML = "";

            // Adiciona as novas opções vindas do select original
            Array.from(selectModel.options).forEach(option => {
                const optionDiv = document.createElement("div");
                optionDiv.classList.add("option");
                optionDiv.textContent = option.textContent;

                optionDiv.addEventListener("click", () => {
                    container.querySelector('.selected').textContent = optionDiv.textContent;
                    container.querySelector('.options-container').classList.remove("active");
                });

                optionsList.appendChild(optionDiv);
            });

            console.log(`Lista de ${tipo} atualizada!`);
        }
    });
}















