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
}

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

function addSocio() {
    const socioSection = document.getElementById('socio-section');
    const socioHtml = `
        <div class="form-group">
            <label for="socioNome">Nome do Sócio:</label>
            <input type="text" name="socioNome[]">
        </div>
        <div class="form-group">
            <label for="socioCpf">CPF do Sócio:</label>
            <input type="text" name="socioCpf[]">
        </div>
        <div class="form-group">
            <label for="socioEndereco">Endereço do Sócio:</label>
            <input type="text" name="socioEndereco[]">
        </div>
        <div class="form-group">
            <label for="socioCep">CEP do Sócio:</label>
            <input type="text" name="socioCep[]">
        </div>
        <div class="form-group">
            <label for="socioTelefone">Telefone do Sócio:</label>
            <input type="text" name="socioTelefone[]">
        </div>`;
    const newDiv = document.createElement('div');
    newDiv.innerHTML = socioHtml;
    socioSection.appendChild(newDiv);
}

function confirmDelete() {
    const selectBanco = document.getElementById('selectBanco');
    const selectedOption = selectBanco.options[selectBanco.selectedIndex].text;
    return confirm(`Tem certeza que deseja excluir o Cliente ${selectedOption}?`);
}