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
                    document.getElementById('novoTipoProduto').value = fornecedorSelecionado.NOME_TIPO.split(' - ')[1];

                    const novoSeletorDocumento = document.getElementById('novoSeletorDocumento');
                    if (fornecedorSelecionado.CPF) {
                        novoSeletorDocumento.value = 'CPF';
                        document.getElementById('novoCpf').value = fornecedorSelecionado.CPF;
                        document.getElementById('novoCpf').style.display = 'block';
                        document.getElementById('novoCnpj').style.display = 'none';
                    } else {
                        novoSeletorDocumento.value = 'CNPJ';
                        document.getElementById('novoCnpj').value = fornecedorSelecionado.CNPJ;
                        document.getElementById('novoCpf').style.display = 'none';
                        document.getElementById('novoCnpj').style.display = 'block';
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
                return response.text();
            } else {
                throw new Error('Erro ao adicionar fornecedor');
            }
        })
        .then(successMsg => {
            alert(successMsg);
            location.reload();
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
