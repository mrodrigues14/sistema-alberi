function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

let idcliente = 0;

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

    carregarFornecedores();
});

document.addEventListener('DOMContentLoaded', function() {
    const seletorDocumento = document.getElementById('seletorCNPJ');
    const cpfInput = document.getElementById('cpf');
    const cnpjInput = document.getElementById('cnpj');

    seletorDocumento.addEventListener('change', function() {
        const selectedValue = seletorDocumento.value;
        if (selectedValue === '0') {
            cpfInput.style.display = 'block';
            cnpjInput.style.display = 'none';
        } else {
            cpfInput.style.display = 'none';
            cnpjInput.style.display = 'block';
        }
    });

    cpfInput.style.display = 'block';
    cnpjInput.style.display = 'none';
});

document.addEventListener('DOMContentLoaded', function() {
    let nomeEmpresa = getStoredEmpresaName();
    fetch(`/insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                idcliente = data[0].IDCLIENTE;
                carregarFornecedores(idcliente);
            }
        });
});

function carregarFornecedores(idcliente) {
    fetch(`/fornecedor/listar?idcliente=${idcliente}`)
        .then(response => response.json())
        .then(fornecedores => {
            const listaElement = document.getElementById('fornecedor-lista');
            listaElement.innerHTML = ''; // Limpar lista antes de renderizar os fornecedores

            fornecedores.forEach(fornecedor => {
                console.log(fornecedor)
                const listItem = document.createElement('li');
                listItem.classList.add('fornecedor');

                // Exibe o nome do fornecedor e armazena o IDFORNECEDOR
                const span = document.createElement('span');
                span.textContent = fornecedor.NOME_TIPO.split(' - ')[0]; // Nome do fornecedor
                listItem.appendChild(span);

                // Criar o container para as ações de editar e remover
                const actions = document.createElement('div');
                actions.classList.add('actions');
                actions.innerHTML = `
                    <button class="edit" onclick="abrirPopupEditarFornecedor(${fornecedor.IDFORNECEDOR})">✏️</button>
                    <button class="delete" onclick="removerFornecedor(${fornecedor.IDFORNECEDOR})">🗑️</button>
                `;
                listItem.appendChild(actions);

                // Anexar o item da lista ao elemento da lista
                listaElement.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar os fornecedores:', error);
        });
}
function abrirPopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.style.display = 'flex';
    }
}

function abrirPopupEditarFornecedor(idFornecedor) {
    fetch(`/fornecedor/dados/${idFornecedor}`)
        .then(response => response.json())
        .then(fornecedor => {
            const popup = document.getElementById('popup-editar-fornecedor');
            document.getElementById('fornecedorId').value = fornecedor.IDFORNECEDOR;
            document.getElementById('novoNomeFornecedor').value = fornecedor.NOME;
            document.getElementById('novoTipoProduto').value = fornecedor.TIPO_DE_PRODUTO || '';

            const novoSeletorDocumento = document.getElementById('novoSeletorDocumento');
            if (fornecedor.CPF) {
                novoSeletorDocumento.value = 'CPF';
                document.getElementById('novoCpf').value = fornecedor.CPF;
                document.getElementById('novoCnpj').style.display = 'none';
            } else {
                novoSeletorDocumento.value = 'CNPJ';
                document.getElementById('novoCnpj').value = fornecedor.CNPJ;
                document.getElementById('novoCpf').style.display = 'none';
            }

            popup.style.display = 'flex';
        })
        .catch(error => {
            console.error('Erro ao buscar fornecedor:', error);
        });
}
function fecharPopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.style.display = 'none';
    }
}

function adicionarFornecedor(event) {
    event.preventDefault();

    const nomeFornecedor = document.getElementById('nomeEmpresa').value;
    const tipoDocumento = document.getElementById('seletorCNPJ').value;
    const cpf = document.getElementById('cpf').value || null;
    const cnpj = document.getElementById('cnpj').value || null;
    const tipoProduto = document.getElementById('tipoProduto').value || null;

    const dados = {
        nomeFornecedor,
        tipoProduto,
        idcliente
    };

    if (tipoDocumento === '0' && cpf) {
        dados.cpf = cpf;
    } else if (tipoDocumento === '1' && cnpj) {
        dados.cnpj = cnpj;
    }

    fetch('/fornecedor/adicionar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
    })
        .then(response => {
            if (response.ok) {
                alert('Fornecedor adicionado com sucesso!');
                location.reload();
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao adicionar o fornecedor.');
        });
}

function editarFornecedor(event) {
    event.preventDefault();

    const fornecedorId = document.getElementById('fornecedorId').value;
    const nomeFornecedor = document.getElementById('novoNomeFornecedor').value;
    const tipoDocumento = document.getElementById('novoSeletorDocumento').value;
    const cpf = document.getElementById('novoCpf').value || null;
    const cnpj = document.getElementById('novoCnpj').value || null;
    const tipoProduto = document.getElementById('novoTipoProduto').value || null;

    const dados = {
        idFornecedor: fornecedorId,
        nomeFornecedor,
        cpf,
        cnpj,
        tipoProduto
    };

    fetch('/fornecedor/editar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Erro ao editar fornecedor');
            }
        })
        .then(data => {
            if (data.success) {
                alert(data.message);
                window.location.href = '/fornecedor';
            } else {
                throw new Error('Erro ao editar fornecedor');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao editar o fornecedor.');
        });
}


function removerFornecedor(idFornecedor) {
    if (confirm('Tem certeza que deseja remover este fornecedor?')) {
        fetch('/fornecedor/remover', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idFornecedor, idcliente }) // Enviando idFornecedor e idcliente
        })
            .then(response => {
                if (response.ok) {
                    return response.json(); // Processa a resposta JSON do servidor
                } else {
                    throw new Error('Erro ao remover fornecedor');
                }
            })
            .then(data => {
                if (data.success) {
                    alert(data.message); // Exibe uma mensagem de sucesso
                    location.reload(); // Recarrega a página para atualizar a lista
                } else {
                    throw new Error('Erro ao remover fornecedor');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Ocorreu um erro ao remover o fornecedor.');
            });
    }
}
