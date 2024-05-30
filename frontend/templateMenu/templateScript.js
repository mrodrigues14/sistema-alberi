
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

                fetch('/seletorEmpresa/consultarEmpresas', { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        const empresaDefault = data.empresas.find(empresa => empresa.IDCLIENTE === 68);
                        if (empresaDefault) {
                            updateNomeEmpresa('Todos Clientes', 68);
                            localStorage.setItem('nomeEmpresaSelecionada', 'Todos Clientes');
                            localStorage.setItem('idEmpresaSelecionada', '68');
                        } else {
                            console.warn('Empresa padrão não encontrada');
                        }
                    })
                    .catch(error => {
                        console.error('Erro na requisição:', error);
                        showNoEmpresasMessage(error.message);
                    });
            } else {
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            window.location.href = '/';
        });
}



function toggleDropdown() {
    var dropdown = document.getElementById("dropdownContent");
    if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
    } else {
        dropdown.style.display = "block";
        document.getElementById("searchInput").focus();
        loadAndDisplayEmpresas(); // Chamar função para carregar e exibir empresas
    }
}

function toggleUserDropdown() {
    var dropdown = document.getElementById("userDropdown");
    if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
    } else {
        dropdown.style.display = "block";
    }
}

function loadAndDisplayEmpresas() {
    fetch('/seletorEmpresa/consultarEmpresas', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            var empresas = data.empresas;
            updateList('', empresas);
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
            showNoEmpresasMessage(error.message);
        });
}

document.addEventListener('click', function(event) {
    var dropdown = document.getElementById("dropdownContent");
    if (!event.target.closest('.search-box-empresa')) {
        dropdown.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    handleEmpresa();
    loadAndDisplayUsername();
    loadNomeEmpresa();
    addClickEventToListItems();
});

function loadNomeEmpresa() {
    fetch('/seletorEmpresa/consultarEmpresas', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            var empresas = data.empresas;
            var input = document.getElementById('searchInput');
            var list = document.getElementById('nameList');

            input.addEventListener('input', function(e) {
                updateList(e.target.value, empresas);
            });

            list.addEventListener('click', function(e) {
                const li = e.target.closest('li');
                if (li) {
                    document.querySelector('.selected-company').textContent = li.textContent;
                    var dropdown = document.getElementById("dropdownContent");
                    dropdown.style.display = 'none';
                    empresaSelecionada(li.dataset.nome, li.dataset.id);
                }
            });

            const empresaDefault = empresas.find(empresa => empresa.IDCLIENTE === '68');
            if (empresaDefault) {
                updateNomeEmpresa("Todos Clientes", empresaDefault.IDCLIENTE);
            }

        })
        .catch(error => {
            console.error('Erro na requisição:', error);
            showNoEmpresasMessage(error.message);
        });
}

function updateList(filter, empresas) {
    var list = document.getElementById('nameList');
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

function empresaSelecionada(nomeEmpresa, idEmpresa) {
    console.log('Setting empresa:', nomeEmpresa, idEmpresa);
    localStorage.setItem('nomeEmpresaSelecionada', nomeEmpresa);
    localStorage.setItem('idEmpresaSelecionada', idEmpresa);
    updateNomeEmpresa(nomeEmpresa, idEmpresa);
    window.location.reload()
}

function updateNomeEmpresa(nomeEmpresa, idEmpresa) {
    console.log('Updating display for:', nomeEmpresa, idEmpresa);
    var empresaSelecionadaElement = document.querySelector('.selected-company');
    if (empresaSelecionadaElement && nomeEmpresa && idEmpresa) {
        empresaSelecionadaElement.textContent = nomeEmpresa;
    }
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

function handleEmpresa() {
    var nomeEmpresa = getStoredEmpresaName();
    var idEmpresa = localStorage.getItem('idEmpresaSelecionada');
    updateNomeEmpresa(nomeEmpresa, idEmpresa);
}

function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

function addClickEventToListItems() {
    var list = document.getElementById('nameList');
    var dropdown = document.getElementById("dropdownContent");

    list.addEventListener('click', function(e) {
        const li = e.target.closest('li');
        if (li) {
            document.querySelector('.selected-company').textContent = li.textContent;
            dropdown.style.display = 'none';
            empresaSelecionada(li.dataset.nome, li.dataset.id);
        }
    });
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

    if (userRoles !== 'Administrador' && userRoles !== 'Configurador') {
        const adicionarUsuarioElement = document.getElementById('menuAdicionarUsuario');
        const clienteElement = document.getElementById('cliente');
        const bancosElement = document.getElementById('bancos');

        if (adicionarUsuarioElement) adicionarUsuarioElement.style.display = 'none';
        if (clienteElement) clienteElement.style.display = 'none';
        if (bancosElement) bancosElement.style.display = 'none';
    }

    if (userRoles !== 'Configurador') {
        const rubricasElement = document.getElementById('rubricas');
        if (rubricasElement) rubricasElement.style.display = 'none';
    }

    if (!['Administrador', 'Usuário Interno'].includes(userRoles)) {
        const adicionarUsuarioElement = document.getElementById('menuAdicionarUsuario');
        const clienteElement = document.getElementById('cliente');
        const bancosElement = document.getElementById('bancos');

        if (adicionarUsuarioElement) adicionarUsuarioElement.style.display = 'none';
        if (clienteElement) clienteElement.style.display = 'none';
        if (bancosElement) bancosElement.style.display = 'none';
    }

    if (!['Administrador', 'Usuário Interno', 'Usuário Externo'].includes(userRoles)) {
        const adicionarUsuarioElement = document.getElementById('menuAdicionarUsuario');
        const clienteElement = document.getElementById('cliente');
        const bancosElement = document.getElementById('bancos');
        const estudosElement = document.getElementById('Estudos');
        const extratoElement = document.getElementById('Extrato');

        if (adicionarUsuarioElement) adicionarUsuarioElement.style.display = 'none';
        if (clienteElement) clienteElement.style.display = 'none';
        if (bancosElement) bancosElement.style.display = 'none';
        if (estudosElement) estudosElement.style.display = 'none';
        if (extratoElement) extratoElement.style.display = 'none';
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