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

document.addEventListener('DOMContentLoaded', async () => {
    const tabelaEmpresas = document.querySelector('#empresa-table tbody');

    try {
        const response = await fetch('/cliente/empresas');
        const empresas = await response.json();
        empresas.forEach(empresa => {
            console.log(empresa)
            const tr = document.createElement('tr');

            // Coluna com o nome
            const tdNome = document.createElement('td');
            tdNome.textContent = empresa.NOME || 'Sem Nome';
            tr.appendChild(tdNome);

            // Coluna com ações
            const tdAcoes = document.createElement('td');
            tdAcoes.classList.add('actions');

            // Emoji de lápis (editar)
            const editEmoji = document.createElement('span');
            editEmoji.textContent = '✏️';
            editEmoji.title = 'Editar';
            editEmoji.addEventListener('click', () => editarEmpresa(empresa.NOME));
            tdAcoes.appendChild(editEmoji);

            // Emoji de lixeira (excluir)
            const deleteEmoji = document.createElement('span');
            deleteEmoji.textContent = '🗑️';
            deleteEmoji.title = 'Excluir';
            deleteEmoji.addEventListener('click', () => excluirEmpresa(empresa.NOME));
            tdAcoes.appendChild(deleteEmoji);

            tr.appendChild(tdAcoes);
            tabelaEmpresas.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao carregar as empresas:', error);
    }
});

// Funções de ação
function editarEmpresa(nome) {
    // Limpa os campos antes de buscar os dados
    resetEditModal();

    // Busca os dados do cliente
    fetch(`/cliente/empresa/${nome}`)
        .then(response => response.json())
        .then(cliente => {
            // Preenche o tipo de cliente
            const tipoCliente = cliente.CNPJ ? 'juridica' : 'fisica';
            document.getElementById('edit-tipo-cliente').value = tipoCliente;
            document.getElementById('edit-id-cliente').value = cliente.IDCLIENTE;

            if (tipoCliente === 'fisica') {
                document.getElementById('edit-fisica').style.display = 'block';
                document.getElementById('edit-juridica').style.display = 'none';

                document.getElementById('edit-nome-fisica').value = cliente.NOME || '';
                document.getElementById('edit-apelido-fisica').value = cliente.APELIDO || '';
                document.getElementById('edit-telefone-fisica').value = cliente.TELEFONE || '';
                document.getElementById('edit-cpf-fisica').value = cliente.CPF ? formatCPF(cliente.CPF) : ''; // Formata o CPF
                document.getElementById('edit-endereco-fisica').value = cliente.ENDERECO || '';
                document.getElementById('edit-cep-fisica').value = cliente.CEP || '';
                document.getElementById('edit-email-fisica').value = cliente.EMAIL || '';
            } else {
                document.getElementById('edit-fisica').style.display = 'none';
                document.getElementById('edit-juridica').style.display = 'block';

                document.getElementById('edit-nome-empresa').value = cliente.NOME || '';
                document.getElementById('edit-apelido-empresa').value = cliente.APELIDO || '';
                document.getElementById('edit-telefone').value = cliente.TELEFONE || '';
                document.getElementById('edit-cnpj').value = cliente.CNPJ ? formatCNPJ(cliente.CNPJ) : ''; // Formata o CNPJ
                document.getElementById('edit-endereco').value = cliente.ENDERECO || '';
                document.getElementById('edit-cep').value = cliente.CEP || '';
                document.getElementById('edit-nome-responsavel').value = cliente.NOME_RESPONSAVEL || '';
                document.getElementById('edit-cpf-responsavel').value = cliente.CPF_RESPONSAVEL || '';
                document.getElementById('edit-inscricao-estadual').value = cliente.INSCRICAO_ESTADUAL || '';
                document.getElementById('edit-cnae-principal').value = cliente.CNAE_PRINCIPAL || '';
                document.getElementById('edit-socios').value = JSON.stringify(cliente.socios || [], null, 2);
            }

            // Exibe o modal após preencher as informações
            toggleEditModal();
        })
        .catch(error => {
            console.error('Erro ao carregar os dados do cliente:', error);
            alert('Erro ao carregar os dados do cliente.');
        });
}

function toggleEditModal() {
    const modal = document.getElementById('edit-modal');
    modal.classList.toggle('show');
}

document.getElementById('edit-client-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Se os sócios estiverem preenchidos, converte para JSON
    if (data.socios) {
        try {
            data.socios = JSON.parse(data.socios);
        } catch {
            alert('Formato inválido para os sócios. Use um array JSON.');
            return;
        }
    }

    try {
        const response = await fetch('/cliente/editar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        if (result.success) {
            alert(result.message);
            toggleEditModal();
            location.reload(); // Atualiza a lista
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Erro ao editar cliente:', error);
        alert('Erro ao editar cliente.');
    }
});


function excluirEmpresa(nomeEmpresa) {
    if (confirm(`Tem certeza que deseja excluir a empresa: ${nomeEmpresa}?`)) {
        const userRole = localStorage.getItem('userRole');
    console.log(userRole)
        const data = { selectNomeEmpresa: nomeEmpresa, userRole }; // Pode adicionar o role do usuário se necessário

        fetch('/cliente/remover', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert(result.message); // Alerta com a resposta do sucesso
                    location.reload(); // Recarrega a página para atualizar a lista
                } else {
                    alert("Erro ao excluir empresa.");
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert("Erro ao excluir a empresa.");
            });
    }
}

document.getElementById('add-client-btn').addEventListener('click', toggleModal);

function toggleModal() {
    const modal = document.getElementById('modal');

    if (modal.classList.contains('show')) {
        // Primeiro, oculta o modal
        modal.classList.remove('show');

        // Depois que o modal estiver oculto, reseta os dados
        setTimeout(resetModal, 300); // Tempo para a transição de ocultação (caso tenha um efeito CSS)
    } else {
        // Exibe o modal
        modal.classList.add('show');
    }
}

// Função para limpar os dados do modal
function resetModal() {
    // Restaura os passos e exibe apenas o passo inicial
    document.getElementById('modal-step-1').style.display = 'block';
    document.getElementById('modal-step-2').style.display = 'none';

    // Oculta os formulários de pessoa física e jurídica
    document.getElementById('form-fisica').style.display = 'none';
    document.getElementById('form-juridica').style.display = 'none';

    // Reseta o campo de tipoCliente e o formulário
    document.getElementById('tipoCliente').value = '';
    document.getElementById('add-client-form').reset();
}

function toggleEditModal() {
    const modal = document.getElementById('edit-modal');

    if (modal.classList.contains('show')) {
        // Primeiro, oculta o modal
        modal.classList.remove('show');

        // Depois que o modal estiver oculto, reseta os dados
        setTimeout(resetEditModal, 300); // Tempo para transição (caso haja efeito CSS)
    } else {
        // Exibe o modal
        modal.classList.add('show');
    }
}

// Função para limpar e restaurar o modal de edição
function resetEditModal() {
    // Reseta apenas se os elementos existirem no DOM
    const camposFisica = [
        'edit-nome-fisica',
        'edit-apelido-fisica',
        'edit-telefone-fisica',
        'edit-cpf-fisica',
        'edit-endereco-fisica',
        'edit-cep-fisica',
        'edit-email-fisica'
    ];

    const camposJuridica = [
        'edit-nome-empresa',
        'edit-apelido-empresa',
        'edit-telefone',
        'edit-cnpj',
        'edit-endereco',
        'edit-cep',
        'edit-nome-responsavel',
        'edit-cpf-responsavel',
        'edit-inscricao-estadual',
        'edit-cnae-principal',
        'edit-socios'
    ];

    // Função auxiliar para limpar os campos
    function limparCampos(listaCampos) {
        listaCampos.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) campo.value = '';
        });
    }

    // Oculta os formulários
    document.getElementById('edit-fisica').style.display = 'none';
    document.getElementById('edit-juridica').style.display = 'none';

    // Limpa os campos físicos e jurídicos
    limparCampos(camposFisica);
    limparCampos(camposJuridica);

    // Reseta campos adicionais
    document.getElementById('edit-tipo-cliente').value = '';
    document.getElementById('edit-id-cliente').value = '';
}

