let nomeEmpresa;

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

function fetchCategoryData() {
    nomeEmpresa = getStoredEmpresaName();
    const ano = new Date().getFullYear();
    return fetch(`/estudos/metas/buscarMeta?empresa=${nomeEmpresa}&ano=${ano}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Metas recebidas:', data);
            // Certifique-se de que 'data' é um array antes de tentar inserir na tabela
            if (Array.isArray(data)) {
                insertCategoryRows(data);
            } else {
                console.error('Os dados recebidos não são um array:', data);
            }
        })
        .catch(error => {
            console.error('Erro ao buscar metas:', error);
        });
}


function calculateValueAfterPercentage(bruto, percentage) {
    return bruto - (bruto * (percentage / 100));
}

function updateTableWithCategoryData() {
    fetchCategoryData()
        .then(data => {
            const tableBody = document.getElementById('costsTable').tBodies[0];

            data.forEach(category => {
                const row = tableBody.insertRow();
                const cellName = row.insertCell();
                const cellMeta = row.insertCell();
                const cellCalcValue = row.insertCell();
                cellName.textContent = category.name;
                cellMeta.textContent = category.value;

                const brutoInputs = document.querySelectorAll('.bruto');
                brutoInputs.forEach(input => {
                    const month = input.dataset.month;
                    const cellValue = row.insertCell();
                    // Preencher célula com valor calculado
                    input.addEventListener('input', () => {
                        const percentageInput = document.querySelector(`.percentage[data-month="${month}"]`);
                        const bruto = parseFloat(input.value);
                        const percentage = parseFloat(percentageInput.value);
                        const calcValue = calculateValueAfterPercentage(bruto, percentage);
                        cellValue.textContent = calcValue.toFixed(2);
                    });
                });
            });
        })
        .catch(error => {
            console.error('Erro ao buscar metas:', error);
        });

}

function insertCategoryRows(categories) {
    const tableBody = document.getElementById('costsTable').querySelector('tbody');
    tableBody.innerHTML = ''; // Limpa a tabela antes de inserir novas linhas.

    categories.forEach(cat => {
        // Garanta que 'cat.meta' é um número antes de chamar 'toFixed'.
        const metaValue = typeof cat.meta === 'number' ? cat.meta.toFixed(2) : 'Valor indefinido';

        const row = tableBody.insertRow();
        const cellCategoria = row.insertCell();
        const cellMeta = row.insertCell();
        // Definindo e criando corretamente as células antes de usar
        const cellPercentage = row.insertCell();
        const cellManualInput = row.insertCell();

        // Continua com a inserção dos dados...
        cellCategoria.textContent = cat.categoria;
        cellMeta.textContent = metaValue;

        const inputPercentage = document.createElement('input');
        inputPercentage.type = 'number';
        inputPercentage.className = 'category-percentage';
        inputPercentage.step = '0.01';
        cellPercentage.appendChild(inputPercentage);

        const inputManual = document.createElement('input');
        inputManual.type = 'text';
        inputManual.className = 'category-manual-input';
        inputManual.disabled = true; // Começa desabilitado, habilitar quando a porcentagem for inserida
        cellManualInput.appendChild(inputManual);

        // Adiciona um event listener para calcular o valor manual quando a porcentagem mudar
        inputPercentage.addEventListener('input', function () {
            const bruto = document.querySelector('.bruto[data-month="META"]').value;
            const percentage = this.value;
            const calculatedValue = bruto - (bruto * (percentage / 100));
            inputManual.value = calculatedValue.toFixed(2);
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
});

function saveEditableValues() {
    document.querySelectorAll('.bruto, .percentage').forEach(input => {
        const month = input.dataset.month;
        localStorage.setItem(`value_${input.className}_${month}`, input.value);
    });
}

function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}
// Carregar valores salvos e configurar event listeners
window.onload = () => {
    document.querySelectorAll('.bruto, .percentage').forEach(input => {
        const month = input.dataset.month;
        const savedValue = localStorage.getItem(`value_${input.className}_${month}`);
        if (savedValue) {
            input.value = savedValue;
        }

        // Salvar o valor quando ele é alterado
        input.addEventListener('change', saveEditableValues);
    });

    updateTableWithCategoryData();
};
