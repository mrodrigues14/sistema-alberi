const userRole = localStorage.getItem('userRole');
const idusuario = localStorage.getItem('idusuario');
function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

let IDCLIENTE = 0;

document.addEventListener('DOMContentLoaded', function() {
    loadUserOptions();
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

function loadUserOptions() {
    fetch('/paginaInicial/listaUsuarios')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('author');
            select.innerHTML = '';
            data.forEach(user => {
                const option = document.createElement('option');
                option.value = user.idusuario;
                option.textContent = user.NOME_DO_USUARIO;
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao carregar usuários:', error));
}

function createItemEl(columnEl, column, item, index) {
    const listEl = document.createElement("li");
    listEl.classList.add("drag-item");
    listEl.draggable = true;
    listEl.setAttribute("onfocusout", `updateItem(${index}, ${column})`);
    listEl.setAttribute("ondragstart", "drag(event)");
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

function showInputBox(column) {
    currentColumn = column;
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
    addNewItem();
    closePopup();
}

function addNewItem() {
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const authorSelect = document.getElementById('author');
    const authorId = authorSelect.value; // ID do usuário
    const authorName = authorSelect.options[authorSelect.selectedIndex].text; // Nome do autor (usado apenas no lado do cliente)
    const dueDate = document.getElementById('dueDate').value;
    const idcliente = 1;
    const recurrenceDay = 0;

    const itemObject = {
        titulo: title,
        idcliente: idcliente, // Adicionado para combinar com a estrutura do servidor
        dataLimite: dueDate,
        idusuario: authorId, // ID do autor
        recurrenceDay: recurrenceDay // Adicionado para combinar com a estrutura do servidor
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
            console.log('Success:', data);
            if (data.success) {
                itemObject.authorName = authorName; // Incluindo o nome para exibição no DOM
                addToColumn(currentColumn, itemObject); // Adiciona o item ao DOM após sucesso do servidor
            }
        })
        .catch((error) => {
            console.error('Error:', error);
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

