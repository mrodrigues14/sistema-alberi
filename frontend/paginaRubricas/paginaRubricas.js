let idCliente;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await fetchIdCliente();
    } catch (error) {
        console.error('Erro ao carregar o template:', error);
    }

    const rubricas = await fetchRubricas(idCliente);
    const categorias = construirArvoreDeCategorias(rubricas);
    renderRubricas(categorias, 'rubrica-lista');

    const rubricasContabeis = await fetchRubricasContabeis();
    renderRubricasContabeis(rubricasContabeis);

    document.querySelectorAll('input[name="idcliente"]').forEach(input => {
        input.value = idCliente;
    });
    document.querySelectorAll('input[name="idcliente2"]').forEach(input => {
        input.value = idCliente;
    });

    document.getElementById('adicionar-rubrica-btn').addEventListener('click', () => {
        abrirPopup('popup-adicionar-rubrica');
    });

    document.getElementById('adicionar-subrubrica-btn').addEventListener('click', () => {
        abrirPopup('popup-adicionar-subrubrica');
    });

    document.getElementById('adicionar-rubrica-contabil-btn').addEventListener('click', () => {
        abrirPopup('popup-adicionar-rubrica-contabil');
    });

    document.getElementById('form-adicionar-rubrica').addEventListener('submit', adicionarRubricaFinanceira);
    document.getElementById('form-adicionar-subrubrica').addEventListener('submit', adicionarSubRubricaFinanceira);
    document.getElementById('form-adicionar-rubrica-contabil').addEventListener('submit', adicionarRubricaContabil);
});

async function fetchIdCliente() {
    const nomeEmpresa = getStoredEmpresaName();
    const response = await fetch(`/insercao/dados-empresa?nomeEmpresa=${encodeURIComponent(nomeEmpresa)}`);
    const data = await response.json();
    console.log(data)
    idCliente = data[0].IDCLIENTE; // Assign the value globally
    console.log('Fetched idCliente:', idCliente);
}


async function fetchRubricas(idCliente) {
    const response = await fetch(`/categoria/dados?idcliente=${encodeURIComponent(idCliente)}`);
    return response.json();

}

async function fetchRubricasContabeis() {
    const response = await fetch(`/categoria/dadosContabil`);
    return response.json();
}

function construirArvoreDeCategorias(categorias) {
    let mapa = {};
    let arvore = [];

    categorias.forEach(categoria => {
        mapa[categoria.IDCATEGORIA] = {
            ...categoria,
            subcategorias: [],
            entrada: categoria.ENTRADA || false,
            saida: categoria.SAIDA || false
        };
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

function toggleGastoMes(idCategoria, buttonElement) {
    const listItem = buttonElement.closest('.rubrica');
    const buttonExtra = listItem.querySelector('.btn-gasto-extra');

    // Verifica se "Rubrica Extra" já está selecionada
    if (buttonExtra && buttonExtra.classList.contains('selected')) {
        alert("Você só pode selecionar uma opção de cada vez!");
        return; // Impede a seleção
    }

    const isSelected = buttonElement.classList.contains('selected');
    const newState = !isSelected; // Alterna o estado

    fetch('/categoria/atualizarOpcoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idCategoria, GASTO_MES: newState, GASTO_EXTRA: null }) // GASTO_EXTRA sempre null
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                buttonElement.classList.toggle('selected', newState); // Atualiza visualmente
            } else {
                console.error("Erro ao atualizar Gasto do Mês.");
            }
        })
        .catch(error => console.error("Erro:", error));
}

function toggleGastoExtra(idCategoria, buttonElement) {
    const listItem = buttonElement.closest('.rubrica');
    const buttonMes = listItem.querySelector('.btn-gasto-mes');

    // Verifica se "Rubrica do Mês" já está selecionada
    if (buttonMes && buttonMes.classList.contains('selected')) {
        alert("Você só pode selecionar uma opção de cada vez!");
        return; // Impede a seleção
    }

    const isSelected = buttonElement.classList.contains('selected');
    const newState = !isSelected; // Alterna o estado

    fetch('/categoria/atualizarOpcoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idCategoria, GASTO_MES: null, GASTO_EXTRA: newState }) // GASTO_MES sempre null
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                buttonElement.classList.toggle('selected', newState); // Atualiza visualmente
            } else {
                console.error("Erro ao atualizar Gasto Extra.");
            }
        })
        .catch(error => console.error("Erro:", error));
}



