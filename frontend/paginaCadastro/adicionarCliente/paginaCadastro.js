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
        document.getElementById('cpfFisica').required = true;
        document.getElementById('nomeEmpresa').required = false;
        document.getElementById('cnpj').required = false;
    } else if (tipoCliente === 'juridica') {
        formFisica.style.display = 'none';
        formJuridica.style.display = 'block';
        adicionarCliente.style.display = 'block';
        document.getElementById('nomeEmpresa').required = true;
        document.getElementById('cnpj').required = true;
        document.getElementById('cpfFisica').required = false;
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

function submitForm() {
    const formAdd = document.getElementById('formAdd');
    const formData = new FormData(formAdd);

    const data = {
        nome: formData.get('nomeFisica') || formData.get('nomeEmpresa') || ' ',
        cpf: formData.get('cpfFisica') || formData.get('cpfResponsavel') || ' ',
        cnpj: formData.get('cnpj') || '',
        endereco: formData.get('enderecoFisica') || formData.get('endereco') || ' ',
        cep: formData.get('cepFisica') || formData.get('cep') || ' ',
        telefone: formData.get('telefoneFisica') || formData.get('telefone') || ' ',
        nome_responsavel: formData.get('nomeResponsavel') || ' ',
        cpf_responsavel: formData.get('cpfResponsavel') || ' ',
        inscricao_estadual: formData.get('inscricaoEstadual') || ' ',
        cnae_principal: formData.get('cnaePrincipal') || ' ',
        email: formData.get('emailFisica') || ' ',
        socios: []
    };

    // Coletar dados dos sócios se houver
    const socioGroups = document.querySelectorAll('#socio-section > div');
    socioGroups.forEach(group => {
        const socioNome = group.querySelector('input[name="socioNome[]"]');
        const socioCpf = group.querySelector('input[name="socioCpf[]"]');
        const socioEndereco = group.querySelector('input[name="socioEndereco[]"]');
        const socioCep = group.querySelector('input[name="socioCep[]"]');
        const socioTelefone = group.querySelector('input[name="socioTelefone[]"]');

        const socio = {
            nome: socioNome ? socioNome.value : '',
            cpf: socioCpf ? socioCpf.value : '',
            endereco: socioEndereco ? socioEndereco.value : '',
            cep: socioCep ? socioCep.value : '',
            telefone: socioTelefone ? socioTelefone.value : ''
        };
        data.socios.push(socio);
    });

    fetch('/cadastro/addCliente', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            alert(result.message);
            if (result.success) {
                window.location.href = `/cadastro?successMsg=${result.message}`;
            }
        })
        .catch(error => {
            console.error('Erro ao enviar o formulário:', error);
            alert('Erro ao enviar o formulário. Por favor, tente novamente.');
        });

    return false;
}
