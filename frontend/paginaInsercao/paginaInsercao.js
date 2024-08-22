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
        fetchSaldoInicialEFinal();
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

            // Limpar seletor de categorias antes de adicionar novas opções
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
    document.querySelector('.body-insercao').classList.add('blur-background');
    const idBanco = IDBANCO || document.getElementById('seletorBanco').value;
    var input = document.getElementById('excelFile');
    var reader = new FileReader();

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
                row['IDBANCO'] = idBanco;

                if (row['Saida']) {
                    row['Saida'] = formatarValorFinanceiro(parseFloat(row['Saida']));
                }
                if (row['Entrada']) {
                    row['Entrada'] = formatarValorFinanceiro(parseFloat(row['Entrada']));
                }

                if (row['Entrada'] && !row['Saida']) {
                    row['TIPO'] = 'ENTRADA';
                    row['VALOR'] = row['Entrada'];
                } else if (row['Saida'] && !row['Entrada']) {
                    row['TIPO'] = 'SAIDA';
                    row['VALOR'] = row['Saida'];
                } else if (row['Entrada'] && row['Saida']) {
                    console.error('Erro: ambos os campos "Entrada" e "Saida" estão preenchidos.');
                } else {
                    console.error('Erro: Nenhum valor em "Entrada" ou "Saida".');
                }

                // Mapeia a categoria e fornecedor diretamente do Excel, sem verificação
                row['IDCATEGORIA'] = row['Categoria'] ? row['Categoria'].toLowerCase() : '';
                row['IDFORNECEDOR'] = row['NomeFornecedor'] ? row['NomeFornecedor'].toLowerCase() : '';
            });

            var json_object = JSON.stringify(XL_row_object);
            console.log(json_object);
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
                    fecharPopupCarregamentoInsercao();
                    location.reload();
                })
                .catch(error => {
                    fecharPopupCarregamentoInsercao();
                    console.error('Falha ao enviar dados:', error);
                });
        });
    };

    reader.onerror = function (ex) {
        console.log(ex);
    };

    reader.readAsBinaryString(input.files[0]);
}

async function adicionarCategoria(nomeCategoria, idCliente) {
    try {
        const response = await fetch('/categoria', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ CATEGORIA: nomeCategoria, idcliente: idCliente })
        });
        const data = await response.json();
        return data.idCategoria;
    } catch (error) {
        console.error('Erro ao adicionar nova categoria:', error);
        throw error;
    }
}

