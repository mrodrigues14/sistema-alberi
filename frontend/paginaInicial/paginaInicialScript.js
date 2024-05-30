document.addEventListener('DOMContentLoaded', function() {
    loadUserOptions();
    loadCompanyOptions();
    loadTasks();

    fetch('/templateMenu/template.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('menu-container').innerHTML = data;
            const link = document.createElement('link');
            link.href = '/templateMenu/styletemplate.css';
            link.rel = 'stylesheet';
            link.type = 'text/css';
            document.head.appendChild(link);

            const script = document.createElement('script');
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
});

const listColumns = document.querySelectorAll(".drag-item-list");
let listArrays = [[], [], [], [], [], []];
let currentColumn;
let draggedItem;


function loadTasks() {
    const idcliente = localStorage.getItem('idEmpresaSelecionada');
    const idusuario = localStorage.getItem('idusuario');
    let adminRole = localStorage.getItem('userRoles');
    console.log(adminRole);
    let isAdmin = (adminRole === 'Administrador');
    fetch(`/paginaInicial/tarefas?idcliente=${idcliente}&idusuario=${idusuario}&isAdmin=${isAdmin}`)
        .then(response => response.json())
        .then(data => {
            listArrays = [[], [], [], [], [], []]; // Certifique-se de que há seis colunas
            data.forEach(task => {
                let column = 0;
                switch (task.STATUS) {
                    case 'Pendentes de Dados':
                        column = 0;
                        break;
                    case 'A Fazer':
                        column = 1;
                        break;
                    case 'Em Execução':
                        column = 2;
                        break;
                    case 'Finalizado':
                        column = 3;
                        break;
                    case 'Entregas do Dia':
                        column = 4;
                        break;
                    case 'Reunião':
                        column = 5;
                        break;
                    default:
                        column = 0;
                        break;
                }

                const itemObject = {
                    idtarefa: task.IDTAREFA,
                    title: task.TITULO,
                    dueDate: task.DATA_LIMITE,
                    author: task.ID_USUARIO,
                    authorName: task.NOME_DO_USUARIO,
                    companyId: task.IDEMPRESA,
                    companyName: task.NOME,
                    status: task.STATUS,
                    description: task.DESCRICAO || ""
                };

                listArrays[column].push(itemObject);
            });

            updateDOM();
        })
        .catch(error => {
            console.error('Erro ao carregar tarefas:', error);
        });
}

function loadUserOptions() {
    fetch('/paginaInicial/listaUsuarios')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('author');
            const loggedUserId = localStorage.getItem('idusuario');
            select.innerHTML = '';
            data.forEach(user => {
                const option = document.createElement('option');
                option.value = user.IDUSUARIOS;
                option.textContent = user.NOME_DO_USUARIO;
                select.appendChild(option);
            });
            // Pré-seleciona o usuário logado
            select.value = loggedUserId;
        })
        .catch(error => {
            console.error('Erro ao carregar usuários:', error);
        });
}
function loadCompanyOptions() {
    fetch('/paginaInicial/listaEmpresas')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('company');
            select.innerHTML = '';
            data.forEach(company => {
                const option = document.createElement('option');
                option.value = company.IDCLIENTE;
                option.textContent = company.NOME;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar empresas:', error);
        });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate() + 1).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `Data Limite: ${day}/${month}/${year}`;
}

function createItemEl(columnEl, column, item, index) {
    const listEl = document.createElement("li");
    listEl.classList.add("drag-item");
    listEl.draggable = true;
    listEl.setAttribute("onfocusout", `updateItem(${index}, ${column})`);
    listEl.setAttribute("ondragstart", "drag(event)");
    listEl.setAttribute("data-idtarefa", item.idtarefa);
    listEl.setAttribute("onclick", `showTaskDetails(${index}, ${column})`);
    listEl.innerHTML = `
        <div class="item-content">
            <div class="item-header">
                <div class="edit-icon" onclick="editItem(${index}, ${column}); event.stopPropagation();">&#9998;</div>
                <div class="delete-icon" onclick="showDeleteConfirmPopup(${item.idtarefa}, '${item.title}', ${index}, ${column}); event.stopPropagation();">&#128465;</div>
            </div>
            <h4 class="item-title">${item.title || ''}</h4>
            <p class="item-description">${item.description || ''}</p>
            <div class="item-details">
                <span class="item-date">${formatDate(item.dueDate) || ''}</span>
                <span class="item-author">${item.authorName || ''}</span>
            </div>
            <span class="item-company">${item.companyName || ''}</span>
        </div>
    `;
    columnEl.appendChild(listEl);
}

