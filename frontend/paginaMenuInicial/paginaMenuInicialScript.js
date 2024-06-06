let idEmpresa;

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
        setDefaultDates()
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

window.onload = function() {
    const nomeEmpresa = getStoredEmpresaName();
    fetch(`/insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                console.log('Dados da empresa recebidos:', data);
                idEmpresa = data[0].IDCLIENTE;
                console.log('idEmpresa definido como:', idEmpresa);
            } else {
                console.error('Dados da empresa não retornados ou vazios');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados da empresa:', error);
        });


};

function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

document.getElementById('dateButton').addEventListener('click', function() {
    document.getElementById('seletorMes').click();
});

document.getElementById('seletorMes').addEventListener('change', function() {
    var date = new Date(this.value);
    var options = { month: 'long', year: 'numeric' };
    document.getElementById('dateButton').textContent = new Intl.DateTimeFormat('pt-BR', options).format(date);
});

function setDefaultDates() {
    const hoje = new Date();
    const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1-30);
    const diaAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1);

    document.getElementById('dataInicio').valueAsDate = primeiroDiaDoMes;
    document.getElementById('dataFim').valueAsDate = diaAnterior;

    setTimeout(() => {
        handleFiltrarPorDataSaida();
        handleFiltrarPorCategoriaSaida();
        handleFiltrarPorDataEntrada();
        handleFiltrarPorCategoriaEntrada();
    }, 500);
}

function handleFiltrarPorDataSaida() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;

    if (dataInicio && dataFim) {
        fetch(`/paginaMenuInicial/filtrarValoresSaida?dataInicio=${encodeURIComponent(dataInicio)}&dataFim=${encodeURIComponent(dataFim)}&idCliente=${idEmpresa}`)
            .then(response => response.json())
            .then(valoresData => {
                console.log('Valores filtrados:', valoresData);
                criarGraficoValores(valoresData);
            })
            .catch(error => {
                console.error('Erro ao filtrar por data:', error);
            });
    } else {
        console.error('Datas não fornecidas');
    }
}

function handleFiltrarPorCategoriaSaida() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;

    if (dataInicio && dataFim) {
        fetch(`/paginaMenuInicial/filtroValoresCategoriaMes?dataInicio=${encodeURIComponent(dataInicio)}&dataFim=${encodeURIComponent(dataFim)}&idCliente=${idEmpresa}`)
            .then(response => response.json())
            .then(data => {
                console.log('Dados de saída por categoria:', data);
                criarGraficoSaidaPorCategoria(data);
            })
            .catch(error => console.error('Erro ao buscar dados de saída por categoria:', error));
    } else {
        console.error('Datas não fornecidas');
    }
}

function handleFiltrarPorCategoriaEntrada() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;

    if (dataInicio && dataFim) {
        fetch(`/paginaMenuInicial/filtrarValoresDeEntradaPorCategoria?dataInicio=${encodeURIComponent(dataInicio)}&dataFim=${encodeURIComponent(dataFim)}&idCliente=${idEmpresa}`)
            .then(response => response.json())
            .then(data => {
                console.log('Dados de saída por categoria:', data);
          33
                criarGraficoEntradaPorCategoria(data);
            })
            .catch(error => console.error('Erro ao buscar dados de saída por categoria:', error));
    } else {
        console.error('Datas não fornecidas');
    }
}

function handleFiltrarPorDataEntrada() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;

    if (dataInicio && dataFim) {
        fetch(`/paginaMenuInicial/filtrarValoresEntrada?dataInicio=${encodeURIComponent(dataInicio)}&dataFim=${encodeURIComponent(dataFim)}&idCliente=${idEmpresa}`)
            .then(response => response.json())
            .then(valoresData => {
                console.log('Valores filtrados:', valoresData);
                criarGraficoValoresEntrada(valoresData);
            })
            .catch(error => {
                console.error('Erro ao filtrar por data:', error);
            });
    } else {
        console.error('Datas não fornecidas');
    }
}

function criarGraficoValores(valoresData) {
    const valores = valoresData.map(item => item.valor);
    const datas = valoresData.map(item => {
        const date = new Date(item.data);
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    });

    const ctx = document.getElementById('graficoValoresSaidaMes').getContext('2d');

    var chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datas,
            datasets: [{
                label: 'Valores',
                data: valores,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function criarGraficoValoresEntrada(valoresData) {
    const valores = valoresData.map(item => item.valor);
    const datas = valoresData.map(item => {
        const date = new Date(item.data);
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    });

    const ctx = document.getElementById('graficoValoresEntradaMes').getContext('2d');

    var chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datas,
            datasets: [{
                label: 'Valores',
                data: valores,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


function criarGraficoSaidaPorCategoria(dadosCategoria) {
    const categorias = dadosCategoria.map(item => item.categoria);
    const valores = dadosCategoria.map(item => item.valorTotal);

    var ctx = document.getElementById('graficoValoresSaidaPorCategoria').getContext('2d');
    var chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categorias,
            datasets: [{
                label: 'Valor de Saída por Categoria',
                data: valores,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Valores de Saída por Categoria'
                }
            }
        }
    });
}

function criarGraficoEntradaPorCategoria(dadosCategoria) {
    const categorias = dadosCategoria.map(item => item.categoria);
    const valores = dadosCategoria.map(item => item.valorTotal);

    var ctx = document.getElementById('graficoValoresEntradaPorCategoria').getContext('2d');
    var chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categorias,
            datasets: [{
                label: 'Valor de Saída por Categoria',
                data: valores,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Valores de Saída por Categoria'
                }
            }
        }
    });
}