async function adicionarFornecedor(nomeFornecedor, idCliente) {
    try {
        const response = await fetch('/fornecedor/adicionar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nomeFornecedor, cnpj: null, cpf: null, tipoProduto: null, idcliente: idCliente })
        });
        const data = await response.json();
        return data.idFornecedor;
    } catch (error) {
        console.error('Erro ao adicionar novo fornecedor:', error);
        throw error;
    }
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
            console.log('Dados  data:', data);
            atualizarTabela(data);
        })
        .catch(error => {
            console.error('Erro ao buscar os dados:', error);
        });
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
    const saldoInicial = parseFloat(document.getElementById('saldoInicialInput').value.replace(/\./g, '').replace(',', '.')) || 0;
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
                <button onclick="editarLinha(this)">EDITAR</button>
                <button onclick="selecionarLinha(this)" data-idextrato="${item.IDEXTRATO}">SELECIONAR</button>
            `;
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

function fetchSaldoInicialEFinal() {
    const mesAno = $('#seletorMesAno').val();
    const dataFormatada = formatDateToFirstOfMonth(mesAno);

    fetch(`/consulta/saldoinicial?banco=${document.getElementById('seletorBanco').value}&data=${dataFormatada}&cliente=${idEmpresa}`)
        .then(response => response.json())
        .then(data => {
            const saldoInicialInput = document.getElementById('saldoInicialInput');
            const table2 = document.getElementById('saldoFinalTable');
            const tbodysaldofinal = table2.querySelector('tbody');
            tbodysaldofinal.innerHTML = '';
            console.log(data.SALDO)

            let saldoinicial = 0;

            if (data && data.SALDO) {
                saldoinicial = parseFloat(data.SALDO || 0);
            }
            console.log("Saldo Inicial:", saldoinicial);
            saldoInicialInput.value = formatarValorNumerico(saldoinicial);

            const extratoBody = document.getElementById('extrato-body');
            const rows = extratoBody.getElementsByTagName('tr');
            let saldoFinal = saldoinicial;

            if (rows.length > 0) {
                const lastRow = rows[rows.length - 1];
                const lastSaldoCell = lastRow.cells[8];
                saldoFinal = parseFloat(lastSaldoCell.textContent.replace(/\./g, '').replace(',', '.')) || saldoinicial;
            }

            const rowFinal = tbodysaldofinal.insertRow();
            rowFinal.insertCell().textContent = formatarValorNumerico(saldoFinal);

            definirSaldoInicialProximoMes(saldoFinal);
        })
        .catch(error => {
            console.error('Erro ao buscar saldo inicial:', error);
            document.getElementById('saldoInicialInput').value = "0,00";
        });
}

function definirSaldoInicialProximoMes(saldoFinal) {
    const mesAnoAtual = $('#seletorMesAno').val();
    const [mes, ano] = mesAnoAtual.split('-');
    let novoMes = parseInt(mes) + 1;
    let novoAno = parseInt(ano);

    if (novoMes > 12) {
        novoMes = 1;
        novoAno += 1;
    }
    console.log(idEmpresa)
    const dataProximoMes = `${novoAno}-${String(novoMes).padStart(2, '0')}-01`;

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
        .then(data => {
            console.log('Saldo inicial do próximo mês definido com sucesso:', data);
        })
        .catch(error => {
            console.error('Erro ao definir saldo inicial do próximo mês:', error);
        });
}


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

            const rows = document.querySelectorAll('#extrato-body tr');
            const saldoInicial = parseFloat(document.getElementById('saldoInicialInput').value.replace(/\./g, '').replace(',', '.')) || 0;
            let saldo = saldoInicial;

            rows.forEach((row, index) => {
                const entradaCell = row.cells[6];
                const saidaCell = row.cells[7];
                const saldoCell = row.cells[8];

                const entrada = parseFloat(entradaCell.textContent.replace(/\./g, '').replace(',', '.')) || 0;
                const saida = parseFloat(saidaCell.textContent.replace(/\./g, '').replace(',', '.')) || 0;

                const categoria = row.cells[2].textContent;
                const isExcluded = ["NÃO CONTABILIZAR", "ENTRE CONTAS"].includes(categoria);

                if (index === 0) {
                    saldo = saldoInicial + (isExcluded ? 0 : entrada - saida);
                } else {
                    saldo += (isExcluded ? 0 : entrada - saida);
                }

                saldoCell.textContent = formatarValorNumerico(saldo);
            });

            fetchSaldoInicialEFinal();
        }
    }).disableSelection();
});

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    initializePageConsulta();
    fetchSaldoInicialEFinal();
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
        const data = formatDateToFirstOfMonth($('#seletorMesAno').val());

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
    const idExtrato = row.dataset.idextrato;

    const formatarData = (dataString) => {
        const [dia, mes, ano] = dataString.split('/');
        return `${ano}-${mes}-${dia}`;
    };

    // Captura dos valores de entrada e saída
    const entradaCell = cells[6].querySelector('input');
    const saidaCell = cells[7].querySelector('input');

    const entrada = entradaCell ? parseFloat(entradaCell.value.replace(/\./g, '').replace(',', '.')) : null;
    const saida = saidaCell ? parseFloat(saidaCell.value.replace(/\./g, '').replace(',', '.')) : null;

    // Determina o tipo de transação baseado nos valores de entrada e saída
    let tipoTransacao = null;
    if (entrada && saida) {
        alert('Não é permitido ter valores tanto em Entrada quanto em Saída. Verifique e tente novamente.');
        return;
    } else if (entrada) {
        tipoTransacao = 'ENTRADA';
    } else if (saida) {
        tipoTransacao = 'SAIDA';
    }

    const categoriaInput = cells[2].querySelector('select'); // Referência ao select de categoria
    const categoria = categoriaInput ? categoriaInput.value : null;

    const dadosEditados = {
        id: idExtrato,
        data: cells[1].querySelector('input').value
            ? formatarData(cells[1].querySelector('input').value)
            : null,
        categoria: categoria || null,
        nome_no_extrato: cells[3].querySelector('input').value || null,
        descricao: cells[4].querySelector('input').value || null,
        fornecedor: cells[5].querySelector('input').value || null,
        tipo: tipoTransacao, // Definido baseado nos valores de entrada e saída
        valor: entrada || saida // Valor é o de entrada ou saída, dependendo de qual foi preenchido
    };

    // Enviar os dados editados para o servidor
    fetch('consulta/editar/extrato', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosEditados),
    })
        .then(response => {
            if (!response.ok) {
                // Se a resposta não for ok, joga um erro para ser tratado no catch
                throw new Error(`Erro no servidor: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data); // Verifique os dados de resposta
            if (data.affectedRows > 0) {
                alert('Edição confirmada com sucesso!');
                buscarDados(); // Atualizar a tabela com os dados atualizados
            } else {
                alert('Nenhuma mudança foi detectada.');
            }
        })
        .catch(error => {
            console.error('Erro ao confirmar a edição:', error);
            alert('Erro ao confirmar a edição. Por favor, tente novamente.');
            cancelarEdicao(buttonElement); // Restaura os valores originais em caso de erro
        });
}

