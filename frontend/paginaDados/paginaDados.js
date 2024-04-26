function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

let idcliente = 0;

window.onload = function () {
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

    nomeEmpresa = getStoredEmpresaName();
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
                fetch(`/dados/bancos?idcliente=${idcliente}`)
                .then(response => response.json())
                .then(data =>{
                    const selectBanco = document.getElementById('selectBanco');
                    data.forEach(banco => {
                        const option = document.createElement('option');
                        option.value = banco.IDBANCO;
                        option.text = banco.NOME_TIPO;
                        selectBanco.appendChild(option);
                    });
                })
            }
        }
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
