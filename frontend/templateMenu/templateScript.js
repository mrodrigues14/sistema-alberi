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
                localStorage.setItem('idUsuario', data.idusuario);
                localStorage.setItem('userRoles', data.role);
                console.log(data.role);
                console.log(data.idusuario);
                showAdminOptions();
            } else {
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            window.location.href = '/';
        });
}




function loadNomeEmpresa() {
    fetch('/seletorEmpresa/consultarEmpresas', { method: 'POST' })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados recebidos:', data);
            inputNomeEmpresa(data);
            addClickEventToListItems();
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
            showNoEmpresasMessage(error.message); // Exibe a mensagem de erro
        });
}


function handleEmpresa() {
    var nomeEmpresa = getStoredEmpresaName();
    var idEmpresa = localStorage.getItem('idEmpresaSelecionada');
    updateNomeEmpresa(nomeEmpresa, idEmpresa);
}


function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}


function showCalendarModal() {
    fetch('templateMenu/calendar.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('calendarModalContent').innerHTML = html;
            document.getElementById('calendarModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error loading the calendar:', error);
        });
}


function inputNomeEmpresa(responseData) {
    var empresas = responseData.empresas;
    var input = document.getElementById('searchInput');
    var list = document.getElementById('nameList');

    input.addEventListener('input', function(e) {
        updateList(e.target.value);
    });

    document.getElementById('searchInput').addEventListener('focus', function() {
        updateList('');
    });

    document.querySelector('.arrow-button').addEventListener('click', function() {
        updateList('');
    });

    document.getElementById('nameList').addEventListener('click', function(e) {
        const li = e.target.closest('li');
        if (li) {
            console.log('Nome:', li.dataset.nome);
            input.value = li.textContent;
            list.style.display = 'none';
            empresaSelecionada(li.dataset.nome, li.dataset.id);
        }
    });

    function updateList(filter) {
        var safeFilter = filter.toLowerCase();

        var filteredData = empresas.filter(function(data) {
            return data.NOME.toLowerCase().includes(safeFilter);
        });

        list.innerHTML = '';
        filteredData.forEach(function(data) {
            var li = document.createElement('li');
            li.textContent = data.NOME;
            li.setAttribute('data-nome', data.NOME);
            li.setAttribute('data-id', data.IDCLIENTE);
            list.appendChild(li);
        });

        list.style.display = filteredData.length ? 'block' : 'none';
    }
}

function empresaSelecionada(nomeEmpresa, idEmpresa) {
    console.log('Setting empresa:', nomeEmpresa, idEmpresa);
    localStorage.setItem('nomeEmpresaSelecionada', nomeEmpresa);
    localStorage.setItem('idEmpresaSelecionada', idEmpresa);
    updateNomeEmpresa(nomeEmpresa, idEmpresa);
    console.log('LocalStorage after setting:', localStorage.getItem('idEmpresaSelecionada'));
}

function updateNomeEmpresa(nomeEmpresa, idEmpresa) {
    console.log('Updating display for:', nomeEmpresa, idEmpresa);
    var empresaSelecionadaElement = document.querySelector('.empresaSelecionada');
    if (empresaSelecionadaElement && nomeEmpresa && idEmpresa) {
        empresaSelecionadaElement.textContent = nomeEmpresa;
    }
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

function showNoEmpresasMessage(message) {
    var messageElement = document.getElementById('noEmpresasMessage');
    var messageTextElement = document.getElementById('noEmpresasMessageText');
    var overlayElement = document.getElementById('overlay');

    messageTextElement.textContent = message;
    messageElement.style.display = 'block';
    overlayElement.style.display = 'block';
}

function closeNoEmpresasMessage() {
    var messageElement = document.getElementById('noEmpresasMessage');
    var overlayElement = document.getElementById('overlay');

    messageElement.style.display = 'none';
    overlayElement.style.display = 'none';
}


function showAdminOptions() {
    let userRoles = localStorage.getItem('userRoles');
    if (userRoles !== 'admin') {
        document.getElementById('menuAdicionarUsuario').style.display = 'none';
    }
}

document.addEventListener('click', function(event) {
    var list = document.getElementById('nameList');
    if (!event.target.matches('#searchInput') && !event.target.matches('.arrow-button') && !event.target.matches('.name-list li')) {
        list.style.display = 'none';
    }

});
document.addEventListener('click', function(event) {
    var menu = document.getElementById('menuToggle');
    var targetElement = event.target;

    if (!menu.contains(targetElement)) {
        var checkbox = document.querySelector('#menuToggle input[type="checkbox"]');
        checkbox.checked = false;
    }
});

function logout() {
    fetch('/api/logout', {
        method: 'POST',
        credentials: 'same-origin'
    })
        .then(response => {
            if (response.ok) {
                localStorage.removeItem('idUsuario');
                localStorage.removeItem('userRoles');
                localStorage.removeItem('nomeEmpresaSelecionada');
                localStorage.removeItem('idEmpresaSelecionada');
                window.location.href = '/';
            } else {
                throw new Error('Erro ao fazer logout');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
        });
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
document.addEventListener('DOMContentLoaded', function() {
    handleEmpresa()
    loadAndDisplayUsername();
    loadNomeEmpresa();
    addClickEventToListItems();
});
