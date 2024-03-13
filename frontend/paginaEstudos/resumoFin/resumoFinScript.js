document.addEventListener('DOMContentLoaded', function() {
    fetchTemplate();
    document.querySelector('#categoryCostsTable tbody').innerHTML = '';
    document.querySelector('#categoryHeaders').innerHTML = '';

    const yearSelector = document.getElementById('yearSelector');
    const empresa = getStoredEmpresaName();

    yearSelector.addEventListener('change', function() {
        const selectedYear = this.value;
        let categorias;

        fetchCategorias(empresa, selectedYear)
            .then(categoriasData => {
                categorias = categoriasData;
                categorias.forEach(categoria => {
                    addCategoriaHeader(categoria);
                });
                return fetchMeses(selectedYear, empresa);
            })
            .then(mesesData => {
                const receitaPromises = mesesData.map(mes => fetchReceitaLiquida(mes, selectedYear, empresa));
                return Promise.all(receitaPromises);
            })
            .then(allReceitasData => {
                const tbody = document.querySelector('#financeTable tbody');
                tbody.innerHTML = '';
                let receitasPorMes = {};
                allReceitasData.forEach(receitaData => {
                    receitasPorMes[receitaData.mes] = receitaData.receitaLiquida;
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${receitaData.mes}</td>
                        <td>${receitaData.receitaLiquida.toFixed(2)}</td>
                        <td colspan="5">Dados não disponíveis</td>
                    `;
                    tbody.appendChild(row);
                });
                return allReceitasData.map(receitaData => receitaData.mes);
            })
            .then(meses => {
                const categoriaPromises = categorias.flatMap(categoria => meses.map(mes => fetchValoresCategoria(categoria, mes, selectedYear, empresa)
                    .then(valor => addValoresToCategoryTable(mes, categoria, valor.total_categoria, receitasPorMes[mes], categorias))));
                return Promise.all(categoriaPromises);
            })
            .then(() => calcularMediaPorcentagemAnual(categorias, selectedYear))
            .catch(error => {
                console.error('Erro ao processar as receitas líquidas:', error);
            });
    });

    if (yearSelector.value) {
        yearSelector.dispatchEvent(new Event('change'));
    }
});

function fetchTemplate(){
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
function fetchMeses(ano, empresa) {
    const url = `/estudos/resumoFin/meses?empresa=${empresa}&ano=${ano}`;

    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Insira os nomes dos meses na tabela aqui
                console.log(data)
                const tbody = document.querySelector('#financeTable tbody');
                tbody.innerHTML = '';
                data.forEach((mes, index) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${mes}</td>
                        <td colspan="6">Carregando...</td>
                    `;
                    tbody.appendChild(row);
                });
                resolve(data);
            })
            .catch(error => {
                console.error('Erro ao buscar os meses:', error);
                reject(error);
            });
    });
}

function fetchReceitaLiquida(mes, ano, empresa) {
    const url = `/estudos/resumoFin/receitaLiquida?empresa=${empresa}&mes=${mes}&ano=${ano}`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            return { mes: mes, receitaLiquida: data }; // Retornar objeto com o mês e a receita líquida
        })
        .catch(error => {
            console.error('Erro ao buscar a receita líquida:', error);
            throw error; // Lançar o erro para que a cadeia de promessas saiba que algo deu errado
        });
}
function fetchValoresCategoria(categoria, mesNome, ano, empresaNome) {
    const url = `/estudos/resumoFin/valoresCategoria?categoria=${categoria}&mes=${mesNome}&ano=${ano}&empresa=${empresaNome}`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data)
            const tbody = document.querySelector('#categoryCostsTable tbody');


            const row = document.createElement('tr');
            const valor = data.total_categoria; // Usar diretamente a propriedade do objeto data
            const receitaLiquida = data.receita_liquida; // Usar diretamente a propriedade do objeto data

            const porcentagem = (valor / receitaLiquida) * 100;

            row.innerHTML = `
                <td>${mesNome}</td>
                <td>${categoria}</td>
                <td>${valor.toFixed(2)}</td>
                <td>${porcentagem.toFixed(2)}%</td>
            `;
            tbody.appendChild(row);

            return data; // Retorna o objeto data
        })
        .catch(error => {
            console.error('Erro ao buscar valores da categoria:', error);
        });
}

// Modifique a função fetchCategorias para também atualizar o modal
function fetchCategorias(empresa, ano) {
    const url = `/estudos/resumoFin/categorias?empresa=${empresa}&ano=${ano}`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const container = document.getElementById('categoryCheckboxes');
            container.innerHTML = ''; // Limpa checkboxes existentes
            data.forEach(categoria => {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = categoria;
                checkbox.value = categoria;
                checkbox.checked = true; // Deixe todos selecionados por padrão ou recupere o estado salvo
                const label = document.createElement('label');
                label.htmlFor = categoria;
                label.textContent = categoria;
                container.appendChild(checkbox);
                container.appendChild(label);
                container.appendChild(document.createElement('br'));
            });
            return data; // Retorna as categorias para uso posterior
        })
        .catch(error => {
            console.error('Erro ao buscar categorias:', error);
        });
}

function addValoresToCategoryTable(mes, categoria, valor, receitaLiquida, categorias) {
    const tbody = document.querySelector('#categoryCostsTable tbody');
    let row = tbody.querySelector(`tr[data-mes="${mes}"]`);

    if (!row) {
        row = document.createElement('tr');
        row.setAttribute('data-mes', mes);
        row.innerHTML = `<td>${mes}</td>`;
        categorias.forEach(() => row.innerHTML += `<td>0</td>`); // Cria células para os valores das categorias
        tbody.appendChild(row);
    }

    const cellIndex = categorias.findIndex(cat => cat === valorCategoria.categoria) + 1; // Encontra o índice da categoria
    const cell = row.cells[cellIndex];
    const porcentagem = (valorCategoria.total_categoria / receitaLiquida) * 100;
    cell.textContent = `${valorCategoria.total_categoria.toFixed(2)} (${porcentagem.toFixed(2)}%)`;
}
function calcularMediaPorcentagemAnual(categorias, selectedYear) {
    categorias.forEach((categoria, index) => {
        fetch(`/caminho/para/media-porcentagem?categoria=${categoria}&ano=${selectedYear}`)
            .then(response => response.json())
            .then(media => {
                const pctCells = document.querySelectorAll(`#categoryCostsTable th:nth-child(${(index * 2) + 2})`);
                pctCells.forEach(cell => {
                    cell.textContent = `${media.toFixed(2)}%`; // Atualiza o texto da célula de cabeçalho da média da porcentagem
                });
            })
            .catch(error => console.error('Erro ao buscar média de porcentagem:', error));
    });
}
function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}
function addCategoriaHeader(categoria) {
    const headerRow = document.querySelector('#categoryHeaders');
    const th = document.createElement('th');
    th.textContent = categoria;
    headerRow.appendChild(th);
}
document.getElementById('openCategoryModal').addEventListener('click', function() {
    document.getElementById('categoryModal').style.display = 'block';
});

// Salvar seleção de categorias
document.getElementById('saveCategorySelection').addEventListener('click', function() {
    const checkboxes = document.querySelectorAll('#categoryCheckboxes input[type="checkbox"]:checked');
    const selectedCategories = Array.from(checkboxes).map(checkbox => checkbox.value);
    localStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
    document.getElementById('categoryModal').style.display = 'none';
    // Atualize a interface com as categorias selecionadas...
});

function getSelectedCategories() {
    const saved = localStorage.getItem('selectedCategories');
    return saved ? JSON.parse(saved) : [];
}