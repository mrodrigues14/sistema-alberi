let idClienteSelecionado;

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
    const selectedEmpresa = document.getElementById('selectEmpresa').value;

    fetch('/cadastro/empresas')
        .then(response => response.json())
        .then(data => {
            const selectEmpresa = document.getElementById('selectEmpresa');
            selectEmpresa.innerHTML = '';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.text = 'Selecione uma empresa';
            selectEmpresa.appendChild(defaultOption);

            data.forEach(empresa => {
                const option = document.createElement('option');
                option.value = empresa.NOME;
                option.text = empresa.NOME;
                if (empresa.NOME === selectedEmpresa) {
                    option.selected = true;
                }
                selectEmpresa.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar empresas:', error);
        });
}



function addSocioEdit(socio = {}) {
    const socioSection = document.getElementById('socio-section-edit');
    const socioHtml = `
        <div class="form-group">
            <label for="socioNome">Nome do Sócio:</label>
            <input type="text" name="socioNome[]" value="${socio.NOME || ''}">
        </div>
        <div class="form-group">
            <label for="socioCpf">CPF do Sócio:</label>
            <input type="text" name="socioCpf[]" value="${socio.CPF || ''}">
        </div>
        <div class="form-group">
            <label for="socioEndereco">Endereço do Sócio:</label>
            <input type="text" name="socioEndereco[]" value="${socio.ENDERECO || ''}">
        </div>
        <div class="form-group">
            <label for="socioCep">CEP do Sócio:</label>
            <input type="text" name="socioCep[]" value="${socio.CEP || ''}">
        </div>
        <div class="form-group">
            <label for="socioTelefone">Telefone do Sócio:</label>
            <input type="text" name="socioTelefone[]" value="${socio.TELEFONE || ''}">
        </div>`;
    const newDiv = document.createElement('div');
    newDiv.innerHTML = socioHtml;
    socioSection.appendChild(newDiv);
}
function loadEmpresaDetails() {
    const empresaNome = document.getElementById('selectEmpresa').value;
    fetch(`/cadastro/empresa/${empresaNome}`)
        .then(response => response.json())
        .then(data => {
            if (data.CNPJ) {
                document.getElementById('form-juridica-edit').style.display = 'block';
                document.getElementById('form-fisica-edit').style.display = 'none';
                document.getElementById('nomeEmpresaEdit').value = data.NOME;
                document.getElementById('apelidoEmpresaEdit').value = data.APELIDO || '';
                document.getElementById('cnpjEdit').value = formatCpfCnpj(data.CNPJ || '');
                document.getElementById('enderecoEdit').value = data.ENDERECO || '';
                document.getElementById('cepEdit').value = data.CEP || '';
                document.getElementById('nomeResponsavelEdit').value = data.NOME_RESPONSAVEL || '';
                document.getElementById('cpfResponsavelEdit').value = data.CPF_RESPONSAVEL || '';
                document.getElementById('inscricaoEstadualEdit').value = data.INSCRICAO_ESTADUAL || '';
                document.getElementById('cnaePrincipalEdit').value = data.CNAE_PRINCIPAL || '';
                document.getElementById('telefoneEdit').value = data.TELEFONE || '';

                // Carregar sócios
                const socioSection = document.getElementById('socio-section-edit');
                socioSection.innerHTML = ''; // Limpar sócios existentes
                data.socios.forEach(socio => {
                    addSocioEdit(socio);
                });
            } else {
                document.getElementById('form-fisica-edit').style.display = 'block';
                document.getElementById('form-juridica-edit').style.display = 'none';
                document.getElementById('nomeFisicaEdit').value = data.NOME;
                document.getElementById('apelidoFisicaEdit').value = data.APELIDO || '';
                document.getElementById('cpfFisicaEdit').value = formatCpfCnpj(data.CPF || '');
                document.getElementById('enderecoFisicaEdit').value = data.ENDERECO || '';
                document.getElementById('cepFisicaEdit').value = data.CEP || '';
                document.getElementById('telefoneFisicaEdit').value = data.TELEFONE || '';
                document.getElementById('emailFisicaEdit').value = data.EMAIL || '';
            }

            idClienteSelecionado = data.IDCLIENTE;
            document.getElementById('editar-remover').style.display = 'block';
        })
        .catch(error => {
            console.error('Erro ao carregar detalhes da empresa:', error);
        });
}
function formatCpfCnpj(value) {
    if (value.length === 11) {
        return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'); // Formatar CPF
    } else if (value.length === 14) {
        return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'); // Formatar CNPJ
    }
    return value;
}

function confirmDelete() {
    if (!confirm('Tem certeza que deseja excluir o Cliente?')) {
        return false;
    }

    const userRole = localStorage.getItem('userRoles');

    const empresaNome = document.getElementById('selectEmpresa').value;
    fetch(`/cadastro/remover`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            selectNomeEmpresa: empresaNome,
            userRole: userRole
        })
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


function editClient() {
    const tipoCliente = document.getElementById('form-juridica-edit').style.display === 'block' ? 'juridica' : 'fisica';

    const data = {
        idCliente: idClienteSelecionado,
        tipoCliente: tipoCliente,
        nomeFisica: document.getElementById('nomeFisicaEdit').value || '',
        apelidoFisica: document.getElementById('apelidoFisicaEdit').value || '',
        telefoneFisica: document.getElementById('telefoneFisicaEdit').value || '',
        cpfFisica: document.getElementById('cpfFisicaEdit').value.replace(/[.\-\/]/g, '') || '',
        enderecoFisica: document.getElementById('enderecoFisicaEdit').value || '',
        cepFisica: document.getElementById('cepFisicaEdit').value || '',
        emailFisica: document.getElementById('emailFisicaEdit').value || '',
        nomeEmpresa: document.getElementById('nomeEmpresaEdit').value || '',
        apelidoEmpresa: document.getElementById('apelidoEmpresaEdit').value || '',
        telefone: document.getElementById('telefoneEdit').value || '',
        cnpj: document.getElementById('cnpjEdit').value.replace(/[.\-\/]/g, '') || '',
        endereco: document.getElementById('enderecoEdit').value || '',
        cep: document.getElementById('cepEdit').value || '',
        nomeResponsavel: document.getElementById('nomeResponsavelEdit').value || '',
        cpfResponsavel: document.getElementById('cpfResponsavelEdit').value.replace(/[.\-\/]/g, '') || '',
        inscricaoEstadual: document.getElementById('inscricaoEstadualEdit').value || '',
        cnaePrincipal: document.getElementById('cnaePrincipalEdit').value || '',
        socios: []
    };

    // Coletar dados dos sócios se houver
    const socioGroups = document.querySelectorAll('#socio-section-edit > div');
    socioGroups.forEach(group => {
        const socioNome = group.querySelector('input[name="socioNome[]"]').value;
        const socioCpf = group.querySelector('input[name="socioCpf[]"]').value.replace(/[.\-\/]/g, '');
        const socioEndereco = group.querySelector('input[name="socioEndereco[]"]').value;
        const socioCep = group.querySelector('input[name="socioCep[]"]').value;
        const socioTelefone = group.querySelector('input[name="socioTelefone[]"]').value;

        const socio = {
            nome: socioNome,
            cpf: socioCpf,
            endereco: socioEndereco,
            cep: socioCep,
            telefone: socioTelefone
        };
        data.socios.push(socio);
    });

    fetch(`/cadastro/editar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
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
