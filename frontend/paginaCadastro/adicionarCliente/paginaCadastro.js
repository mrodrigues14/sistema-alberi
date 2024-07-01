document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadTemplateAndStyles();
    } catch (error) {
        console.error('Erro ao carregar o template:', error);
    }

    const userRole = localStorage.getItem('userRoles');
    document.getElementById('userRole').value = userRole;
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

function toggleClienteForm() {
    const tipoCliente = document.getElementById('tipoCliente').value;
    const formFisica = document.getElementById('form-fisica');
    const formJuridica = document.getElementById('form-juridica');
    const adicionarCliente = document.getElementById('Adicionar-cliente');

    if (tipoCliente === 'fisica') {
        formFisica.style.display = 'block';
        formJuridica.style.display = 'none';
        adicionarCliente.style.display = 'block';
    } else if (tipoCliente === 'juridica') {
        formFisica.style.display = 'none';
        formJuridica.style.display = 'block';
        adicionarCliente.style.display = 'block';
    } else {
        formFisica.style.display = 'none';
        formJuridica.style.display = 'none';
        adicionarCliente.style.display = 'none';
    }
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

function confirmAdd() {
    const userRole = localStorage.getItem('userRoles');
    if (userRole !== 'Administrador' && userRole !== 'Configurador') {
        alert('Você não tem permissão para adicionar um cliente.');
        return false;
    }
    return true;
}