function selectTipoCliente(tipoCliente) {
    // Definir o valor do campo tipoCliente
    document.getElementById('tipoCliente').value = tipoCliente;

    document.getElementById('modal-step-1').style.display = 'none';
    document.getElementById('modal-step-2').style.display = 'block';

    if (tipoCliente === 'fisica') {
        document.getElementById('form-fisica').style.display = 'block';
        document.getElementById('form-juridica').style.display = 'none';
    } else {
        document.getElementById('form-fisica').style.display = 'none';
        document.getElementById('form-juridica').style.display = 'block';
    }
}


// Envia o formulário via POST
document.getElementById('add-client-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    try {
        console.log(data)
        const response = await fetch('/cliente/addCliente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        if (result.success) {
            alert(result.message);
            toggleModal();
            location.reload(); // Atualiza a lista
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Erro ao cadastrar cliente:', error);
        alert('Erro ao cadastrar cliente.');
    }
});

// Formatar CPF: 000.000.000-00
function formatCPF(value) {
    return value
        .replace(/\D/g, '') // Remove caracteres não numéricos
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Formatar CNPJ: 00.000.000/0000-00
function formatCNPJ(value) {
    return value
        .replace(/\D/g, '') // Remove caracteres não numéricos
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,4})$/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

// Função para determinar se o valor é CPF ou CNPJ e formatar corretamente
function formatCPFOrCNPJ(value) {
    const onlyNumbers = value.replace(/\D/g, ''); // Remove caracteres não numéricos
    return onlyNumbers.length === 11 ? formatCPF(value) : formatCNPJ(value);
}
