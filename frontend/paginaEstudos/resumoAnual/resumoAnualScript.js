let idEmpresa;
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
function fetchTemplateEstudos(){
    fetch('/paginaEstudos/paginaEstudos.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('menu-container').innerHTML = data;

            var link = document.createElement('link');
            link.href = '/paginaEstudos/paginaEstudos.css';
            link.rel = 'stylesheet';
            link.type = 'text/css';
            document.head.appendChild(link);

            var script = document.createElement('script');
            script.src = '/paginaEstudos/paginaEstudos.js';
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

function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}



function buscarTotalEntradasPorMes() {
    const ano = new Date().getFullYear();
    fetch(`/estudos/resumoAnual/totalEntradasPorMes?empresa=${idEmpresa}&ano=${ano}`)
        .then(response => response.json())
        .then(data => {
            console.log('Dados recebidos:', data);
            inserirDadosNaTabela(data);
        })
        .catch(error => {
            console.error('Erro ao buscar total de entradas:', error);
        });
}


function inserirDadosNaTabela(dados) {
    const tbody = document.querySelector('#tabelaResumo tbody');
    tbody.innerHTML = ''; // Limpa o corpo da tabela

    dados.forEach(entrada => {
        const mes = entrada.mes;
        const totalLiquido = entrada.total;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${mesParaNome(mes)}</td>
            <td><input type="number" class="valor-bruto-input" onchange="calcularDesconto(this)" /></td>
            <td class="valor-liquido">${totalLiquido.toFixed(2)}</td>
            <td class="desconto">-</td>
        `;
        tbody.appendChild(tr);
    });
}


function mesParaNome(mes) {
    const nomesDosMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return nomesDosMeses[mes - 1];
}

function calcularDesconto(inputValorBruto) {
    const tr = inputValorBruto.parentElement.parentElement;
    const valorBruto = parseFloat(inputValorBruto.value);
    const valorLiquido = parseFloat(tr.querySelector('.valor-liquido').textContent);
    const desconto = valorBruto - valorLiquido;

    tr.querySelector('.desconto').textContent = desconto.toFixed(2);
}

