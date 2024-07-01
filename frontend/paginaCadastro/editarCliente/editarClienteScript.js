document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadTemplateAndStyles();
    } catch (error) {
        console.error('Erro ao carregar o template:', error);
    }

    loadEmpresaOptions();
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

function loadEmpresaOptions() {
    fetch('/cadastro/empresas')
        .then(response => response.json())
        .then(data => {
            const selectEmpresa = document.getElementById('selectEmpresa');
            selectEmpresa.innerHTML = ''; // Clear previous options
            data.forEach(empresa => {
                const option = document.createElement('option');
                option.value = empresa.NOME;
                option.text = empresa.NOME;
                selectEmpresa.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar empresas:', error);
        });
}

function loadEmpresaDetails() {
    const empresaNome = document.getElementById('selectEmpresa').value;
    fetch(`/cadastro/empresa/${empresaNome}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('nomeEmpresaEdit').value = data.NOME;
            document.getElementById('cpfCnpjEdit').value = data.CPF || data.CNPJ || '';
            document.getElementById('editar-remover').style.display = 'block';
        })
        .catch(error => {
            console.error('Erro ao carregar detalhes da empresa:', error);
        });
}

function confirmDelete() {
    if (!confirm('Tem certeza que deseja excluir o Cliente?')) {
        return false;
    }

    const empresaNome = document.getElementById('selectEmpresa').value;
    fetch(`/cadastro/remover`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selectNomeEmpresa: empresaNome })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Cliente removido com sucesso');
                window.location.reload();
            } else {
                alert('Erro ao remover cliente');
            }
        })
        .catch(error => {
            console.error('Erro ao remover cliente:', error);
            alert('Erro ao remover cliente');
        });

    return false;
}

function cancelEdit() {
    document.getElementById('editar-remover').style.display = 'none';
    document.getElementById('select-cliente').style.display = 'block';
}

function editClient(event) {
    event.preventDefault();

    const empresaNome = document.getElementById('selectEmpresa').value;
    const nomeEmpresaEdit = document.getElementById('nomeEmpresaEdit').value;
    const cpfCnpjEdit = document.getElementById('cpfCnpjEdit').value;

    fetch(`/cadastro/editar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            selectNomeEmpresa: empresaNome,
            nomeEmpresaEdit: nomeEmpresaEdit,
            cpfCnpjEdit: cpfCnpjEdit
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Cliente editado com sucesso');
                window.location.reload();
            } else {
                alert('Erro ao editar cliente');
            }
        })
        .catch(error => {
            console.error('Erro ao editar cliente:', error);
            alert('Erro ao editar cliente');
        });
}
