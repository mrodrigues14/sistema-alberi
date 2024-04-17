window.onclick = function(event) {
    var searchInput = document.getElementById('searchInput');
    var nameList = document.getElementById('nameList');
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var empresaSelecionadaButton = document.querySelector('.empresaSelecionada');

    // Verifica se o clique foi fora da caixa de pesquisa e da lista
    if (!searchInput.contains(event.target) && !nameList.contains(event.target)) {
        nameList.style.display = 'none';
    }

    // Gerencia cliques fora dos botões de dropdown
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

document.addEventListener('DOMContentLoaded', function() {
    // Carrega inicialmente a lista de empresas
    loadNomeEmpresa();
});

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
            list.style.display = 'block';
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
        });
}

function inputNomeEmpresa(names) {
    var input = document.getElementById('searchInput');
    var list = document.getElementById('nameList');
    list.innerHTML = '';
    names.forEach(function(name) {
        var li = document.createElement('li');
        li.textContent = name;
        list.appendChild(li);
    });

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
        var filteredNames = names.filter(function(name) {
            return name && name.toLowerCase().includes(filter ? filter.toLowerCase() : '');
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

function addClickEventToListItems() {
    var listItems = document.querySelectorAll('.name-list li');
    listItems.forEach(function(item) {
        item.addEventListener('click', function() {
            window.location.href = '/paginaInicial';
        });
    });
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