function cancelarEdicao(buttonElement) {
    const row = buttonElement.closest('tr');
    const originalData = JSON.parse(row.dataset.originalData);
    const cells = row.querySelectorAll('td');

    // Restaura os valores originais nas células
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
    const cells = row.querySelectorAll('td');
    row.dataset.originalData = JSON.stringify(
        Array.from(cells).map(cell => cell.textContent.trim())
    );

    cells.forEach((cell, index) => {
        if (index === 2) { // Coluna de categoria (index 2)
            const categoriaAtual = cell.textContent.trim();
            const select = document.createElement('select');

            fetch(`/insercao/dados-categoria?idcliente=${IDCLIENTE}`)
                .then(response => response.json())
                .then(categorias => {
                    const optionDefault = document.createElement('option');
                    optionDefault.value = '';
                    optionDefault.textContent = 'Selecione uma Rubrica';
                    select.appendChild(optionDefault);

                    // Construir a árvore de categorias e adicionar ao dropdown
                    const categoriasTree = construirArvoreDeCategorias(categorias);
                    adicionarCategoriasAoSelect(select, categoriasTree);

                    // Definir a categoria atual como selecionada
                    select.value = Object.keys(select.options).find(key => select.options[key].text === categoriaAtual) || '';

                    cell.innerHTML = '';
                    cell.appendChild(select);
                })
                .catch(error => {
                    console.error('Erro ao buscar categorias:', error);
                });
        } else if (index > 0 && index < 8) { // Torna as outras células editáveis
            const cellText = cell.textContent.trim();
            cell.innerHTML = `<input type="text" value="${cellText}" class="editavel">`;

            // Aplica a formatação de valor financeiro nos campos de entrada e saída
            if (index === 6 || index === 7) { // Colunas de entrada (6) e saída (7)
                const input = cell.querySelector('input');
                input.addEventListener('input', function () {
                    this.value = formatarValorFinanceiroInput(this.value);
                });
            }
        }
    });

    // Substituir o botão "Editar" por "Confirmar" e "Cancelar"
    const ferramentasCell = cells[cells.length - 1];
    row.dataset.originalButtons = ferramentasCell.innerHTML; // Armazena os botões originais (inclusive a lixeira)
    ferramentasCell.innerHTML = `
        <button onclick="confirmarEdicao(this)" class="confirmar-btn">✔️</button>
        <button onclick="cancelarEdicao(this)" class="cancelar-btn">❌</button>
    `;
}

function abrirSaldoPopup() {
    document.getElementById('saldoPopup').style.display = 'flex';
}

function fecharSaldoPopup() {
    document.getElementById('saldoPopup').style.display = 'none';
}

