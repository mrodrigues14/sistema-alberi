const userRole = localStorage.getItem('userRole');
const idusuario = localStorage.getItem('idusuario');

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
});

const addBtns = document.querySelectorAll(".add-btn:not(.solid)");
const saveItemBtns = document.querySelectorAll(".solid");
const addItemContainers = document.querySelectorAll(".add-container");
const addItems = document.querySelectorAll(".add-item");
const listColumns = document.querySelectorAll(".drag-item-list");
const backlogListEl = document.getElementById("to-do-list");
const progressListEl = document.getElementById("doing-list");
const completeListEl = document.getElementById("done-list");
const onHoldListEl = document.getElementById("on-hold-list");

let updatedOnLoad = false;
let backlogListArray = [], progressListArray = [], completeListArray = [], onHoldListArray = [];
let listArrays = [backlogListArray, progressListArray, completeListArray, onHoldListArray];
let draggedItem, dragging = false, currentColumn;

function getSavedColumns() {
    if (localStorage.getItem("backlogItems")) {
        listArrays = [
            JSON.parse(localStorage.getItem("backlogItems")),
            JSON.parse(localStorage.getItem("progressItems")),
            JSON.parse(localStorage.getItem("completeItems")),
            JSON.parse(localStorage.getItem("onHoldItems"))
        ];
    } else {
        backlogListArray = ["Write the documentation", "Post a technical article"];
        progressListArray = ["Work on Droppi project", "Listen to Spotify"];
        completeListArray = ["Submit a PR", "Review my projects code"];
        onHoldListArray = ["Get a girlfriend"];
    }
    updateDOM();
}

function updateSavedColumns() {
    const arrayNames = ["backlog", "progress", "complete", "onHold"];
    arrayNames.forEach((name, index) => {
        localStorage.setItem(`${name}Items`, JSON.stringify(listArrays[index]));
    });
}

function filterArray(array) {
    return array.filter(item => item !== null);
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
                <div class="delete-icon" onclick="deleteItem(${index}, ${column})">&#128465;</div> <!-- Ícone de deletar -->
            </div>
            <h4 class="item-title">${item.title || ''}</h4>
            <div class="item-details">
                <span class="item-date">${item.dueDate || ''}</span>
                <span class="item-author">${item.author || ''}</span>
            </div>
        </div>
    `;
    columnEl.appendChild(listEl);
}

function deleteItem(index, column) {
    listArrays[column].splice(index, 1); // Remove o item do array
    updateDOM();
}

function editItem(index, column) {
    const item = listArrays[column][index];
    document.getElementById('title').value = item.title;
    document.getElementById('description').value = item.description;
    document.getElementById('author').value = item.author;
    document.getElementById('dueDate').value = item.dueDate;

    // Show popup
    document.getElementById('taskPopup').style.display = 'block';
    currentColumn = column; // Save the current column to know where to save

    // Change submit event to update instead of add
    const form = document.getElementById('taskForm');
    form.onsubmit = function(event) {
        event.preventDefault();
        updateItem(index, column); // Update existing item
        closePopup();
    };
}

function updateItem(index, column) {
    listArrays[column][index] = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        author: document.getElementById('author').value,
        dueDate: document.getElementById('dueDate').value
    };
    updateDOM();
}

function updateDOM() {
    listColumns.forEach((column, i) => {
        const columnEl = column;
        columnEl.textContent = '';
        listArrays[i].forEach((item, index) => {
            createItemEl(columnEl, i, item, index);
        });
    });
    updateSavedColumns();
}

function addToColumn(column, itemObject) {
    listArrays[column].push(itemObject);
    updateDOM();
}

function showInputBox(column) {
    currentColumn = column;
    document.getElementById('taskPopup').style.display = 'block';
}

function closePopup() {
    document.getElementById('taskPopup').style.display = 'none';
}

document.getElementById('taskForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const author = document.getElementById('author').value;
    const dueDate = document.getElementById('dueDate').value;
    const itemObject = { title, description, author, dueDate };
    addToColumn(currentColumn, itemObject);
    document.getElementById('taskForm').reset();
    closePopup();
});

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

function drag(e) {
    draggedItem = e.target;
    dragging = true;
}

function allowDrop(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    if (currentColumn !== undefined && listColumns[currentColumn]) {
        listColumns[currentColumn].classList.remove("over");
        listColumns[currentColumn].appendChild(draggedItem);
        rebuildArrays();
        currentColumn = undefined; // Reset currentColumn para evitar erros
    }
}

function rebuildArrays() {
    listArrays.forEach((array, index) => {
        array.length = 0;
        Array.from(listColumns[index].children).forEach(child => {
            array.push({
                title: child.querySelector('.item-title').textContent,
                dueDate: child.querySelector('.item-date').textContent,
                author: child.querySelector('.item-author').textContent
            });
        });
    });
    updateDOM();
}

document.addEventListener('message', function(event) {
    if (event.data === 'recarregarPagina') {
        window.location.reload();
    }
}, false);

getSavedColumns(); // Load columns on start
