function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

let idcliente = 0;

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
    let nomeEmpresa = getStoredEmpresaName();
    fetch(`/insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const campoOculto = document.querySelector('input[name="idcliente"]');
                const campoOculto2 = document.querySelector('input[name="idcliente2"]');
                if (campoOculto) {
                    campoOculto.value = data[0].IDCLIENTE;
                    campoOculto2.value = data[0].IDCLIENTE;
                    idcliente = data[0].IDCLIENTE;
                    fetch(`/fornecedor/listar?idcliente=${idcliente}`)
                        .then(response => response.json())
                        .then(data =>{
                            const selectBanco = document.getElementById('selectBanco');
                            data.forEach(banco => {
                                const option = document.createElement('option');
                                option.value = banco.IDFORNECEDOR;
                                option.text = banco.NOME_TIPO;
                                selectBanco.appendChild(option);
                            });
                        })
                }
            }
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

document.addEventListener("DOMContentLoaded", function() {
    const formRemove = document.getElementById('formRemove');

    formRemove.addEventListener('submit', function(event) {
        event.preventDefault();
        const selectElement = document.getElementById('selectBanco');
        const empresa = selectElement.options[selectElement.selectedIndex].text;
        if (confirm('Tem certeza que deseja remover o fornecedor: ' + empresa + '?')) {
            formRemove.submit();
        } else {
            console.log('Remoção cancelada pelo usuário.');
        }
    });
});