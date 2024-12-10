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
            editEmoji.addEventListener('click', () => editarEmpresa(empresa.IDCLIENTE));
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
function editarEmpresa(id) {
    alert(`Editar empresa com ID: ${id}`);
}

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
    modal.classList.toggle('show');
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
