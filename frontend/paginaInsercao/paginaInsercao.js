function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

window.onload = function() {
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

    fetch('/insercao/ultimas-insercoes')
        .then(response => response.json())
        .then(data => {
            const table = document.getElementById('ultimasInsercoes');
            const tbody = table.querySelector('tbody');
            tbody.innerHTML = '';

            data.forEach(insercao => {
                const row = tbody.insertRow();
                row.insertCell().textContent = formatDate(insercao.DATA);
                row.insertCell().textContent = insercao.CATEGORIA;
                row.insertCell().textContent = insercao.NOMENOEXTRATO;
                row.insertCell().textContent = insercao.TIPODETRANSACAO;
                row.insertCell().textContent = insercao.VALOR;
                row.insertCell().textContent = insercao.NOME;
            });
        })
        .catch(error => {
            console.error('Erro ao carregar os dados:', error);
        });
};

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

function teste(){
    alert("teste");
}