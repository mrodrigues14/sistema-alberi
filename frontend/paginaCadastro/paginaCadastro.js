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
            };            document.body.appendChild(script);
        })
        .catch(error => {
            console.error('Erro ao carregar o template:', error);
        });
});

document.addEventListener('DOMContentLoaded', function() {
    var seletor = document.getElementById('seletorCNPJ');
    var cpfInput = document.getElementById('cpf');
    var cnpjInput = document.getElementById('cnpj');

    function toggleInputs() {
        var selectedValue = seletor.options[seletor.selectedIndex].value;

        if(selectedValue === '0') {
            cpfInput.style.display = 'block';
            cnpjInput.style.display = 'none';
        }
        else if(selectedValue === '1') {
            cpfInput.style.display = 'none';
            cnpjInput.style.display = 'block';
        }
    }
    seletor.addEventListener('change', toggleInputs);

    cpfInput.style.display = 'none';
    cnpjInput.style.display = 'none';

    seletor.selectedIndex = 0;
    toggleInputs();
});

document.addEventListener('DOMContentLoaded', function() {
    var seletor = document.getElementById('seletorCNPJ');
    var cpfLabel = document.querySelector('label[for="cpf"]');
    var cnpjLabel = document.querySelector('label[for="cnpj"]');
    function toggleLabels() {
        var selectedValue = seletor.options[seletor.selectedIndex].value;

        if(selectedValue === '0') {
            cpfLabel.style.display = 'block';
            cnpjLabel.style.display = 'none';
        } else if(selectedValue === '1') {
            cpfLabel.style.display = 'none';
            cnpjLabel.style.display = 'block';
        }
    }

    seletor.addEventListener('change', toggleLabels);

    cpfLabel.style.display = 'none';
    cnpjLabel.style.display = 'none';

    seletor.selectedIndex = 0;
    toggleLabels();
});

document.addEventListener('DOMContentLoaded', function() {
    fetch('/cadastro/empresas')
        .then(response => response.json())
        .then(data => {
            let empresas =  document.getElementById('selectBanco');
            data.forEach(empresa => {
                let option = document.createElement('option');
                option.value = empresa.NOME;
                option.text = empresa.NOME;
                empresas.appendChild(option);
            });
        })
});

document.addEventListener('DOMContentLoaded', function() {
    fetch('/cadastro/empresas')
        .then(response => response.json())
        .then(data => {
            let empresas =  document.getElementById('selectEmpresa');
            data.forEach(empresa => {
                let option = document.createElement('option');
                option.value = empresa.NOME;
                option.text = empresa.NOME;
                empresas.appendChild(option);
            });
        })
});

document.addEventListener('DOMContentLoaded', (event) => {
    const params = new URLSearchParams(window.location.search);
    const successMsg = params.get('successMsg');
    if (successMsg) {
        alert(successMsg);
        history.pushState(null, '', window.location.pathname);
    }
});
