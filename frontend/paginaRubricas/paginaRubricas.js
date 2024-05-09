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


    const nomeEmpresa = getStoredEmpresaName();
    fetch(`/insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const campoOculto = document.querySelector('input[name="idcliente"]');
                if (campoOculto) {
                    campoOculto.value = data[0].IDCLIENTE;
                    idCliente = data[0].IDCLIENTE;
                    fetch(`/categoria/dados?idcliente=${encodeURIComponent(idCliente)}`)
                        .then(response => response.json())
                        .then(data => {
                            const select = document.getElementById('seletorCategoria');
                            data.forEach(categoria => {
                                const option = document.createElement('option');
                                option.value = categoria.IDCATEGORIA;
                                const prefix = categoria.ID_CATEGORIA_PAI ? '— ' : '';
                                option.textContent = `${prefix}${categoria.NOME}`;
                                select.appendChild(option);
                            });
                        })
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
                    idCliente = data[0].IDCLIENTE;
                    fetch(`/categoria/dados?idcliente=${encodeURIComponent(idCliente)}`)
                        .then(response => response.json())
                        .then(data => {
                            const select = document.getElementById('seletorCategoria2');
                            data.forEach(categoria => {
                                const option = document.createElement('option');
                                option.value = categoria.IDCATEGORIA;
                                const prefix = categoria.ID_CATEGORIA_PAI ? '— ' : '';
                                option.textContent = `${prefix}${categoria.NOME}`;
                                select.appendChild(option);
                            });
                        })
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
                const campoOculto = document.querySelector('input[name="idcliente3"]');
                if (campoOculto) {
                    campoOculto.value = data[0].IDCLIENTE;
                    idCliente = data[0].IDCLIENTE;
                }
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados da empresa:', error);
        });

    fetch(`/insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const campoOculto = document.querySelector('input[name="idcliente4"]');
                if (campoOculto) {
                    campoOculto.value = data[0].IDCLIENTE;
                    idCliente = data[0].IDCLIENTE;
                    fetch(`/categoria/dados?idcliente=${encodeURIComponent(idCliente)}`)
                        .then(response => response.json())
                        .then(data => {
                            const select = document.getElementById('seletorCategoria3');
                            data.forEach(categoria => {
                                const option = document.createElement('option');
                                option.value = categoria.IDCATEGORIA;
                                const prefix = categoria.ID_CATEGORIA_PAI ? '— ' : '';
                                option.textContent = `${prefix}${categoria.NOME}`;
                                select.appendChild(option);
                            });
                        })
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
        const selectElement = document.getElementById('seletorCategoria2');
        const empresa = selectElement.options[selectElement.selectedIndex].text;
        if (confirm('Tem certeza que deseja remover a rubrica: ' + empresa + '?')) {
            formRemove.submit();
        } else {
            console.log('Remoção cancelada pelo usuário.');
        }
    });
});