document.addEventListener('DOMContentLoaded', async function() {
    loadUserOptions();
    loadCompanyOptions();
    loadTasks();

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
                    case 'Entregas do Dia':
                        column = 3;
                        break;
                    case 'Reunião':
                        column = 4;
                        break;
                    case 'Finalizado':
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
                    finalDate: task.DATA_CONCLUSAO || "",
                    author: task.ID_USUARIO,
                    authorName: task.NOME_DO_USUARIO,
                    companyId: task.ID_CLIENTE,
                    companyName: task.NOME,
                    status: task.STATUS,
                    description: task.DESCRICAO || "",
                    apelido: task.APELIDO
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
            select.value = loggedUserId;
        })
        .catch(error => {
            console.error('Erro ao carregar usuários:', error);
        });
}
function loadCompanyOptions() {
    return fetch('/seletorEmpresa/consultarEmpresas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('company');
            const selectedCompanyId = localStorage.getItem('idEmpresaSelecionada');

            select.innerHTML = '';
            data.empresas.forEach(company => {
                const option = document.createElement('option');
                option.value = company.IDCLIENTE;
                option.textContent = company.NOME;
                if (company.IDCLIENTE == selectedCompanyId) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar empresas:', error);
            throw error;
        });
}


function formatDate(dateString) {
    if (!dateString || dateString === '0000-00-00' || new Date(dateString).toString() === 'Invalid Date') {
        return 'N/A';
    }

    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function createItemEl(columnEl, column, item, index) {
    const listEl = document.createElement("li");
    listEl.classList.add("drag-item");
    listEl.draggable = true;
    listEl.setAttribute("onfocusout", `updateItem(${index}, ${column})`);
    listEl.setAttribute("ondragstart", "drag(event)");
    listEl.setAttribute("data-idtarefa", item.idtarefa);
    listEl.setAttribute("onclick", `showTaskDetails(${index}, ${column})`);

    let dateText;
    if (item.finalDate) {
        dateText = `Data Conclusão: ${formatDate(item.finalDate)}`;
    } else {
        dateText = `Data Limite: ${formatDate(item.dueDate)}`;
    }

    listEl.innerHTML = `
        <div class="item-content">
            <div class="item-header">
                <div class="edit-icon" onclick="editItem(${index}, ${column}); event.stopPropagation();">&#9998;</div>
                <div class="delete-icon" onclick="showDeleteConfirmPopup(${item.idtarefa}, '${item.title}', ${index}, ${column}); event.stopPropagation();">&#128465;</div>
            </div>
            <h4 class="item-title">${item.title || ''}</h4>
            <!-- <p class="item-description">${item.description || ''}</p>-->
            <!--<div class="item-details">
                <span class="item-date">${dateText || ''}</span>
                <span class="item-author">${item.authorName || ''}</span>
            </div>-->
            <span class="item-company">${item.apelido || ''}</span>
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
    const detailCompanyName = document.getElementById('detailCompanyName');

    if (detailTitle && detailDescription && detailAuthor && detailDueDate && taskDetailPopup) {
        detailTitle.textContent = item.title;
        detailDescription.textContent = item.description;
        detailAuthor.textContent = item.authorName;
        detailCompanyName.textContent = item.companyName;

        if (item.finalDate) {
            detailDueDate.previousElementSibling.textContent = 'Data de Conclusão:';
            detailDueDate.textContent = formatDate(item.finalDate);
        } else {
            detailDueDate.previousElementSibling.textContent = 'Data de Vencimento:';
            detailDueDate.textContent = formatDate(item.dueDate);
        }

        taskDetailPopup.style.display = 'block';
        document.getElementById('drag-container').classList.add('blur');
    } else {
        console.error('One or more elements are missing from the DOM.');
    }
}

function closeDetailPopup() {
    document.getElementById('taskDetailPopup').style.display = 'none';
    document.getElementById('drag-container').classList.remove('blur');
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

function showInputBox(column) {
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

    document.getElementById('drag-container').classList.add('blur');

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

function addNewItem() {
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
        3: 'Entregas do Dia',
        4: 'Reunião',
        5: 'Finalizado'
    };
    const status = statusMap[currentColumn];

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

async function editItem(index, column) {
    const item = listArrays[column][index];
    document.getElementById('taskId').value = item.idtarefa;
    document.getElementById('title').value = item.title;
    document.getElementById('description').value = item.description;

    const authorSelect = document.getElementById('author');
    authorSelect.value = item.author;

    const companySelect = document.getElementById('company');
    companySelect.value = item.companyId;

    if (item.dueDate === '0000-00-00' || !item.dueDate) {
        document.getElementById('dueDate').value = '';
    } else {
        const dueDate = new Date(item.dueDate);
        const adjustedDueDate = new Date(dueDate.getTime() + dueDate.getTimezoneOffset() * 60000);
        document.getElementById('dueDate').value = adjustedDueDate.toISOString().split('T')[0];
    }

    document.getElementById('popupTitle').textContent = 'Editar Tarefa';
    document.getElementById('taskPopup').style.display = 'block';
    currentColumn = column;
    document.getElementById('drag-container').classList.add('blur');


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
    const companySelect = document.getElementById('company');
    const companyId = companySelect.value;
    const dueDate = document.getElementById('dueDate').value || "";

    const item = {
        idtarefa: taskId,
        titulo: title,
        descricao: description,
        dataLimite: dueDate,
        idusuario: authorId,
        idempresa: companyId
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
    document.getElementById('drag-container').classList.remove('blur');

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
            3: 'Entregas do Dia',
            4: 'Reunião',
            5: 'Finalizado'
        };
        const newStatus = statusMap[columnId];

        const taskId = draggedItem.getAttribute('data-idtarefa');
        if (!taskId) {
            console.error('No task ID found on dragged item');
            return;
        }

        const oldColumn = Array.from(listColumns).find(column => column.contains(draggedItem));
        oldColumn.removeChild(draggedItem);

        listColumns[columnId].appendChild(draggedItem);

        const oldColumnIndex = listArrays.findIndex(column => column.some(item => item.idtarefa == taskId));
        const itemIndex = listArrays[oldColumnIndex].findIndex(item => item.idtarefa == taskId);
        const [movedItem] = listArrays[oldColumnIndex].splice(itemIndex, 1);

        let finalDate = '';
        if (newStatus === 'Finalizado') {
            const now = new Date();
            const offset = -3;
            now.setHours(now.getUTCHours() + offset);
            finalDate = now.toISOString().split('T')[0];
            movedItem.finalDate = finalDate;
        }

        movedItem.status = newStatus;
        listArrays[columnId].push(movedItem);

        updateTaskStatus(taskId, newStatus, finalDate);

        listColumns[columnId].classList.remove("over");
        updateDOM();
        currentColumn = undefined;
    }
}

function updateTaskStatus(idtarefa, newStatus, finalDate) {
    const body = { idtarefa, newStatus };

    if (newStatus === 'Finalizado' && finalDate) {
        body.finalDate = finalDate;
    }

    fetch('/paginaInicial/atualizartarefa', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
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
    const maxLength = 1000;

    descriptionInput.addEventListener('input', function() {
        const currentLength = this.value.length;
        charCount.textContent = `${currentLength}/${maxLength}`;
    });
});

