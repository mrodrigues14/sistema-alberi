function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
    document.querySelector('.dropbtn').classList.toggle('active');
    var empresaSelecionada = document.querySelector('.empresaSelecionada');
    if (document.querySelector('.dropbtn').classList.contains('active')) {
        empresaSelecionada.style.borderRadius = '0';
    } else {
        empresaSelecionada.style.borderRadius = '0 0 5px 5px';
    }
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
    var list = document.getElementById('nameList');
    fetch('/seletorEmpresa/consultarEmpresas', { method: 'POST' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Não foi possível buscar as empresas');
            }
            return response.json();
        })
        .then(data => {
            inputNomeEmpresa(data);
            addClickEventToListItems();
            if (list.style.display !== 'block') {
                list.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
        });
}

function toggleListVisibility() {
    var list = document.getElementById('nameList');
    if (list.style.display === 'block') {
        list.style.display = 'none';
    } else {
        loadNomeEmpresa();
    }
}


function handleEmpresa() {
    var nomeEmpresa = getStoredEmpresaName();
    updateNomeEmpresa(nomeEmpresa);
}

function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

function updateNomeEmpresa(nomeEmpresa) {
    var empresaSelecionadaElement = document.querySelector('.empresaSelecionada');
    if (empresaSelecionadaElement && nomeEmpresa) {
        empresaSelecionadaElement.textContent = nomeEmpresa;
    }
}

function showCalendarModal() {
    fetch('templateMenu/calendar.html') // Caminho para o seu calendar.html
        .then(response => response.text())
        .then(html => {
            document.getElementById('calendarModalContent').innerHTML = html;
            document.getElementById('calendarModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error loading the calendar:', error);
        });
}

function closeCalendarModal() {
    document.getElementById('calendarModal').style.display = 'none';
}

function inputNomeEmpresa(names) {
    var input = document.getElementById('searchInput');
    var list = document.getElementById('nameList');

    input.addEventListener('input', function(e) {
        updateList(e.target.value);
    });

    document.querySelector('.arrow-button').addEventListener('click', function() {
        updateList('');
    });

    list.addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
            input.value = e.target.textContent;
            list.style.display = 'none';

            empresaSelecionada(e.target.textContent);
        }
    });

    function updateList(filter) {
        // Ensure filter is not null before converting to lower case
        var safeFilter = filter ? filter.toLowerCase() : '';

        var filteredNames = names.filter(function(name) {
            // Ensure name is not null before converting to lower case
            return name && name.toLowerCase().includes(safeFilter);
        });

        list.innerHTML = '';
        filteredNames.forEach(function(name) {
            var li = document.createElement('li');
            li.textContent = name;
            list.appendChild(li);
        });

        list.style.display = filteredNames.length ? 'block' : 'none';
    }
}

function empresaSelecionada(nomeEmpresa) {
    localStorage.setItem('nomeEmpresaSelecionada', nomeEmpresa);
    updateNomeEmpresa(nomeEmpresa);
}

function addClickEventToListItems() {
    var listItems = document.querySelectorAll('.name-list li');
    listItems.forEach(function(item) {
        item.addEventListener('click', redirecionamentoDePagina);
    });
}

function redirecionamentoDePagina() {
    window.location.reload(true);
}


// Evento para fechar o modal se clicado fora dele
window.onclick = function(event) {
    var modal = document.getElementById('calendarModal');
    if (event.target === modal) {
        closeCalendarModal();
    }
}

window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
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
window.onclick = function(event) {
    var searchInput = document.getElementById('searchInput');
    var nameList = document.getElementById('nameList');
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var empresaSelecionadaButton = document.querySelector('.empresaSelecionada');

    if (!searchInput.contains(event.target) && !nameList.contains(event.target)) {
        nameList.style.display = 'none';
    }

    if (!event.target.matches('.dropbtn')) {
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
                document.querySelector('.dropbtn').classList.remove('active');
                if (empresaSelecionadaButton) {
                    empresaSelecionadaButton.style.borderRadius = '0 0 5px 5px';
                }
            }
        }
    }
}

addClickEventToListItems();
document.addEventListener('DOMContentLoaded', function() {
    handleEmpresa()
    loadAndDisplayUsername();
    loadNomeEmpresa();

});
