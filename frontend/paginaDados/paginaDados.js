function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

let idcliente = 0;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadTemplateAndStyles();
    } catch (error) {
        console.error('Erro ao carregar o template:', error);
    }

    const selectAction = document.getElementById('selectAction');
    const actionSections = document.querySelectorAll('.action-section');

    selectAction.addEventListener('change', function() {
        const selectedValue = this.value;
        actionSections.forEach(section => {
            section.style.display = (section.id === selectedValue) ? 'block' : 'none';
        });
    });

    selectAction.dispatchEvent(new Event('change'));
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

document.addEventListener('DOMContentLoaded', (event) => {
    const nomeEmpresa = getStoredEmpresaName();
    if (nomeEmpresa) {
        fetch(`/insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const campoOculto = document.querySelector('input[name="idcliente"]');
                    const campoOculto2 = document.querySelector('input[name="idcliente2"]');
                    if (campoOculto && campoOculto2) {
                        campoOculto.value = data[0].IDCLIENTE;
                        campoOculto2.value = data[0].IDCLIENTE;
                        idcliente = data[0].IDCLIENTE;
                    }
                    fetch(`/dados/bancos?idcliente=${idcliente}`)
                        .then(response => response.json())
                        .then(data => {
                            const selectBanco = document.getElementById('selectBanco');
                            const selectEditBanco = document.getElementById('selectEditBanco');
                            const selectSaldoBanco = document.getElementById('selectSaldoBanco');
                            data.forEach(banco => {
                                const option = document.createElement('option');
                                option.value = banco.IDBANCO;
                                option.text = banco.NOME_TIPO;
                                selectBanco.appendChild(option);
                                selectEditBanco.appendChild(option.cloneNode(true));
                                selectSaldoBanco.appendChild(option.cloneNode(true)); // Clone para reutilizar no select de saldo
                            });
                        });
                }
            })
            .catch(error => {
                console.error('Erro ao carregar dados da empresa:', error);
            });
    }

    const selectEditBanco = document.getElementById('selectEditBanco');
    selectEditBanco.addEventListener('change', function(event) {
        const bancoSelecionadoId = event.target.value;
        if (bancoSelecionadoId) {
            fetch(`/dados/banco/${bancoSelecionadoId}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.length > 0) {
                        const tipoContaAtual = data[0].TIPO;
                        const novoTipoContaSelect = document.getElementById('novoTipoConta');

                        for (let i = 0; i < novoTipoContaSelect.options.length; i++) {
                            if (novoTipoContaSelect.options[i].value === tipoContaAtual) {
                                novoTipoContaSelect.selectedIndex = i;
                                break;
                            }
                        }
                    }
                })
                .catch(error => {
                    console.error('Erro ao buscar tipo do banco:', error);
                });
        }
    });
});

document.addEventListener('DOMContentLoaded', (event) => {
    const params = new URLSearchParams(window.location.search);
    const successMsg = params.get('successMsg');
    if (successMsg) {
        alert(successMsg);
        history.pushState(null, '', window.location.pathname);
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const formRemove = document.getElementById('formRemove');
    const formEdit = document.getElementById('formEdit');
    const formSaldo = document.getElementById('formSaldo');

    formRemove.addEventListener('submit', function(event) {
        event.preventDefault();
        const selectElement = document.getElementById('selectBanco');
        const empresa = selectElement.options[selectElement.selectedIndex].text;
        if (confirm('Tem certeza que deseja remover o banco: ' + empresa + '?')) {
            formRemove.submit();
        } else {
            console.log('Remoção cancelada pelo usuário.');
        }
    });

    formEdit.addEventListener('submit', function(event) {
        event.preventDefault();
        const selectElement = document.getElementById('selectEditBanco');
        const bancoSelecionado = selectElement.options[selectElement.selectedIndex].text;
        if (confirm('Tem certeza que deseja editar o banco: ' + bancoSelecionado + '?')) {
            formEdit.submit();
        } else {
            console.log('Edição cancelada pelo usuário.');
        }
    });

    formSaldo.addEventListener('submit', function(event) {
        event.preventDefault();
        const selectElement = document.getElementById('selectSaldoBanco');
        const bancoSelecionado = selectElement.options[selectElement.selectedIndex].text;
        const mesAno = document.getElementById('mesAno').value;
        const saldoInicial = document.getElementById('saldoInicial').value;
        console.log(saldoInicial)
        const dados = {
            idcliente: idcliente,
            idbanco: selectElement.value,
            mesAno: mesAno,
            saldo: saldoInicial.replace(/\./g, '').replace(',', '.') // Corrigido o valor formatado para número
        };

        if (confirm(`Tem certeza que deseja definir o saldo inicial para o banco: ${bancoSelecionado} em ${mesAno} no valor de ${saldoInicial}?`)) {
            fetch('/dados/definirSaldoInicial', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            })
                .then(response => {
                    if (response.ok) {
                        alert('Saldo inicial definido com sucesso!');
                        location.reload();
                    } else {
                        throw new Error('Erro ao definir saldo inicial');
                    }
                })
                .catch(error => {
                    console.error('Erro:', error);
                    alert('Ocorreu um erro ao definir o saldo inicial.');
                });
        } else {
            console.log('Definição de saldo inicial cancelada pelo usuário.');
        }
    });
});

function formatarValorFinanceiroInput(valor) {
    valor = valor.replace(/\D/g, '');
    valor = (valor / 100).toFixed(2);
    valor = valor.replace(".", ",");
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return valor;
}

document.addEventListener('DOMContentLoaded', function() {
    const saldoInicialInput = document.getElementById('saldoInicial');

    saldoInicialInput.addEventListener('input', function() {
        this.value = formatarValorFinanceiroInput(this.value);
    });
});
