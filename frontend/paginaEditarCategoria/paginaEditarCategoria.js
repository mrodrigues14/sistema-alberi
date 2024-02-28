
let idCliente = 0;

function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

window.onload = function() {
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

    fetch('/categoria/dados')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('seletorCategoria');
            data.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.IDCATEGORIA;
                option.textContent = categoria.NOME;
                select.appendChild(option);
            });
        })

        const nomeEmpresa = getStoredEmpresaName();
        fetch(`/insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const campoOculto = document.querySelector('input[name="idcliente"]');
                if (campoOculto) {
                    campoOculto.value = data[0].IDCLIENTE;
                } else {
                    console.error('Campo oculto id_empresa não encontrado');
                }
            } else {
                console.error('Dados da empresa não retornados ou vazios');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados da empresa:', error);
        });

        fetch(`/insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const campoOculto = document.querySelector('input[name="idcliente2"]');
                if (campoOculto) {
                    campoOculto.value = data[0].IDCLIENTE;
                } else {
                    console.error('Campo oculto id_empresa não encontrado');
                }
            } else {
                console.error('Dados da empresa não retornados ou vazios');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados da empresa:', error);
        });
}