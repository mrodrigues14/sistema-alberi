const userRole = localStorage.getItem('userRole');
const idusuario = localStorage.getItem('idusuario');
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
                        fetch(`/paginainicial/tarefas?isAdmin=true&idusuario=${idusuario}`)
                            .then(handleResponse)
                            .then(displayTarefas)
                            .catch(handleError);
                    } else {
                        fetch(`/paginainicial/tarefas?idcliente=${IDCLIENTE}&idusuario=${idusuario}`)
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
        row.dataset.id = tarefa.IDTAREFA;
        row.dataset.dataLimite = tarefa.DATA_LIMITE;
        row.dataset.recurrenceDay = tarefa.RECORRENCIA_DIA;

        row.insertCell().innerHTML = `<button class="${getStatusClass(tarefa.STATUS)}" onclick="completarTarefa(${tarefa.IDTAREFA})">
                                                   ${toTitleCase(tarefa.STATUS)}
                                                   </button>`;
        const taskCell = row.insertCell();
        taskCell.innerHTML = `<span name="tarefa">${tarefa.TITULO}</span>`;
        const dateCell = row.insertCell();
        dateCell.innerHTML = `<span name="data_limite">${tarefa.DATA_LIMITE}</span>`;
        row.insertCell().textContent = tarefa.DATA_INICIO ? formatDate(tarefa.DATA_INICIO) : '';
        row.insertCell().textContent = tarefa.DATA_CONCLUSAO ? formatDate(tarefa.DATA_CONCLUSAO) : '';
        const actionCell = row.insertCell();
        actionCell.innerHTML = `<button class="edit-button" onclick="editarTarefa(${tarefa.IDTAREFA})" style="width: 2.5vw;  cursor: pointer;">
                                                                  <img src="imagens/editarTarefa.png" style="width: 100%;">
                                                                  </button>`;
        row.insertCell().innerHTML = `<button class="delete-button" onclick="deletarTarefa(${tarefa.IDTAREFA})" style="width: 2.5vw;  cursor: pointer">
                                                                  <img src="imagens/lixeira.png" style="width: 100%;">
                </button>`;
    });

    checkRecurrenceDates();
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
    fetch('/paginainicial/consultarEmpresas', { method: 'POST' })
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

const recurrenceCheckbox = document.getElementById('recurrence-checkbox');
const recurrenceContainer = document.getElementById('recurrence-container');

if (recurrenceCheckbox && recurrenceContainer) {
    recurrenceCheckbox.addEventListener('change', () => {
        if (recurrenceCheckbox.checked) {
            recurrenceContainer.style.display = 'block';
        } else {
            recurrenceContainer.style.display = 'none';
            document.getElementById('recurrence-day').value = '';
        }
    });
}

function checkRecurrenceDates() {
    const today = new Date();
    const rows = document.querySelectorAll('#todo-table tbody tr');

    rows.forEach(row => {
        const recurrenceDay = row.dataset.recurrenceDay;
        if (recurrenceDay) {
            const recurrenceDate = new Date(row.dataset.dataLimite);
            recurrenceDate.setDate(recurrenceDay);

            const daysUntilRecurrence = Math.ceil((recurrenceDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilRecurrence === 7) {
                row.classList.add('flash');
            }
        }
    });
}

function adicionarTarefa() {
    const idcliente = IDCLIENTE;
    const titulo = document.getElementById('todo-input').value;
    const dataLimite = document.getElementById('todo-date').value;
    const dataInicial = new Date().toISOString().split('T')[0]; // Get current date
    const recurrenceSelect = document.getElementById('recurrence-day');
    if (!recurrenceSelect) {
        console.error('Element with ID "recurrence-select" not found in DOM');
        return;
    }
    const frequencia = recurrenceSelect.value;    const proximoPrazo = frequencia === 'semanal' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : // Set next due date to 7 days from now if weekly
        frequencia === 'mensal' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : // Set next due date to 30 days from now if monthly
            ''; // No recurrence, no need to set a next due date

    const recurrenceDay = document.getElementById('recurrence-day').value;

    fetch('/paginainicial/adicionartarefa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            titulo,
            dataLimite,
            dataInicial,
            frequencia,
            proximoPrazo,
            recurrenceDay,
            idcliente,
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
}// Até aqui js matheus edition

function formatDate(dateString, isInitialDate = false) {
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

    if (isInitialDate) {
        return `Iniciado em: ${day}/${month}/${year}`;
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

    const dataConclusao = new Date().toISOString().split('T')[0]; // Get current date

    fetch('/paginaInicial/atualizartarefa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            idtarefa,
            dataConclusao, // Send completion date to server
        }),
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
    const row = document.querySelector(`tr[data-id="${idAfazer}"]`);
    const taskInput = document.createElement('input');
    taskInput.type = 'text';
    taskInput.name = 'tarefa';
    taskInput.value = row.querySelector('[name="tarefa"]').textContent;

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.name = 'data_limite';
    dateInput.value = row.querySelector('[name="data_limite"]').value;

    const taskCell = row.querySelector('[name="tarefa"]').parentElement;
    taskCell.innerHTML = '';
    taskCell.appendChild(taskInput);

    const dateCell = row.querySelector('[name="data_limite"]').parentElement;
    dateCell.innerHTML = '';
    dateCell.appendChild(dateInput);

    const saveButton = document.createElement('button');
    saveButton.className = 'save-button';
    saveButton.textContent = 'Salvar';
    saveButton.style.display = 'inline-block';
    saveButton.onclick = () => salvarAlteracoes(idAfazer);

    const editButton = row.querySelector('.edit-button');
    editButton.style.display = 'none';

    const actionCell = row.querySelector('[name="action"]');
    actionCell.innerHTML = '';
    actionCell.appendChild(saveButton);
}

function salvarAlteracoes(idAfazer) {
    const row = document.querySelector(`tr[data-id="${idAfazer}"]`);
    const taskInput = row.querySelector('input[name="tarefa"]');
    const dateInput = row.querySelector('input[name="data_limite"]');
    const saveButton = row.querySelector('.save-button');
    const editButton = row.querySelector('.edit-button');

    const task = taskInput.value.trim();
    const date = dateInput.value;

    if (!task ||!date) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    fetch('/paginaInicial/editartarefa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            idtarefa: idAfazer,
            titulo: task,
            dataLimite: date
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao salvar alterações');
            }
            return response.json();
        })
        .then(data => {
            console.log('Alterações salvas com sucesso!');
            window.location.reload();
        })
        .catch(error => console.error('Erro ao salvar alterações:', error));

    taskInput.remove();
    dateInput.remove();
    saveButton.remove();
    editButton.style.display = 'inline-block';
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

