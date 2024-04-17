const userRole = localStorage.getItem('userRole');
const idusuario = localStorage.getItem('idusuario');

console.log(userRole);
console.log(idusuario);

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
                loadNomeEmpresa();
            };
            document.body.appendChild(script);
        })
        .catch(error => {
            console.error('Erro ao carregar o template:', error);
        });

    const form = document.getElementById('todo-list-form');
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Impede o envio do formulário da maneira tradicional
        adicionarTarefa(); // Chama a função que irá lidar com a adição da tarefa
    });
});

let IDCLIENTE = 0;

window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
                document.querySelector('.dropbtn').classList.remove('active');
                var empresaSelecionada = document.querySelector('.empresaSelecionada');
                empresaSelecionada.style.borderRadius = '0 0 5px 5px';
            }
        }
    }
}

window.onload = function() {
    const nomeEmpresa = localStorage.getItem('nomeEmpresaSelecionada');
    fetch(`/insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const campoOculto = document.getElementById('idcliente')
                if (campoOculto) {
                    campoOculto.value = data[0].IDCLIENTE;
                    IDCLIENTE = data[0].IDCLIENTE;
                    if (userRole === 'MUDARDEPOIS') {
                        fetch(`/paginaInicial/tarefas?isAdmin=true&idusuario=${idusuario}`)
                            .then(handleResponse)
                            .then(displayTarefas)
                            .catch(handleError);
                    } else {
                        fetch(`/paginaInicial/tarefas?idcliente=${IDCLIENTE}&idusuario=${idusuario}`)
                            .then(handleResponse)
                            .then(displayTarefas)
                            .catch(handleError);
                    }
                }
            }
        })
        .catch(error => {
            console.error('Erro ao buscar o idcliente:', error);
        });
}

function handleResponse(response) {
    if (!response.ok) {
        throw new Error('Erro ao buscar as tarefas');
    }
    return response.json();
}

function displayTarefas(data) {
    const table = document.getElementById('todo-table');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    data.forEach(tarefa => {
        const row = tbody.insertRow();
        row.insertCell().innerHTML = `<button class="${getStatusClass(tarefa.STATUS)}" onclick="completarTarefa(${tarefa.IDTAREFA})">
                                                   ${toTitleCase(tarefa.STATUS)}
                                                   </button>`;
        row.insertCell().textContent = firstLetterToUpperCase(tarefa.TITULO);
        row.insertCell().textContent = formatDate(tarefa.DATA_LIMITE);
        row.insertCell().innerHTML = `<button class="edit-button" onclick="editarTarefa(${tarefa.IDTAREFA})" style="width: 2.5vw;  cursor: pointer;">
                                                                  <img src="imagens/editar.png" style="width: 100%;">
                                                                  </button>`;
        row.insertCell().innerHTML = `<button class="delete-button" onclick="deletarTarefa(${tarefa.IDTAREFA})" style="width: 2.5vw;  cursor: pointer">
                                                                  <img src="imagens/lixeira.png" style="width: 100%;">
                                                                  </button>`;
    });
}

function handleError(error) {
    console.error('Erro na requisição:', error);
}
function loadAndDisplayUsername() {
    fetch('/api/usuario-logado')
        .then(response => {
            if (!response.ok) {
                throw new Error('Não foi possível obter o nome do usuário logado');
            }
            return response.json();
        })
        .then(data => {
            const userButton = document.querySelector('.usernameDisplay');
            if (userButton && data.username) {
                userButton.textContent = data.username;
            }
        })
        .catch(error => {
            console.error('Erro:', error);
        });
}


function loadNomeEmpresa() {
    fetch('/paginaInicial/consultarEmpresas', { method: 'POST' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Não foi possível buscar as empresas');
            }
            return response.json();
        })
        .then(data => {
            inputNomeEmpresa(data);
            addClickEventToListItems();
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
        });
}
function addClickEventToListItems() {
    var listItems = document.querySelectorAll('.name-list li');
    listItems.forEach(function(item) {
        item.addEventListener('click', redirecionamentoDePagina);
    });
}

function redirecionamentoDePagina() {
    window.location.href = '/paginaInicial';
}

function inputNomeEmpresa(names) {
    var input = document.getElementById('searchInput');
    var list = document.getElementById('nameList');

    if (input && list) {
        input.addEventListener('input', function (e) {
            updateList(e.target.value);
        });

        document.querySelector('.arrow-button').addEventListener('click', function () {
            updateList('');
        });

        list.addEventListener('click', function (e) {
            if (e.target.tagName === 'LI') {
                input.value = e.target.textContent;
                list.style.display = 'none';

                empresaSelecionada(e.target.textContent);
            }
        });

        function updateList(filter) {
            var filteredNames = names.filter(function (name) {
                return name.toLowerCase().includes(filter.toLowerCase());
            });

            list.innerHTML = '';
            filteredNames.forEach(function (name) {
                var li = document.createElement('li');
                li.textContent = name;
                list.appendChild(li);
            });

            list.style.display = filteredNames.length ? 'block' : 'none';
        }
    }
    else{
        console.error('Elementos input ou list não foram encontrados!');
    }
}

function empresaSelecionada(nomeEmpresa) {
    localStorage.setItem('nomeEmpresaSelecionada', nomeEmpresa);
    updateNomeEmpresa(nomeEmpresa);
}

function updateNomeEmpresa(nomeEmpresa) {
    setTimeout(() => {
        var empresaSelecionadaButton = document.querySelector('.empresaSelecionada');
        if (empresaSelecionadaButton) {
            empresaSelecionadaButton.textContent = nomeEmpresa;
        }
    }, 0);
}

addClickEventToListItems();
document.addEventListener('DOMContentLoaded', function() {
    loadNomeEmpresa();
});

function adicionarTarefa() {
    const titulo = document.getElementById('todo-input').value;
    const dataLimite = document.getElementById('todo-date').value;
    const idcliente = IDCLIENTE;

    fetch('/paginaInicial/adicionartarefa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            titulo,
            dataLimite,
            idcliente,
            idusuario,
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao adicionar tarefa');
            }
            return response.json();
        })
        .then(data => {
            console.log('Tarefa adicionada com sucesso', data);
            window.location.reload();
        })
        .catch(error => {
            console.error('Erro ao adicionar tarefa:', error);
        });
}
// Até aqui js matheus edition

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const dias = Math.floor((date - today) / (1000 * 60 * 60 * 24));

    if (dias < 0) {
        return `${day}/${month}/${year}`;
    } else if (dias === 0) {
        return `${day}/${month}/${year} (Hoje)`;
    } else if (dias === 1) {
        return `${day}/${month}/${year} (Amanhã)`;
    } else {
        return `${day}/${month}/${year} (Faltam ${dias} dias)`;
    }
}


function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

function firstLetterToUpperCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'concluído':
            return 'status-concluido';
        case 'pendente':
            return 'status-pendente';
        case 'não foi iniciado':
            return 'status-atrasado';
        default:
            return '';
    }
}

function completarTarefa(idtarefa) {
    fetch('/paginaInicial/atualizartarefa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idtarefa })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao atualizar a tarefa');
            }
            return response.json();
        })
        .then(data => {
            window.location.reload();
        })
        .catch(error => console.error('Erro ao atualizar a tarefa:', error));
}

function editarTarefa(idAfazer) {
    const urlDeEdicao = `/paginaInicial/editartarefa?id=${idAfazer}`;

    const iframe = document.createElement('iframe');
    iframe.src = urlDeEdicao;
    iframe.style.width = "100%";
    iframe.style.height = "100%"

    const iframeContainer = document.getElementById('iframe-container');
    iframeContainer.innerHTML = '';
    iframeContainer.appendChild(iframe);

    iframeContainer.style.display = 'block';
}

function deletarTarefa(idtarefa) {
    fetch('/paginaInicial/deletartarefa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idtarefa })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao deletar a tarefa');
            }
            window.location.reload(true);
        })
        .catch(error => console.error('Erro ao deletar a tarefa:', error));
}

document.addEventListener('message', function(event) {
    if (event.data === 'recarregarPagina') {
        window.location.reload();
    }
}, false);

