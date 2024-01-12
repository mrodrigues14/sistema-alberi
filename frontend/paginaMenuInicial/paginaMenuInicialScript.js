document.addEventListener('DOMContentLoaded', function() {
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
});

document.getElementById('dateButton').addEventListener('click', function() {
    document.getElementById('seletorMes').click();
});

document.getElementById('seletorMes').addEventListener('change', function() {
    var date = new Date(this.value);
    var options = { month: 'long', year: 'numeric' };
    var formattedDate = new Intl.DateTimeFormat('pt-BR', options).format(date);
    document.getElementById('dateButton').textContent = formattedDate;
});

function criarGraficoValores(valoresData) {
    const valores = valoresData.map(item => item.valor);
    const datas = valoresData.map(item => {
        const date = new Date(item.data);
        return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
    });

    var ctx = document.getElementById('graficoValores').getContext('2d');

    var chart = new Chart(ctx, {
        type: 'bar',
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
function handleFiltrarPorData() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;

    if (dataInicio && dataFim) {
        fetch('/paginaMenuInicial/filtroData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dataInicio, dataFim })
        })
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

