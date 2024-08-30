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
            const selectBanco = document.getElementById('selectBanco');
            const selectEditFornecedor = document.getElementById('selectEditFornecedor');

            fornecedores.forEach(fornecedor => {
                const nomeFornecedor = fornecedor.NOME_TIPO.split(' - ')[0]; // Removendo o traço e qualquer coisa após ele
                const option = document.createElement('option');
                option.value = fornecedor.IDFORNECEDOR;
                option.text = nomeFornecedor; // Exibe apenas o nome do fornecedor
                selectBanco.appendChild(option);
                selectEditFornecedor.appendChild(option.cloneNode(true));
            });

            selectEditFornecedor.addEventListener('change', function() {
                const fornecedorSelecionadoId = this.value;
                const fornecedorSelecionado = fornecedores.find(f => f.IDFORNECEDOR == fornecedorSelecionadoId);

                if (fornecedorSelecionado) {
                    document.getElementById('novoNomeFornecedor').value = fornecedorSelecionado.NOME_TIPO.split(' - ')[0];
                    document.getElementById('novoTipoProduto').value = fornecedorSelecionado.NOME_TIPO.split(' - ')[1] || '';

                    const novoSeletorDocumento = document.getElementById('novoSeletorDocumento');
                    const cpfField = document.getElementById('novoCpf');
                    const cnpjField = document.getElementById('novoCnpj');

                    if (fornecedorSelecionado.CPF) {
                        novoSeletorDocumento.value = 'CPF';
                        cpfField.value = fornecedorSelecionado.CPF || '';
                        cpfField.style.display = 'block';
                        cnpjField.style.display = 'none';
                    } else if (fornecedorSelecionado.CNPJ) {
                        novoSeletorDocumento.value = 'CNPJ';
                        cnpjField.value = fornecedorSelecionado.CNPJ || '';
                        cpfField.style.display = 'none';
                        cnpjField.style.display = 'block';
                    } else {
                        // Se CPF e CNPJ forem nulos ou undefined
                        cpfField.value = '';
                        cnpjField.value = '';
                        cpfField.style.display = 'block';
                        cnpjField.style.display = 'none';
                    }
                }
            });
        });
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

    if (tipoDocumento === '0') {
        dados.cpf = cpf;
    } else {
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
        if (confirm('Tem certeza que deseja remover o fornecedor: ' + empresa + '?')) {
            formRemove.submit();
        } else {
            console.log('Remoção cancelada pelo usuário.');
        }
    });
});

function editarFornecedor() {
    const fornecedorId = document.getElementById('selectEditFornecedor').value;
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
                // A resposta será redirecionada, então não capturamos o texto de sucesso aqui
                window.location.href = '/fornecedor?successMsg=Fornecedor%20' + encodeURIComponent(nomeFornecedor) + '%20editado%20com%20sucesso!';
            } else {
                throw new Error('Erro ao editar fornecedor');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao editar o fornecedor.');
        });
}

document.addEventListener("DOMContentLoaded", function() {
    const params = new URLSearchParams(window.location.search);
    const successMsg = params.get('successMsg');
    if (successMsg) {
        alert(successMsg);
        history.pushState(null, '', window.location.pathname);  // Remove o parâmetro da URL
    }
});

function removerFornecedor() {
    const selectElement = document.getElementById('selectBanco');
    const fornecedorId = selectElement.value;  // Pegando o valor do ID do fornecedor
    const fornecedorNome = selectElement.options[selectElement.selectedIndex].text;

    if (confirm('Tem certeza que deseja remover o fornecedor: ' + fornecedorNome + '?')) {
        fetch('/fornecedor/remover', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ selectNomeEmpresa: fornecedorId, idcliente2: idcliente }) // Enviando o ID do fornecedor e o ID do cliente
        })
            .then(response => {
                if (response.ok) {
                    alert('Fornecedor removido com sucesso!');
                    location.reload(); // Atualiza a página para refletir a remoção
                } else {
                    throw new Error('Erro ao remover fornecedor');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Ocorreu um erro ao remover o fornecedor.');
            });
    } else {
        console.log('Remoção cancelada pelo usuário.');
    }
}

