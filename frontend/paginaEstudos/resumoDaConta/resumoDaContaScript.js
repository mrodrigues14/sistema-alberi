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

function fetchAndPopulateTable() {
    fetch('/api/data-endpoint')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('resumo-table').querySelector('tbody');
            tableBody.innerHTML = ''; // Clear the table body

            data.forEach(row => {
                const tr = document.createElement('tr');

                for (const key in row) {
                    const td = document.createElement('td');
                    td.textContent = row[key];
                    tr.appendChild(td);
                }

                tableBody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Failed to fetch data:', error);
        });
}

fetchAndPopulateTable();
