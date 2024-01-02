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

function loadNomeEmpresa() {
    fetch('/paginainicial/consultarEmpresas', { method: 'POST' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Não foi possível buscar as empresas');
            }
            return response.json();
        })
        .then(data => {
            var names = data;
            inputNomeEmpresa(names);
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
        });
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
        var filteredNames = names.filter(function(name) {
            return name.toLowerCase().includes(filter.toLowerCase());
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

document.addEventListener('DOMContentLoaded', function() {
    loadNomeEmpresa();
});
