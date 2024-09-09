let idCliente; // Definido como variável global

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadTemplateAndStyles();
        await fetchIdCliente(); // Certificando-se de que idCliente é definido aqui
    } catch (error) {
        console.error('Erro ao carregar o template:', error);
    }

    // Fetch e renderização das Rubricas Financeiras
    const rubricas = await fetchRubricas(idCliente);
    console.log(rubricas)
    const categorias = construirArvoreDeCategorias(rubricas);
    renderRubricas(categorias, 'rubrica-lista');

    // Fetch e renderização das Rubricas Contábeis (sem subcategorias)
    const rubricasContabeis = await fetchRubricasContabeis();
    renderRubricasContabeis(rubricasContabeis);

    // Configura o campo idcliente nos formulários de adição
    document.querySelector('input[name="idcliente"]').value = idCliente;
    document.querySelector('input[name="idcliente2"]').value = idCliente;

    // Preenche o seletor de rubrica-pai no formulário de sub-rubrica financeira
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

    // Botão para adicionar rubrica contábil
    document.getElementById('adicionar-rubrica-contabil-btn').addEventListener('click', () => {
        abrirPopup('popup-adicionar-rubrica-contabil');
    });
});

async function fetchIdCliente() {
    const nomeEmpresa = getStoredEmpresaName();
    const response = await fetch(`/insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`);
    const data = await response.json();
    idCliente = data[0].IDCLIENTE; // Atribui o valor à variável global
}

// Fetch para rubricas financeiras
async function fetchRubricas(idCliente) {
    const response = await fetch(`/categoria/dados?idcliente=${encodeURIComponent(idCliente)}`);
    return response.json();

}

// Fetch para rubricas contábeis
async function fetchRubricasContabeis() {
    const response = await fetch(`/categoria/dadosContabil`);
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

// Renderização de rubricas financeiras (com subcategorias)
function renderRubricas(categorias, listaId) {
    const listaElement = document.getElementById(listaId);
    listaElement.innerHTML = '';

    categorias.forEach(categoria => {
        adicionarCategoriaAoDom(categoria, listaElement);
    });
}

// Renderização de rubricas contábeis (sem subcategorias)
function renderRubricasContabeis(rubricasContabeis) {
    const listaElement = document.getElementById('rubrica-contabil-lista');
    listaElement.innerHTML = '';

    rubricasContabeis.forEach(rubrica => {
        const listItem = document.createElement('li');
        listItem.classList.add('rubrica'); // Mesma classe usada para manter o estilo igual

        const span = document.createElement('span');
        span.textContent = rubrica.NOME;
        listItem.appendChild(span);

        const actions = document.createElement('div');
        actions.classList.add('actions'); // Usando a mesma classe de ações
        actions.innerHTML = `
            <button class="edit" onclick="editarRubricaContabil(${rubrica.ID_RUBRICA_CONTABIL})">✏️</button>
            <button class="delete" onclick="deletarRubricaContabil(${rubrica.ID_RUBRICA_CONTABIL})">🗑️</button>
        `;
        listItem.appendChild(actions);

        listaElement.appendChild(listItem);
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

    // Preencha o formulário com os dados da categoria selecionada
    form.elements['categoriaAntiga'].value = categoria.IDCATEGORIA;
    form.elements['categoriaNova'].value = categoria.NOME;

    // Abre o popup de edição
    popup.style.display = 'flex';
}

// Funções para rubricas contábeis
function editarRubricaContabil(idRubricaContabil) {
    fetch(`/categoria/editarContabil/${idRubricaContabil}`)
        .then(response => response.json())
        .then(rubricaContabil => {
            abrirPopupEdicaoContabil(rubricaContabil);
        })
        .catch(error => {
            console.error('Erro ao buscar a rubrica contábil:', error);
        });
}

function abrirPopupEdicaoContabil(rubricaContabil) {
    const popup = document.getElementById('popup-editar-rubrica-contabil');
    const form = document.getElementById('form-editar-rubrica-contabil');

    form.elements['rubricaContabilAntiga'].value = rubricaContabil.ID_RUBRICA_CONTABIL;
    form.elements['rubricaContabilNova'].value = rubricaContabil.NOME;

    popup.style.display = 'flex';
}

function deletarRubricaContabil(idRubricaContabil) {
    if (confirm('Tem certeza que deseja remover esta rubrica contábil?')) {
        fetch(`/categoria/deleteContabil`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idRubricaContabil })
        })
            .then(response => {
                if (response.ok) {
                    alert('Rubrica contábil removida com sucesso');
                    location.reload();
                } else {
                    alert('Erro ao remover a rubrica contábil');
                }
            })
            .catch(error => {
                console.error('Erro ao remover a rubrica contábil:', error);
            });
    }
}

// Funções auxiliares para abrir/fechar popups
function abrirPopup(popupId) {
    const popup = document.getElementById(popupId);
    popup.style.display = 'flex';
}

function fecharPopup(popupId) {
    document.getElementById(popupId).style.display = 'none';
}

// Funções de template e estilos
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
