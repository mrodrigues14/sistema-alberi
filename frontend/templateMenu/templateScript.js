let idcliente = null;

document.addEventListener('DOMContentLoaded', function() {
    clearLocalStorageOnFirstLoad();
    clearCacheOnFirstLoad();
    handleEmpresa();
    loadAndDisplayUsername();
    loadNomeEmpresa();
    addClickEventToListItems();

    document.addEventListener('click', function(event) {
        closeAllDropdowns(event);
    });

    document.addEventListener('click', function(event) {
        var menu = document.getElementById('menu');
        if (!event.target.closest('.hamburger-menu') && !event.target.closest('#menu')) {
            menu.classList.remove('show');
        }
    });
});

function clearLocalStorageOnFirstLoad() {
    if (!localStorage.getItem('isPageReloaded')) {
        localStorage.clear();
        localStorage.setItem('isPageReloaded', 'true');
    }
}

function clearCacheOnFirstLoad() {
    if (!localStorage.getItem('isCacheCleared')) {
        if ('caches' in window) {
            caches.keys().then(function(names) {
                for (let name of names) caches.delete(name);
            });
        }
        localStorage.setItem('isCacheCleared', 'true');
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

                idcliente = data.idusuario;

                console.log('Global idcliente:', idcliente);

                showAdminOptions();

                if (!localStorage.getItem('idEmpresaSelecionada')) {
                    fetch('/seletorEmpresa/consultarEmpresas', { method: 'POST' })
                        .then(response => response.json())
                        .then(data => {
                            if (data.empresas && data.empresas.length > 0) {
                                const empresaDefault = data.empresas.find(empresa => empresa.IDCLIENTE === 68);
                                if (empresaDefault) {
                                    updateNomeEmpresa(empresaDefault.NOME, empresaDefault.IDCLIENTE);
                                    localStorage.setItem('nomeEmpresaSelecionada', empresaDefault.NOME);
                                    localStorage.setItem('idEmpresaSelecionada', empresaDefault.IDCLIENTE);
                                } else {
                                    console.warn('Empresa padrão não encontrada');
                                }
                            } else {
                                console.warn('Nenhuma empresa encontrada');
                            }
                        })
                        .catch(error => {
                            console.error('Erro na requisição:', error);
                            showNoEmpresasMessage(error.message);
                        });
                }

            } else {
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            window.location.href = '/';
        });
}
function toggleDropdown(dropdownId) {
    var dropdown = document.getElementById(dropdownId);
    if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
    } else {
        closeAllDropdowns();
        dropdown.style.display = "block";
        if (dropdownId === 'dropdownContent') {
            document.getElementById("searchInput").focus();
            loadAndDisplayEmpresas();
        }
    }
}

function toggleUserDropdown() {
    var dropdown = document.getElementById("userDropdown");
    if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
    } else {
        closeAllDropdowns();
        dropdown.style.display = "block";
    }
}

function toggleMenu() {
    var menu = document.getElementById('menu');
    if (menu.classList.contains('show')) {
        menu.classList.remove('show');
    } else {
        menu.classList.add('show');
    }
}

function loadAndDisplayEmpresas() {
    fetch('/seletorEmpresa/consultarEmpresas', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            var empresas = data.empresas || [];
            if (localStorage.getItem('userRoles') === 'Administrador') {
                empresas.unshift({ IDCLIENTE: 'perfilVinculado', NOME: 'Empresas Vinculadas ao Perfil' });
            }

            updateList('', empresas);
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
            showNoEmpresasMessage(error.message);
        });
}


