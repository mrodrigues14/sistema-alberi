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
            };
            document.body.appendChild(script);
        })
        .catch(error => {
            console.error('Erro ao carregar o template:', error);
        });
});

window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
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
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
        });
}
function addClickEventToListItems() {
    var listItems = document.querySelectorAll('.name-list li');
    listItems.forEach(function(item) {
        item.addEventListener('click', redirecionamentoDePagina);
    });
}

function redirecionamentoDePagina() {
    window.location.href = '/paginainicial';
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

function updateNomeEmpresa(nomeEmpresa) {
    setTimeout(() => {
        var empresaSelecionadaButton = document.querySelector('.empresaSelecionada');
        if (empresaSelecionadaButton) {
            empresaSelecionadaButton.textContent = nomeEmpresa;
        }
    }, 0);
}

addClickEventToListItems();
document.addEventListener('DOMContentLoaded', function() {
    loadNomeEmpresa();
});