function showTaskDetails(index, column) {
    const item = listArrays[column][index];
    const detailTitle = document.getElementById('detailTitle');
    const detailDescription = document.getElementById('detailDescription');
    const detailAuthor = document.getElementById('detailAuthor');
    const detailDueDate = document.getElementById('detailDueDate');
    const taskDetailPopup = document.getElementById('taskDetailPopup');

    if (detailTitle && detailDescription && detailAuthor && detailDueDate && taskDetailPopup) {
        detailTitle.textContent = item.title;
        detailDescription.textContent = item.description;
        detailAuthor.textContent = item.authorName;
        detailDueDate.textContent = formatDate(item.dueDate);
        taskDetailPopup.style.display = 'block';
    } else {
        console.error('One or more elements are missing from the DOM.');
    }
}

function closeDetailPopup() {
    document.getElementById('taskDetailPopup').style.display = 'none';
}

function updateDOM() {
    listColumns.forEach((column, i) => {
        const columnEl = column;
        columnEl.textContent = '';
        listArrays[i].forEach((item, index) => {
            createItemEl(columnEl, i, item, index);
        });
    });
}

function showInputBox(column = 0) {
    currentColumn = column;
    document.getElementById('taskPopup').style.display = 'block';
    document.getElementById('taskId').value = '';
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    const loggedUserId = localStorage.getItem('idusuario');
    document.getElementById('author').value = loggedUserId;
    document.getElementById('dueDate').value = '';

    document.getElementById('popupTitle').textContent = 'Adicionar Tarefa';

    const form = document.getElementById('taskForm');
    form.removeEventListener('submit', handleSubmit);
    form.addEventListener('submit', handleSubmit);
}

function handleSubmit(event) {
    event.preventDefault();
    const taskId = document.getElementById('taskId').value;
    if (taskId) {
        const column = currentColumn;
        const index = listArrays[column].findIndex(task => task.idtarefa === taskId);
        updateItem(index, column);
    } else {
        addNewItem(currentColumn);
    }
    closePopup();
}

function addNewItem(column = 0) {
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value || "";
    const authorSelect = document.getElementById('author');
    const authorId = authorSelect.value;
    const companySelect = document.getElementById('company');
    const companyId = companySelect.value;
    const dueDate = document.getElementById('dueDate').value || "";
    const idcliente = localStorage.getItem('idEmpresaSelecionada');

    const statusMap = {
        0: 'Pendentes de Dados',
        1: 'A Fazer',
        2: 'Em Execução',
        3: 'Finalizado',
        4: 'Entregas do Dia',
        5: 'Reunião'
    };
    const status = statusMap[column];

    const itemObject = {
        titulo: title,
        idcliente: idcliente,
        dataLimite: dueDate,
        idusuario: authorId,
        idempresa: companyId,
        status: status,
        recurrenceDay: 0,
        descricao: description
    };

    fetch('/paginaInicial/adicionartarefa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemObject)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Resposta do servidor:', data);
            if (data.success) {
                window.location.reload();
            } else {
                alert('Erro ao adicionar tarefa: ' + data.error);
            }
        })
        .catch((error) => {
            console.error('Erro:', error);
            alert('Falha na comunicação com o servidor.');
        });
}

function addToColumn(column, itemObject) {
    listArrays[column].push(itemObject);
    updateDOM();
}

function editItem(index, column) {
    const item = listArrays[column][index];
    document.getElementById('taskId').value = item.idtarefa;
    document.getElementById('title').value = item.title;
    document.getElementById('description').value = item.description;

    const authorSelect = document.getElementById('author');
    authorSelect.value = item.author;


    const dueDate = new Date(item.dueDate);
    const adjustedDueDate = new Date(dueDate.getTime() + dueDate.getTimezoneOffset() * 60000);
    document.getElementById('dueDate').value = adjustedDueDate.toISOString().split('T')[0];

    document.getElementById('popupTitle').textContent = 'Editar Tarefa';
    document.getElementById('taskPopup').style.display = 'block';
    currentColumn = column;

    const form = document.getElementById('taskForm');
    form.removeEventListener('submit', handleSubmit);
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        updateItem(index, column);
        closePopup();
    });
}

function updateItem(index, column) {
    const taskId = document.getElementById('taskId').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value || "";
    const authorSelect = document.getElementById('author');
    const authorId = authorSelect.value;
    const dueDate = document.getElementById('dueDate').value || "";

    const item = {
        idtarefa: taskId,
        titulo: title,
        descricao: description,
        dataLimite: dueDate,
        idusuario: authorId
    };

    fetch('/paginaInicial/editartarefa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Item updated:', data);
            window.location.reload();
        })
        .catch(error => console.error('Error updating item:', error));
}

