
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