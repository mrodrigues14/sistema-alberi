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

    fetch('/cadastro/empresas')
        .then(response => response.json())
        .then(data => {
            let selectBanco = document.getElementById('selectBanco');
            let selectEmpresa = document.getElementById('selectEmpresa');
            data.forEach(empresa => {
                let option = document.createElement('option');
                option.value = empresa.NOME;
                option.text = empresa.NOME;
                selectBanco.appendChild(option);

                let optionEdit = document.createElement('option');
                optionEdit.value = empresa.NOME;
                optionEdit.text = empresa.NOME;
                selectEmpresa.appendChild(optionEdit);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar empresas:', error);
        });
});

function loadEmpresaDetails() {
    const empresaNome = document.getElementById('selectEmpresa').value;
    fetch(`/cadastro/empresa/${empresaNome}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('nomeEmpresaEdit').value = data.NOME;
            document.getElementById('cpfCnpjEdit').value = data.CPF || data.CNPJ || '';
        })
        .catch(error => {
            console.error('Erro ao carregar detalhes da empresa:', error);
        });
}