function salvarSaldoInicial() {
    const novoSaldo = document.getElementById('novoSaldoInicial').value;
    const cliente = IDCLIENTE;
    const banco = document.getElementById('seletorBanco').value; // Captura o banco selecionado
    const data = formatDateToFirstOfMonth($('#seletorMesAno').val());

    fetch('/consulta/definirSaldoInicial', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cliente, banco, data, saldo: formatarValorParaInsercao(novoSaldo) }) // Formata o valor antes de enviar
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao salvar saldo inicial: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            alert('Saldo inicial atualizado com sucesso!');
            document.getElementById('saldoInicialInput').value = formatarValorParaExibicao(novoSaldo);
            fecharSaldoPopup();
            buscarDados();
        })
        .catch(error => {
            console.error('Erro ao salvar saldo inicial:', error);
            alert('Erro ao salvar saldo inicial. Por favor, tente novamente.');
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
    link.download = 'template.xlsx'; // Nome do arquivo que será baixado
    link.click();
}

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

async function processarExtratoPDFBancoDoBrasil() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            alert('Por favor, selecione um arquivo PDF.');
            return;
        }

        const fileReader = new FileReader();
        fileReader.onload = async function() {
            const typedArray = new Uint8Array(this.result);
            const pdf = await pdfjsLib.getDocument(typedArray).promise;

            const data = [];
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                textContent.items.forEach((item) => {
                    data.push(item.str);
                });
            }

            const linhasExtrato = processarDadosDoExtratoBancoDoBrasil(data);
            mostrarExtratoPopup(linhasExtrato);
        };
        fileReader.readAsArrayBuffer(file);
    };
    input.click();
}

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

async function processarExtratoPDFItau() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            alert('Por favor, selecione um arquivo PDF.');
            return;
        }

        const fileReader = new FileReader();
        fileReader.onload = async function() {
            const typedArray = new Uint8Array(this.result);
            const pdf = await pdfjsLib.getDocument(typedArray).promise;

            const data = [];
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                textContent.items.forEach((item) => {
                    data.push(item.str);
                });
            }

            const linhasExtrato = processarDadosDoExtratoItau(data);
            mostrarExtratoPopup(linhasExtrato);
        };
        fileReader.readAsArrayBuffer(file);
    };
    input.click();
}

async function processarExcelCaixa() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            alert('Por favor, selecione um arquivo Excel.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async function (event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            const processedData = processarDadosDoExcelCaixa(jsonData);
            mostrarExtratoPopup(processedData);
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
}

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

function mostrarExtratoPopup(extrato) {
    const extratoTableBody = document.getElementById('extratoTable').querySelector('tbody');
    document.querySelector('.body-insercao').classList.add('blur-background');

    extratoTableBody.innerHTML = '';

    extrato.forEach((linha, index) => {
        const row = document.createElement('tr');
        row.dataset.index = index; // Armazenar o índice da linha

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
    // Copia todas as opções do modelo para o novo select, incluindo a propriedade `disabled`
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
            fecharExtratoPopup();
        })
        .catch(error => {
            console.error('Falha ao enviar dados:', error);
            alert('Erro ao inserir os dados.');
        });
}

document.getElementById('processarExtratoBtn').addEventListener('click', function() {
    document.getElementById('bancoPopup').style.display = 'block';
    document.querySelector('.body-insercao').classList.add('blur-background');

});

function confirmarBanco() {
    const bancoSelecionado = document.getElementById('bancoSelect').value;

    if (bancoSelecionado) {
        processarExtratoPorBanco(bancoSelecionado);
        fecharBancoPopup();
    } else {
        alert('Por favor, selecione um banco.');
    }
}

function fecharBancoPopup() {
    document.getElementById('bancoPopup').style.display = 'none';
    document.querySelector('.body-insercao').classList.remove('blur-background');
}

function processarExtratoPorBanco(banco) {
    const bancoIdentificado = identificarBanco(banco);
    console.log(bancoIdentificado);

    if (bancoIdentificado === 'Caixa') {
        processarExcelCaixa();
    } else if (bancoIdentificado === 'Itau') {
        processarExtratoPDFItau();
    } else if (bancoIdentificado === 'Banco do Brasil') {
        processarExtratoPDFBancoDoBrasil();
    } else {
        alert('Banco não identificado ou não suportado!');
    }
}

function identificarBanco(nomeBanco) {
    if (!nomeBanco) {
        console.error('Nome do banco não fornecido');
        return null;
    }

    const nomeBancoLower = nomeBanco.toLowerCase();

    if (nomeBancoLower.includes('caixa') || nomeBancoLower.includes('cef') || nomeBancoLower.includes('caixa economica federal')) {
        return 'Caixa';
    } else if (nomeBancoLower.includes('itau') || nomeBancoLower.includes('itaú')) {
        return 'Itau';
    } else if (nomeBancoLower.includes('banco do brasil') || nomeBancoLower.includes('bb')) {
        return 'Banco do Brasil';
    }
    return null;
}