function loadNomeEmpresa() {
    fetch('/seletorEmpresa/consultarEmpresas', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            var empresas = data.empresas || [];
            var input = document.getElementById('searchInput');
            var list = document.getElementById('nameList');

            input.addEventListener('input', function(e) {
                updateList(e.target.value, empresas);
            });

            list.addEventListener('click', function(e) {
                const li = e.target.closest('li');
                if (li) {
                    document.querySelector('.selected-company').textContent = li.dataset.apelido;
                    var dropdown = document.getElementById("dropdownContent");
                    dropdown.style.display = 'none';
                    empresaSelecionada(li.dataset.nome, li.dataset.id);
                }
            });

            if (empresas.length > 0) {
                const empresaDefault = empresas.find(empresa => empresa.IDCLIENTE === '68');
                if (empresaDefault) {
                    updateNomeEmpresa("Todos Clientes", empresaDefault.IDCLIENTE);
                }
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
        var displayText = data.APELIDO || data.NOME;
        return displayText.toLowerCase().includes(safeFilter);
    });

    filteredData = filteredData.filter((empresa, index, self) =>
            index === self.findIndex((e) => (
                (e.APELIDO || e.NOME) === (empresa.APELIDO || empresa.NOME) && e.IDCLIENTE === empresa.IDCLIENTE
            ))
    );

    list.innerHTML = '';
    filteredData.forEach(function(data) {
        var displayText = data.APELIDO || data.NOME;
        var li = document.createElement('li');
        li.textContent = displayText;  // Exibir o apelido ou o nome
        li.setAttribute('data-nome', data.NOME);
        li.setAttribute('data-apelido', data.APELIDO);
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
    window.location.reload();
}

function updateNomeEmpresa(nomeEmpresa, idEmpresa) {
    console.log('Updating display for:', nomeEmpresa, idEmpresa);
    var empresaSelecionadaElement = document.querySelector('.selected-company');
    if (empresaSelecionadaElement && nomeEmpresa && idEmpresa) {
        empresaSelecionadaElement.textContent = nomeEmpresa;
    }
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
    const currentPage = window.location.pathname;
    const redirectionFlag = localStorage.getItem('redirectionDone');
    const elementsToHideForRoles = {
        'Usuário Interno': ['rubricas', 'configCliente', 'configUsuario'],
        'Usuário Externo': ['rubricas', 'menuAdicionarUsuario', 'cliente', 'bancos', 'Estudos', 'Extrato', 'configCliente', 'configUsuario', 'menuTarefas'],
        'default': ['menuAdicionarUsuario', 'cliente', 'bancos', 'Estudos', 'Extrato', 'rubricas']
    };

    const adicionarUsuarioElement = document.getElementById('menuAdicionarUsuario');
    const clienteElement = document.getElementById('cliente');
    const bancosElement = document.getElementById('bancos');
    const estudosElement = document.getElementById('Estudos');
    const extratoElement = document.getElementById('Extrato');
    const rubricasElement = document.getElementById('rubricas');
    const tarefasElement = document.getElementById('tarefas');
    const clienteDropdownElement = document.getElementById('configCliente');
    const usuarioDropdownElement = document.getElementById('configUsuario');

    const roleElements = {
        'menuAdicionarUsuario': adicionarUsuarioElement,
        'cliente': clienteElement,
        'bancos': bancosElement,
        'Estudos': estudosElement,
        'Extrato': extratoElement,
        'rubricas': rubricasElement,
        'configCliente': clienteDropdownElement,
        'configUsuario': usuarioDropdownElement,
        'menuTarefas': tarefasElement
    };

    if (userRoles === 'Usuário Externo' && currentPage === '/tarefas/' && redirectionFlag !== true) {
        localStorage.setItem('redirectionDone', 'true');
        window.location.href = '/estudos/resumoMensal';
        return;
    }

    if (userRoles === 'Administrador' || userRoles === 'Configurador') {
        Object.values(roleElements).forEach(element => {
            if (element) element.style.display = 'block';
        });
        return;
    }

    const elementsToHide = elementsToHideForRoles[userRoles] || elementsToHideForRoles['default'];
    elementsToHide.forEach(elementId => {
        const element = roleElements[elementId];
        if (element) element.style.display = 'none';
    });
}

function closeAllDropdowns(event) {
    var dropdowns = document.querySelectorAll('.dropdown-content');
    dropdowns.forEach(function(dropdown) {
        if (event && event.target.closest('.menu-item, .selected-company, .usernameDisplay')) {
            return;
        }
        dropdown.style.display = 'none';
    });
}

document.addEventListener('click', function(event) {
    var list = document.getElementById('nameList');
    if (!event.target.matches('#searchInput') && !event.target.matches('.arrow-button') && !event.target.matches('.name-list li')) {
        list.style.display = 'none';
    }
});

function logout() {
    fetch('/api/logout', {
        method: 'POST',
        credentials: 'same-origin'
    })
        .then(response => {
            if (response.ok) {
                localStorage.clear();
                window.location.href = '/';
            } else {
                throw new Error('Erro ao fazer logout');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    highlightActiveMenuItem();
});

function highlightActiveMenuItem() {
    const currentPath = window.location.pathname; // Obtém o caminho atual da URL
    console.log(currentPath)
    const menuItems = document.querySelectorAll('.menu-inline li a'); // Seleciona todos os links do menu

    menuItems.forEach(item => {
        const href = item.getAttribute('href'); // Obtém o href do link
        if (currentPath.startsWith(href)) {
            const menuButton = item.querySelector('.menu-item');
            if (menuButton) {
                menuButton.classList.add('active'); // Adiciona a classe 'active' ao botão correspondente
            }
        } else {
            const menuButton = item.querySelector('.menu-item');
            if (menuButton) {
                menuButton.classList.remove('active'); // Remove a classe 'active' de outros itens
            }
        }
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