// Renderização de rubricas contábeis (sem subcategorias)
function renderRubricasContabeis(rubricasContabeis) {
    const listaElement = document.getElementById('rubrica-contabil-lista');
    listaElement.innerHTML = ''; // Limpa a lista antes de renderizar

    rubricasContabeis.forEach(rubrica => {
        const listItem = document.createElement('li');
        listItem.classList.add('rubrica');

        // Cria o nome da rubrica
        const span = document.createElement('span');
        span.textContent = rubrica.NOME;
        listItem.appendChild(span);

        // Cria a seção de ações
        const actions = document.createElement('div');
        actions.classList.add('actions');
        actions.innerHTML = `
            <button class="edit" onclick="editarRubricaContabil(${rubrica.ID_RUBRICA_CONTABIL})">✏️</button>
            <button class="delete" onclick="deletarRubricaContabil(${rubrica.ID_RUBRICA_CONTABIL})">🗑️</button>
            <button 
                class="toggle-button-rubrica btn-gasto-mes-contabil ${rubrica.GASTO_MES ? 'selected' : ''}" 
                data-id="${rubrica.ID_RUBRICA_CONTABIL}" 
                onclick="toggleGastoMesContabil(${rubrica.ID_RUBRICA_CONTABIL}, this)">
                Rubrica do Mês
            </button>
            <button 
                class="toggle-button-rubrica btn-gasto-extra-contabil ${rubrica.GASTO_EXTRA ? 'selected' : ''}" 
                data-id="${rubrica.ID_RUBRICA_CONTABIL}" 
                onclick="toggleGastoExtraContabil(${rubrica.ID_RUBRICA_CONTABIL}, this)">
                Rubrica Extra
            </button>
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
        <button 
            class="toggle-button-rubrica btn-gasto-mes ${categoria.GASTO_MES ? 'selected' : ''}" 
            data-id="${categoria.IDCATEGORIA}" 
            onclick="toggleGastoMes(${categoria.IDCATEGORIA}, this)">
            Rubrica do Mês
        </button>
        <button 
            class="toggle-button-rubrica btn-gasto-extra ${categoria.GASTO_EXTRA ? 'selected' : ''}" 
            data-id="${categoria.IDCATEGORIA}" 
            onclick="toggleGastoExtra(${categoria.IDCATEGORIA}, this)">
            Rubrica Extra
        </button>
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

function adicionarRubricaFinanceira(event) {
    event.preventDefault();

    const nomeRubrica = document.querySelector('#form-adicionar-rubrica input[name="CATEGORIA"]').value;
    const entradaCheckbox = document.querySelector('#form-adicionar-rubrica input[name="tipo"][value="entrada"]').checked;
    const saidaCheckbox = document.querySelector('#form-adicionar-rubrica input[name="tipo"][value="saida"]').checked;

    // Validação para garantir que pelo menos um tipo seja selecionado
    if (!entradaCheckbox && !saidaCheckbox) {
        alert('Por favor, selecione pelo menos um tipo (Entrada ou Saída).');
        return;
    }

    fetch('/categoria', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            CATEGORIA: nomeRubrica,
            idCliente: idCliente,
            tipo: {
                entrada: entradaCheckbox,
                saida: saidaCheckbox
            }
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Rubrica adicionada com sucesso!');
                location.reload();
            } else {
                alert('Erro ao adicionar a rubrica');
            }
        })
        .catch(error => {
            console.error('Erro ao adicionar a rubrica:', error);
        });
}


function adicionarSubRubricaFinanceira(event) {
    event.preventDefault();

    const rubricaPai = document.querySelector('#form-adicionar-subrubrica select[name="categoriaPai"]').value;
    const nomeSubRubrica = document.querySelector('#form-adicionar-subrubrica input[name="SUBCATEGORIA"]').value;
    const entradaCheckbox = document.querySelector('#form-adicionar-subrubrica input[name="tipo"][value="entrada"]').checked;
    const saidaCheckbox = document.querySelector('#form-adicionar-subrubrica input[name="tipo"][value="saida"]').checked;
    const idCliente = document.querySelector('#form-adicionar-subrubrica input[name="idcliente2"]').value;

    // Validação para garantir que pelo menos um tipo seja selecionado
    if (!entradaCheckbox && !saidaCheckbox) {
        alert('Por favor, selecione pelo menos um tipo (Entrada ou Saída).');
        return;
    }

    fetch('/categoria/subcategoria', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            categoriaPai: rubricaPai,
            SUBCATEGORIA: nomeSubRubrica,
            idCliente: idCliente,
            tipo: {
                entrada: entradaCheckbox,
                saida: saidaCheckbox
            }
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Sub-rubrica adicionada com sucesso!');
                location.reload();
            } else {
                alert('Erro ao adicionar a sub-rubrica');
            }
        })
        .catch(error => {
            console.error('Erro ao adicionar a sub-rubrica:', error);
        });
}

function adicionarRubricaContabil(event) {
    event.preventDefault();

    const nomeRubricaContabil = document.querySelector('#form-adicionar-rubrica-contabil input[name="RUBRICA_CONTABIL"]').value;
    fetch('/categoria/addContabil', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            RUBRICA_CONTABIL: nomeRubricaContabil,
            idCliente: idCliente
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Rubrica contábil adicionada com sucesso!');
                location.reload(); // Recarrega a página para exibir as novas rubricas contábeis
            } else {
                alert('Erro ao adicionar a rubrica contábil');
            }
        })
        .catch(error => {
            console.error('Erro ao adicionar a rubrica contábil:', error);
        });
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

    console.log(categoria);
    form.elements['categoriaAntiga'].value = categoria.IDCATEGORIA;
    form.elements['categoriaNova'].value = categoria.NOME;

    const entradaCheckbox = form.elements['entrada'];
    const saidaCheckbox = form.elements['saida'];

    entradaCheckbox.checked = categoria.ENTRADA;
    saidaCheckbox.checked = categoria.SAIDA;

    popup.style.display = 'flex';
}

function editarRubricaContabil(idRubricaContabil) {
    fetch(`/categoria/editarContabil/${idRubricaContabil}`)
        .then(response => response.json())
        .then(rubricaContabil => {
            abrirPopupEdicao(rubricaContabil);
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

function toggleDropdown(event, menuId) {
    event.stopPropagation(); // Impede que o evento se propague para o body
    const dropdownMenu = document.getElementById(menuId);

    // Fecha outros menus abertos
    document.querySelectorAll('.dropdown-menu-rubrica.show').forEach(menu => {
        if (menu !== dropdownMenu) {
            menu.classList.remove('show');
        }
    });

    // Alterna a exibição do menu atual
    dropdownMenu.classList.toggle('show');
}

// Fecha o menu suspenso ao clicar fora
document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu-rubrica.show').forEach(menu => {
        menu.classList.remove('show');
    });
});

function toggleGastoMesContabil(idRubricaContabil, buttonElement) {
    const rubricaElement = buttonElement.closest('.rubrica');
    const extraButton = rubricaElement.querySelector('.btn-gasto-extra-contabil');

    // Verifica se "Rubrica Extra" já está selecionada
    if (extraButton && extraButton.classList.contains('selected')) {
        alert("Você só pode selecionar uma opção de cada vez!");
        return; // Impede a seleção
    }

    const isSelected = buttonElement.classList.contains('selected');
    const newState = !isSelected; // Alterna o estado

    fetch('/categoria/atualizarOpcoesContabil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idRubricaContabil, GASTO_MES: newState, GASTO_EXTRA: false }) // GASTO_EXTRA sempre false
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                buttonElement.classList.toggle('selected', newState); // Atualiza visualmente
            } else {
                console.error("Erro ao atualizar Rubrica do Mês:", data.message || "Erro desconhecido.");
            }
        })
        .catch(error => console.error("Erro na requisição:", error));
}

function toggleGastoExtraContabil(idRubricaContabil, buttonElement) {
    const rubricaElement = buttonElement.closest('.rubrica');
    const mesButton = rubricaElement.querySelector('.btn-gasto-mes-contabil');

    // Verifica se "Rubrica do Mês" já está selecionada
    if (mesButton && mesButton.classList.contains('selected')) {
        alert("Você só pode selecionar uma opção de cada vez!");
        return; // Impede a seleção
    }

    const isSelected = buttonElement.classList.contains('selected');
    const newState = !isSelected; // Alterna o estado

    fetch('/categoria/atualizarOpcoesContabil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idRubricaContabil, GASTO_MES: false, GASTO_EXTRA: newState }) // GASTO_MES sempre false
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                buttonElement.classList.toggle('selected', newState); // Atualiza visualmente
            } else {
                console.error("Erro ao atualizar Rubrica Extra:", data.message || "Erro desconhecido.");
            }
        })
        .catch(error => console.error("Erro na requisição:", error));
}

document.addEventListener('DOMContentLoaded', function () {
    // Gerenciar comportamento das checkboxes de Entrada e Saída no formulário de rubricas
    const entradaCheckboxRubrica = document.querySelector('#form-adicionar-rubrica input[name="tipo"][value="entrada"]');
    const saidaCheckboxRubrica = document.querySelector('#form-adicionar-rubrica input[name="tipo"][value="saida"]');

    entradaCheckboxRubrica.addEventListener('change', function () {
        if (this.checked) {
            saidaCheckboxRubrica.checked = false;
        }
    });

    saidaCheckboxRubrica.addEventListener('change', function () {
        if (this.checked) {
            entradaCheckboxRubrica.checked = false;
        }
    });

    // Gerenciar comportamento das checkboxes de Entrada e Saída no formulário de sub-rubricas
    const entradaCheckboxSubrubrica = document.querySelector('#form-adicionar-subrubrica input[name="tipo"][value="entrada"]');
    const saidaCheckboxSubrubrica = document.querySelector('#form-adicionar-subrubrica input[name="tipo"][value="saida"]');

    entradaCheckboxSubrubrica.addEventListener('change', function () {
        if (this.checked) {
            saidaCheckboxSubrubrica.checked = false;
        }
    });

    saidaCheckboxSubrubrica.addEventListener('change', function () {
        if (this.checked) {
            entradaCheckboxSubrubrica.checked = false;
        }
    });

    // Gerenciar comportamento das checkboxes no formulário de edição de rubricas
    const entradaCheckboxEditarRubrica = document.querySelector('#form-editar-rubrica input[name="entrada"]');
    const saidaCheckboxEditarRubrica = document.querySelector('#form-editar-rubrica input[name="saida"]');

    entradaCheckboxEditarRubrica.addEventListener('change', function () {
        if (this.checked) {
            saidaCheckboxEditarRubrica.checked = false;
        }
    });

    saidaCheckboxEditarRubrica.addEventListener('change', function () {
        if (this.checked) {
            entradaCheckboxEditarRubrica.checked = false;
        }
    });
});


