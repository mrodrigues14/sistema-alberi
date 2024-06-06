function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

let idcliente = 0;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadTemplateAndStyles();
    } catch (error) {
        console.error('Erro ao carregar o template:', error);
    }
});

async function loadTemplateAndStyles() {
    const cachedCSS = localStorage.getItem('templateCSS');
    const cachedHTML = localStorage.getItem('templateHTML');

    if (cachedCSS && cachedHTML) {
        applyCSS(cachedCSS);
        applyHTML(cachedHTML);
    } else {
        const [cssData, htmlData] = await Promise.all([
            fetchText('/templateMenu/styletemplate.css'),
            fetchText('/templateMenu/template.html')
        ]);

        localStorage.setItem('templateCSS', cssData);
        localStorage.setItem('templateHTML', htmlData);

        applyCSS(cssData);
        applyHTML(htmlData);
    }

    const script = document.createElement('script');
    script.src = '/templateMenu/templateScript.js';
    script.onload = function() {
        loadAndDisplayUsername();
        handleEmpresa();
        loadNomeEmpresa();
    };
    document.body.appendChild(script);
}

function fetchText(url) {
    return fetch(url).then(response => response.text());
}

function applyCSS(cssData) {
    const style = document.createElement('style');
    style.textContent = cssData;
    document.head.appendChild(style);
}

function applyHTML(htmlData) {
    document.getElementById('menu-container').innerHTML = htmlData;
}


document.addEventListener('DOMContentLoaded', (event) => {
    const nomeEmpresa = getStoredEmpresaName();
    if (nomeEmpresa) {
        fetch(`/insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const campoOculto = document.querySelector('input[name="idcliente"]');
                    const campoOculto2 = document.querySelector('input[name="idcliente2"]');
                    if (campoOculto && campoOculto2) {
                        campoOculto.value = data[0].IDCLIENTE;
                        campoOculto2.value = data[0].IDCLIENTE;
                        idcliente = data[0].IDCLIENTE;
                    }
                    fetch(`/dados/bancos?idcliente=${idcliente}`)
                        .then(response => response.json())
                        .then(data => {
                            const selectBanco = document.getElementById('selectBanco');
                            data.forEach(banco => {
                                const option = document.createElement('option');
                                option.value = banco.IDBANCO;
                                option.text = banco.NOME_TIPO;
                                selectBanco.appendChild(option);
                            });
                        });
                }
            })
            .catch(error => {
                console.error('Erro ao carregar dados da empresa:', error);
            });
    }
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
        if (confirm('Tem certeza que deseja remover o banco: ' + empresa + '?')) {
            formRemove.submit();
        } else {
            console.log('Remoção cancelada pelo usuário.');
        }
    });
});
