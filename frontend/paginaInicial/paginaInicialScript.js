const userRole = localStorage.getItem('userRole');
const idusuario = localStorage.getItem('idusuario');

let IDCLIENTE = 0;

document.addEventListener('DOMContentLoaded', function() {
    loadUserOptions();
    loadTasks(); // Carregar tarefas do banco de dados

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
let listArrays = [[], [], [], []]; // Arrays for each column: [Backlog, Progress, Complete, On Hold]

function loadTasks() {
    const idcliente = localStorage.getItem('idEmpresaSelecionada');
    const idusuario = localStorage.getItem('idusuario');
    const isAdmin = localStorage.getItem('isAdmin') === 'true'; // Ajuste conforme como o isAdmin é armazenado

    fetch(`/paginaInicial/tarefas?idcliente=${idcliente}&idusuario=${idusuario}&isAdmin=${isAdmin}`)
        .then(response => response.json())
        .then(data => {
            // Limpar as listas existentes
            listArrays = [[], [], [], []];

            // Distribuir tarefas nas colunas
            data.forEach(task => {
                let column = 0; // Default to the first column
                if (task.STATUS === 'Fazendo') {
                    column = 1;
                } else if (task.STATUS === 'Feito') {
                    column = 2;
                } else if (task.STATUS === 'Em Espera') {
                    column = 3;
                }

                // Convertendo dados para formato compatível
                const itemObject = {
                    idtarefa: task.IDTAREFA,
                    title: task.TITULO,
                    dueDate: task.DATA_LIMITE,
                    author: task.ID_USUARIO,
                    authorName: task.NOME_DO_USUARIO,
                    status: task.STATUS,
                    description: task.DESCRICAO || "" // Adicione DESCRIÇÃO na query SQL se necessário
                };

                listArrays[column].push(itemObject);
            });

            updateDOM(); // Atualizar o DOM com as novas tarefas
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
            select.innerHTML = ''; // Limpar opções existentes
            data.forEach(user => {
                const option = document.createElement('option');
                option.value = user.IDUSUARIOS; // O valor é o ID, que não é mostrado ao usuário
                option.textContent = user.NOME_DO_USUARIO; // Mostra apenas o nome
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar usuários:', error);
        });
}


function createItemEl(columnEl, column, item, index) {
    const listEl = document.createElement("li");
    listEl.classList.add("drag-item");
    listEl.draggable = true;
    listEl.setAttribute("onfocusout", `updateItem(${index}, ${column})`);
    listEl.setAttribute("ondragstart", "drag(event)");
    listEl.setAttribute("data-idtarefa", item.idtarefa);
    listEl.innerHTML = `
        <div class="item-content">
            <div class="item-header">
                <div class="edit-icon" onclick="editItem(${index}, ${column})">&#9998;</div>
                <div class="delete-icon" onclick="deleteTask(${item.idtarefa}, ${index}, ${column})">&#128465;</div>
            </div>
            <h4 class="item-title">${item.title || ''}</h4>
            <div class="item-details">
                <span class="item-date">${item.dueDate || ''}</span>
                <span class="item-author">${item.authorName || ''}</span> 
            </div>
        </div>
    `;
    columnEl.appendChild(listEl);
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

function showInputBox() {
    currentColumn = 0; // Set currentColumn to 0 for "Para Fazer"
    document.getElementById('taskPopup').style.display = 'block';
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    document.getElementById('author').value = '';
    document.getElementById('dueDate').value = '';

    const form = document.getElementById('taskForm');
    // Remover quaisquer eventos anteriores para evitar duplicações
    form.removeEventListener('submit', handleSubmit);
    form.addEventListener('submit', handleSubmit);
}


function handleSubmit(event) {
    event.preventDefault();
    addNewItem(currentColumn);
    closePopup();
}

function addNewItem(column = 0) { // Default column to 0 for "Para Fazer"
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const authorSelect = document.getElementById('author');
    const authorId = authorSelect.value;
    const dueDate = document.getElementById('dueDate').value;
    const idcliente = localStorage.getItem('idEmpresaSelecionada');
    const status = 'Backlog'; // Always set status to "Para Fazer"

    const itemObject = {
        titulo: title,
        idcliente: idcliente,
        dataLimite: dueDate,
        idusuario: authorId,
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
                itemObject.idtarefa = data.idtarefa; // Assuming server returns the ID of the new task
                itemObject.title = itemObject.titulo;
                itemObject.dueDate = itemObject.dataLimite;
                itemObject.authorName = authorSelect.options[authorSelect.selectedIndex].text;
                addToColumn(column, itemObject); // Add the item to the "Para Fazer" column
                updateDOM(); // Update the DOM automatically
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
    document.getElementById('title').value = item.title;
    document.getElementById('description').value = item.description;
    document.getElementById('author').value = item.author;
    document.getElementById('dueDate').value = item.dueDate;
    document.getElementById('taskPopup').style.display = 'block';
    currentColumn = column;
    const form = document.getElementById('taskForm');
    form.onsubmit = function(event) {
        event.preventDefault();
        updateItem(index, column);
        closePopup();
    };
}

function updateItem(index, column) {
    const authorSelect = document.getElementById('author');
    const authorId = authorSelect.value;
    const authorName = authorSelect.options[authorSelect.selectedIndex].text;

    const item = {
        idtarefa: listArrays[column][index].idtarefa,
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        author: authorId,
        authorName: authorName,
        dueDate: document.getElementById('dueDate').value
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
            listArrays[column][index] = item; // Update the item in the array
            updateDOM(); // Update the DOM to reflect the change
        })
        .catch(error => console.error('Error updating item:', error));
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
    // Clear existing array content
    listArrays = [[], [], [], []]; // Reset all columns

    // Traverse each column and rebuild the arrays
    listColumns.forEach((column, i) => {
        const columnTasks = column.querySelectorAll(".drag-item"); // Select all task items in the column
        columnTasks.forEach(task => {
            const taskData = {
                idtarefa: task.dataset.idtarefa, // Ensure data-idtarefa is set on each task item
                title: task.querySelector('.item-title').textContent,
                dueDate: task.querySelector('.item-date').textContent,
                author: task.dataset.authorId, // Ensure data-authorId is set on each task item
                authorName: task.querySelector('.item-author').textContent,
                description: task.dataset.description // Ensure data-description is set on each task item
            };
            listArrays[i].push(taskData);
        });
    });

    console.log('Arrays rebuilt:', listArrays); // Logging to verify the operation
}

function dragEnter(e) {
    e.preventDefault();
    let target = e.target;
    // Certifique-se de que o target seja sempre a lista UL e não um LI ou qualquer outro filho
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
    // Mesmo loop para garantir que o target é a lista UL
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
        const statusMap = { 0: 'Backlog', 1: 'Fazendo', 2: 'Feito', 3: 'Em Espera' };
        const newStatus = statusMap[columnId];

        // Ensure draggedItem is the task element
        const taskId = draggedItem.getAttribute('data-idtarefa');
        if (!taskId) {
            console.error('No task ID found on dragged item');
            return;
        }

        // Update status in the backend
        updateTaskStatus(taskId, newStatus);

        listColumns[columnId].classList.remove("over");
        listColumns[columnId].appendChild(draggedItem);
        rebuildArrays();
        currentColumn = undefined; // Reset currentColumn to avoid errors
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
    draggedItem = e.target.closest('.drag-item'); // Ensure draggedItem is the task element
    dragging = true;
}


function allowDrop(e) {
    e.preventDefault();
}

