document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById('loadingSpinner').style.display = 'block';
    document.querySelector('.drag-container').classList.add('blur-background');
    await loadTemplateAndStyles();
    try {
        loadUserOptions();
        await loadCompanyOptions();
        await loadTasks();

    } catch (error) {
        console.error('Erro ao carregar o template:', error);
    } finally {
        document.getElementById('loadingSpinner').style.display = 'none';
        document.querySelector('.drag-container').classList.remove('blur-background');
    }
});

// Defina a função `toggleDescriptionType` antes de qualquer referência a ela
let isCheckboxMode = false;

function toggleDescriptionType() {
    const descriptionContainer = document.getElementById('descriptionContainer');
    const additionalDescriptions = document.getElementById('additionalDescriptions');
    const addDescriptionButton = document.getElementById('addDescriptionButton');

    if (isCheckboxMode) {
        descriptionContainer.style.display = 'block';
        additionalDescriptions.style.display = 'none';
        addDescriptionButton.style.display = 'none';
        isCheckboxMode = false;
    } else {
        descriptionContainer.style.display = 'none';
        additionalDescriptions.style.display = 'block';
        addDescriptionButton.style.display = 'flex';
        addDescriptionButton.style.width = 'auto';
        isCheckboxMode = true;

        // Adiciona apenas um campo adicional com placeholder
        if (additionalDescriptions.children.length === 0) {
            addDescriptionField('', false, true);
        }
    }
}


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

    let fetchUrl = `/tarefas/tarefas?idcliente=${idcliente}&idusuario=${idusuario}&isAdmin=${isAdmin}`;

    if (idcliente === 'perfilVinculado') {
        fetchUrl = `/tarefas/tarefasVinculadas?idusuario=${idusuario}`;
    }

    return fetch(fetchUrl)
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
                    descriptions: task.DESCRICOES || [],
                    apelido: task.APELIDO,
                    prioridade: task.PRIORIDADE || 0
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
    fetch('/tarefas/listaUsuarios')
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

            select.addEventListener('change', function() {
                const selectedId = select.value;
                console.log("ID do cliente selecionado:", selectedId);
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

    const descriptionsCount = item.descriptions ? item.descriptions.length : 0;

    const stars = '★'.repeat(item.prioridade || 0);

    listEl.innerHTML = `
        <div class="item-content">
            <div class="item-header">
                <div class="edit-icon" onclick="editItem(${index}, ${column}); event.stopPropagation();">&#9998;</div>
                <div class="delete-icon" onclick="showDeleteConfirmPopup(${item.idtarefa}, '${item.title}', ${index}, ${column}); event.stopPropagation();">&#128465;</div>
            </div>
            <h4 class="item-title">${item.title || ''}</h4>
            <div class="item-priority">${stars}</div>
            <span class="item-company">${item.apelido || ''}</span>
        </div>
    `;
    columnEl.appendChild(listEl);
}


function showTaskDetails(index, column) {
    const item = listArrays[column][index];
    console.log(item)
    const detailTitle = document.getElementById('detailTitle');
    const detailDescriptions = document.getElementById('detailDescriptions');
    const detailAuthor = document.getElementById('detailAuthor');
    const detailDueDate = document.getElementById('detailDueDate');
    const detailCompanyName = document.getElementById('detailCompanyName');
    const detailPrioridade = document.getElementById('detailPrioridade');
    const taskDetailPopup = document.getElementById('taskDetailPopup');

    if (detailTitle && detailDescriptions && detailAuthor && detailDueDate && detailPrioridade && taskDetailPopup) {
        detailTitle.textContent = item.title;
        detailAuthor.textContent = item.authorName;
        detailCompanyName.textContent = item.companyName;

        detailDescriptions.innerHTML = ''; // Limpa as descrições existentes
        const descriptions = item.descriptions || [];
        descriptions.forEach((desc, i) => {
            const descContainer = document.createElement('div');
            descContainer.classList.add('desc-container');

            const descCheckbox = document.createElement('input');
            descCheckbox.type = 'checkbox';
            descCheckbox.classList.add('custom-checkbox');
            descCheckbox.id = `desc-${index}-${i}`;
            descCheckbox.checked = desc.completed;

            descCheckbox.addEventListener('change', () => {
                updateDescriptionStatus(item.idtarefa, i, descCheckbox.checked);
                descLabel.classList.toggle('completed', descCheckbox.checked);
            });

            const descLabel = document.createElement('label');
            descLabel.htmlFor = `desc-${index}-${i}`;
            descLabel.textContent = desc.text;

            if (desc.completed) {
                descLabel.classList.add('completed');
            }

            descContainer.appendChild(descCheckbox);
            descContainer.appendChild(descLabel);

            detailDescriptions.appendChild(descContainer);
        });

        detailPrioridade.textContent = '★'.repeat(item.prioridade);

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

function updateDescriptionStatus(taskId, descIndex, completed) {
    fetch('/tarefas/updateDescriptionStatus', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            idtarefa: taskId,
            descriptionIndex: descIndex,
            completed: completed
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Description status updated:', data);
        })
        .catch(error => console.error('Error updating description status:', error));
}

function closeDetailPopup() {
    document.getElementById('taskDetailPopup').style.display = 'none';
    document.getElementById('drag-container').classList.remove('blur');
}

function addDescriptionField(text = '', completed = false) {
    const additionalDescriptions = document.getElementById('additionalDescriptions');

    const descContainer = document.createElement('div');
    descContainer.classList.add('desc-container');

    const descTextarea = document.createElement('textarea');
    descTextarea.name = 'descriptions';
    descTextarea.placeholder = 'Adicione um item';
    descTextarea.value = text;
    descTextarea.rows = 3;
    descTextarea.style.resize = 'vertical';

    const editIcon = document.createElement('span');
    editIcon.classList.add('desc-edit-icon');
    editIcon.innerHTML = '&#9998;';
    editIcon.onclick = () => editDescription(descTextarea);

    const deleteIcon = document.createElement('span');
    deleteIcon.classList.add('desc-delete-icon');
    deleteIcon.innerHTML = '&#128465;';
    deleteIcon.onclick = () => deleteDescription(descContainer);

    descContainer.appendChild(descTextarea);
    descContainer.appendChild(editIcon);
    descContainer.appendChild(deleteIcon);
    additionalDescriptions.appendChild(descContainer);
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

function highlightStars(stars, value) {
    stars.forEach((star, index) => {
        if (index < value) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
}

function showInputBox(column) {
    currentColumn = column;
    clearTaskForm();
    document.getElementById('taskPopup').style.display = 'block';
    document.getElementById('popupTitle').textContent = 'Adicionar Nova Tarefa';
    document.getElementById('taskForm').onsubmit = function(event) {
        event.preventDefault();
        addNewItem(column);
        closePopup();
    };
    document.getElementById('drag-container').classList.add('blur');

    document.getElementById('prioridade-edit').value = "";
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
    const authorSelect = document.getElementById('author');
    const authorId = authorSelect.value;
    const companySelect = document.getElementById('company');
    const companyId = companySelect.value;  // Captura o ID do cliente selecionado
    const dueDate = document.getElementById('dueDate').value || "";
    const idcliente = localStorage.getItem('idEmpresaSelecionada');
    const prioridade = document.getElementById('prioridade-edit').value;

    // Sempre considerar a descrição como uma lista de itens
    const descriptions = [];
    const descContainers = document.querySelectorAll('#additionalDescriptions .desc-container');
    descContainers.forEach(container => {
        const text = container.querySelector('textarea').value;
        const completed = container.querySelector('input[type="checkbox"]')?.checked || false;
        descriptions.push({ text, completed });
    });

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
        idcliente: companyId,  // Aqui você usa o ID do cliente selecionado
        dataLimite: dueDate,
        idusuario: authorId,
        idempresa: companyId,
        status: status,
        prioridade: prioridade,
        descriptions: descriptions
    };

    fetch('/tarefas/adicionartarefa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemObject)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                clearTaskForm();
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
    document.getElementById('author').value = item.author;
    document.getElementById('company').value = item.companyId;
    document.getElementById('dueDate').value = item.dueDate === '0000-00-00' ? '' : item.dueDate;

    const prioridadeSelect = document.getElementById('prioridade-edit');
    prioridadeSelect.value = item.prioridade || "";

    const additionalDescriptions = document.getElementById('additionalDescriptions');
    additionalDescriptions.innerHTML = ''; // Limpa as descrições existentes

    item.descriptions.forEach(desc => {
        addDescriptionField(desc.text, desc.completed);
    });

    document.getElementById('taskPopup').style.display = 'block';
    document.getElementById('popupTitle').textContent = 'Editar Tarefa';

    document.getElementById('taskForm').onsubmit = function(event) {
        event.preventDefault();
        updateItem(index, column);
        closePopup();
    };
    document.getElementById('drag-container').classList.add('blur');
}

function updateItem(index, column) {
    const taskId = document.getElementById('taskId').value;
    const title = document.getElementById('title').value;
    const authorId = document.getElementById('author').value;
    const companyId = document.getElementById('company').value;
    const dueDate = document.getElementById('dueDate').value;
    const prioridade = document.getElementById('prioridade-edit').value;

    const descriptions = [];
    const descContainers = document.querySelectorAll('#additionalDescriptions .desc-container');
    descContainers.forEach((container, i) => {
        const textarea = container.querySelector('textarea');
        const checkbox = container.querySelector('input[type="checkbox"]');
        if (textarea) {
            const text = textarea.value;
            const completed = checkbox ? checkbox.checked : false;
            descriptions.push({ text, completed });
        }
    });

    const item = {
        idtarefa: taskId,
        titulo: title,
        dataLimite: dueDate,
        idusuario: authorId,
        idempresa: companyId,
        prioridade: prioridade, // Inclui a prioridade na atualização
        descriptions: descriptions
    };

    fetch('/tarefas/editartarefa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
    })
        .then(response => response.json())
        .then(data => {
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

function editDescription(input) {
    input.disabled = !input.disabled;
}

function deleteDescription(container) {
    container.remove();
}

function deleteTask(idtarefa, index, column) {
    fetch('/tarefas/deletartarefa', {
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

function clearTaskForm() {
    const taskId = document.getElementById('taskId');
    const title = document.getElementById('title');
    const additionalDescriptions = document.getElementById('additionalDescriptions');
    const addDescriptionButton = document.getElementById('addDescriptionButton');

    if (taskId) taskId.value = '';
    if (title) title.value = '';
    if (additionalDescriptions) additionalDescriptions.innerHTML = '';
}

function closePopup() {
    document.getElementById('taskPopup').style.display = 'none';
    document.getElementById('drag-container').classList.remove('blur'); // Remova a classe blur aqui
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
        window.location.reload();
    }
}

function updateTaskStatus(idtarefa, newStatus, finalDate) {
    const body = { idtarefa, newStatus };

    if (newStatus === 'Finalizado' && finalDate) {
        body.finalDate = finalDate;
    }

    fetch('/tarefas/atualizartarefa', {
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

document.addEventListener('DOMContentLoaded', function() {
    const starContainerEdit = document.getElementById('star-container-edit');
    const prioridadeInput = document.getElementById('prioridade-edit');

    starContainerEdit.addEventListener('click', function(e) {
        const selectedRow = e.target.closest('.star-row');
        if (selectedRow) {
            const selectedValue = selectedRow.getAttribute('data-value');
            prioridadeInput.value = selectedValue;

            const stars = starContainerEdit.querySelectorAll('.star-row .star');
            highlightStars(stars, selectedValue);
        }
    });
});