function showDeleteConfirmPopup(taskId, taskTitle, index, column) {
    const deleteTaskTitle = document.getElementById('deleteTaskTitle');
    const confirmDeleteButton = document.getElementById('confirmDeleteButton');

    deleteTaskTitle.textContent = `Tem certeza de que deseja excluir a tarefa "${taskTitle}"?`;
    confirmDeleteButton.onclick = function() {
        deleteTask(taskId, index, column);
        closeDeleteConfirmPopup();
    };

    document.getElementById('deleteConfirmPopup').style.display = 'block';
}

function closeDeleteConfirmPopup() {
    document.getElementById('deleteConfirmPopup').style.display = 'none';
}

function deleteTask(idtarefa, index, column) {
    fetch('/paginaInicial/deletartarefa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idtarefa: idtarefa })
    })
        .then(response => {
            if (response.ok) {
                console.log('Task Deleted');
                listArrays[column].splice(index, 1);
                updateDOM();
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function closePopup() {
    document.getElementById('taskPopup').style.display = 'none';
}

function rebuildArrays() {
    listArrays = [[], [], [], [], [], []];

    listColumns.forEach((column, i) => {
        const columnTasks = column.querySelectorAll(".drag-item");
        columnTasks.forEach(task => {
            const taskData = {
                idtarefa: task.dataset.idtarefa,
                title: task.querySelector('.item-title').textContent,
                dueDate: task.querySelector('.item-date').textContent,
                author: task.dataset.authorId,
                authorName: task.querySelector('.item-author').textContent,
                description: task.dataset.description
            };
            listArrays[i].push(taskData);
        });
    });

    console.log('Arrays rebuilt:', listArrays);
}

function dragEnter(e) {
    e.preventDefault();
    let target = e.target;

    while (target && !target.classList.contains('drag-item-list')) {
        target = target.parentNode;
    }
    if (target) {
        currentColumn = Array.from(listColumns).indexOf(target);
        target.classList.add("over");
    }
}

function dragLeave(e) {
    e.preventDefault();
    let target = e.target;
    while (target && !target.classList.contains('drag-item-list')) {
        target = target.parentNode;
    }
    if (target && currentColumn !== undefined && listColumns[currentColumn]) {
        listColumns[currentColumn].classList.remove("over");
    }
}

function drop(e) {
    e.preventDefault();
    const columnId = currentColumn;
    if (columnId !== undefined && listColumns[columnId]) {
        const statusMap = {
            0: 'Pendentes de Dados',
            1: 'A Fazer',
            2: 'Em Execução',
            3: 'Finalizado',
            4: 'Entregas do Dia',
            5: 'Reunião'
        };
        const newStatus = statusMap[columnId];

        const taskId = draggedItem.getAttribute('data-idtarefa');
        if (!taskId) {
            console.error('No task ID found on dragged item');
            return;
        }

        updateTaskStatus(taskId, newStatus);

        const oldColumn = Array.from(listColumns).find(column => column.contains(draggedItem));
        oldColumn.removeChild(draggedItem);

        listColumns[columnId].appendChild(draggedItem);

        const oldColumnIndex = listArrays.findIndex(column => column.some(item => item.idtarefa == taskId));
        const itemIndex = listArrays[oldColumnIndex].findIndex(item => item.idtarefa == taskId);
        const [movedItem] = listArrays[oldColumnIndex].splice(itemIndex, 1);
        movedItem.status = newStatus;  // Atualizar o status no objeto também
        listArrays[columnId].push(movedItem);

        listColumns[columnId].classList.remove("over");
        updateDOM();
        currentColumn = undefined;
    }
}


function updateTaskStatus(idtarefa, newStatus) {
    fetch('/paginaInicial/atualizartarefa', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ idtarefa, newStatus })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Status updated:', data);
        })
        .catch(error => console.error('Error updating status:', error));
}

function drag(e) {
    draggedItem = e.target.closest('.drag-item');
    dragging = true;
}

function allowDrop(e) {
    e.preventDefault();
}

document.addEventListener('DOMContentLoaded', function() {
    const descriptionInput = document.getElementById('description');
    const charCount = document.getElementById('charCount');
    const maxLength = 500;

    descriptionInput.addEventListener('input', function() {
        const currentLength = this.value.length;
        charCount.textContent = `${currentLength}/${maxLength}`;
    });
});

