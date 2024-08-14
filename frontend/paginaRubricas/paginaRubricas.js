let idCliente; // Definido como variável global

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadTemplateAndStyles();
        await fetchIdCliente(); // Certificando-se de que idCliente é definido aqui
    } catch (error) {
        console.error('Erro ao carregar o template:', error);
    }

    const rubricas = await fetchRubricas(idCliente);
    const categorias = construirArvoreDeCategorias(rubricas);
    renderRubricas(categorias);

    // Configura o campo idcliente nos formulários de adição
    document.querySelector('input[name="idcliente"]').value = idCliente;
    document.querySelector('input[name="idcliente2"]').value = idCliente;

    // Preenche o seletor de rubrica-pai no formulário de sub-rubrica
    const categoriaPaiSelect = document.querySelector('select[name="categoriaPai"]');
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.IDCATEGORIA;
        option.textContent = categoria.NOME;
        categoriaPaiSelect.appendChild(option);
    });

    // Adicionar event listeners aos botões
    document.getElementById('adicionar-rubrica-btn').addEventListener('click', () => {
        abrirPopup('popup-adicionar-rubrica');
    });

    document.getElementById('adicionar-subrubrica-btn').addEventListener('click', () => {
        abrirPopup('popup-adicionar-subrubrica');
    });
});

async function fetchIdCliente() {
    const nomeEmpresa = getStoredEmpresaName();
    const response = await fetch(`/insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`);
    const data = await response.json();
    idCliente = data[0].IDCLIENTE; // Atribui o valor à variável global
}

async function fetchRubricas(idCliente) {
    const response = await fetch(`/categoria/dados?idcliente=${encodeURIComponent(idCliente)}`);
    return response.json();
}

function construirArvoreDeCategorias(categorias) {
    let mapa = {};
    let arvore = [];

    categorias.forEach(categoria => {
        mapa[categoria.IDCATEGORIA] = {...categoria, subcategorias: []};
    });

    Object.values(mapa).forEach(categoria => {
        if (categoria.ID_CATEGORIA_PAI) {
            mapa[categoria.ID_CATEGORIA_PAI].subcategorias.push(categoria);
        } else {
            arvore.push(categoria);
        }
    });

    return arvore;
}

function renderRubricas(categorias) {
    const listaElement = document.getElementById('rubrica-lista');
    listaElement.innerHTML = '';

    categorias.forEach(categoria => {
        adicionarCategoriaAoDom(categoria, listaElement);
    });
}

function adicionarCategoriaAoDom(categoria, container, nivel = 0) {
    const listItem = document.createElement('li');
    listItem.classList.add('rubrica');

    const span = document.createElement('span');
    span.textContent = categoria.NOME;
    listItem.appendChild(span);

    const actions = document.createElement('div');
    actions.classList.add('actions');
    actions.innerHTML = `
        <button class="edit" onclick="editarCategoria(${categoria.IDCATEGORIA})">✏️</button>
        <button class="delete" onclick="deletarCategoria(${categoria.IDCATEGORIA})">🗑️</button>
    `;
    listItem.appendChild(actions);

    listItem.style.paddingLeft = `${nivel * 20}px`;

    container.appendChild(listItem);

    if (categoria.subcategorias.length > 0) {
        categoria.subcategorias.forEach(subcategoria => {
            adicionarCategoriaAoDom(subcategoria, container, nivel + 1);
        });
    }
}

function editarCategoria(idCategoria) {
    fetch(`/categoria/editar/${idCategoria}`)
        .then(response => response.json())
        .then(categoria => {
            abrirPopupEdicao(categoria);
        })
        .catch(error => {
            console.error('Erro ao buscar a categoria:', error);
        });
}

function abrirPopupEdicao(categoria) {
    const popup = document.getElementById('popup-editar-rubrica');
    const form = document.getElementById('form-editar-rubrica');

    form.elements['categoriaAntiga'].value = categoria.IDCATEGORIA;
    form.elements['categoriaNova'].value = categoria.NOME;
    form.elements['idcliente'].value = fetchIdCliente();

    popup.style.display = 'flex';
}

function fecharPopup(popupId) {
    document.getElementById(popupId).style.display = 'none';
}

function deletarCategoria(idCategoria) {
    if (confirm('Tem certeza que deseja remover esta rubrica?')) {
        fetch(`/categoria/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idCliente: idCliente, categoria: idCategoria })
        })
            .then(response => {
                if (response.ok) {
                    alert('Rubrica removida com sucesso');
                    location.reload();
                } else {
                    alert('Erro ao remover a rubrica');
                }
            })
            .catch(error => {
                console.error('Erro ao remover a rubrica:', error);
            });
    }
}

function abrirPopup(popupId) {
    const popup = document.getElementById(popupId);
    popup.style.display = 'flex';
}


function fecharPopup(popupId) {
    document.getElementById(popupId).style.display = 'none';
}

async function loadTemplateAndStyles() {
    const cachedCSS = localStorage.getItem('templateCSS');
    const cachedHTML = localStorage.getItem('templateHTML');

    if (cachedCSS && cachedHTML) {
        applyCSS(cachedCSS);
        applyHTML(cachedHTML);
    } else {
        const [cssData, htmlData] = await Promise.all([
            fetchText('/templateMenu/styletemplate.css'),
            fetchText('/templateMenu/template.html')
        ]);

        localStorage.setItem('templateCSS', cssData);
        localStorage.setItem('templateHTML', htmlData);

        applyCSS(cssData);
        applyHTML(htmlData);
    }

    const script = document.createElement('script');
    script.src = '/templateMenu/templateScript.js';
    script.onload = function() {
        loadAndDisplayUsername();
        handleEmpresa();
        loadNomeEmpresa();
    };
    document.body.appendChild(script);
}

function fetchText(url) {
    return fetch(url).then(response => response.text());
}

function applyCSS(cssData) {
    const style = document.createElement('style');
    style.textContent = cssData;
    document.head.appendChild(style);
}

function applyHTML(htmlData) {
    document.getElementById('menu-container').innerHTML = htmlData;
}

function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}
