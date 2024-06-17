document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadTemplateAndStyles();
        loadUsers();
    } catch (error) {
        console.error('Erro ao carregar o template:', error);
    }
});

async function loadUsers() {
    try {
        const response = await fetch('/usuario/listar');
        const usuarios = await response.json();
        const userSelect = document.getElementById('userSelect');

        userSelect.innerHTML = ''; // Limpa os itens anteriores

        usuarios.forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario.ID;
            option.textContent = usuario.NOME;
            userSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
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

async function loadUserDetails() {
    const userId = document.getElementById('userSelect').value;
    if (!userId) {
        return;
    }

    try {
        const response = await fetch(`/usuario/${userId}`);
        const data = await response.json();

        document.getElementById('cpf').value = data.CPF ? formatCPF(data.CPF) : '';
        document.getElementById('nome').value = data.NOME;
        document.getElementById('email').value = data.EMAIL;
        document.getElementById('role').value = data.ROLE;
        document.getElementById('ativo').value = data.ATIVO ? 'true' : 'false';

        const empresasResponse = await fetch('/usuario/empresas');
        const empresas = await empresasResponse.json();
        const empresasList = document.getElementById('empresas-list');
        empresasList.innerHTML = '';

        const todosClienteOption = document.createElement('label');
        todosClienteOption.innerHTML = `<input type="checkbox" name="empresa" value="68" id="todos"> Todos Clientes`;
        empresasList.appendChild(todosClienteOption);

        empresas.forEach(empresa => {
            const isChecked = data.EMPRESAS && data.EMPRESAS.includes(empresa.IDCLIENTE) ? 'checked' : '';
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" name="empresa" value="${empresa.IDCLIENTE}" ${isChecked}> ${empresa.NOME}`;
            empresasList.appendChild(label);
        });

        const todosCheckbox = document.getElementById('todos');
        todosCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('input[name="empresa"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = todosCheckbox.checked;
            });
        });

        document.getElementById('editUserForm').style.display = 'block';
    } catch (error) {
        console.error('Erro ao carregar detalhes do usuário:', error);
    }
}

function editarUsuario() {
    const userId = document.getElementById('userSelect').value;
    const cpfInput = document.getElementById('cpf');
    let cpf = cpfInput.value;
    cpf = cpf.replace(/\D/g, '');

    if (cpf.length !== 11) {
        alert('CPF deve conter exatamente 11 dígitos.');
        return;
    }

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const role = document.getElementById('role').value;
    const ativo = document.getElementById('ativo').value === 'true';
    const empresas = [];

    document.querySelectorAll('input[name="empresa"]:checked').forEach((checkbox) => {
        empresas.push(checkbox.value);
    });

    const data = {
        cpf: cpf,
        nome: nome,
        email: email,
        role: role,
        ativo: ativo,
        empresas: empresas
    };

    fetch(`/usuario/edit/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                showSuccessPopup()
                document.getElementById('editUserForm').reset();
                document.getElementById('editUserForm').style.display = 'none';
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Erro ao atualizar usuário.');
        });
}

function cancelar() {
    document.getElementById('editUserForm').reset();
    document.getElementById('editUserForm').style.display = 'none';
}

function formatCPF(cpf) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function showSuccessPopup() {
    const successPopup = document.getElementById('successPopup');
    const popupContent = successPopup.querySelector('.popup-content');

    const lottiePlayer = document.createElement('dotlottie-player');
    lottiePlayer.setAttribute('src', 'https://lottie.host/f970532a-cffa-46c6-bb0c-a868908cb65c/UR2kFoKi9D.json');
    lottiePlayer.setAttribute('background', 'transparent');
    lottiePlayer.setAttribute('speed', '2');
    lottiePlayer.style.width = '300px';
    lottiePlayer.style.height = '300px';
    lottiePlayer.setAttribute('direction', '1');
    lottiePlayer.setAttribute('playMode', 'normal');
    lottiePlayer.setAttribute('autoplay', 'true');

    popupContent.insertBefore(lottiePlayer, popupContent.firstChild);

    successPopup.classList.add('show', 'fade-in');
}

function closePopup() {
    const successPopup = document.getElementById('successPopup');
    successPopup.classList.remove('show');
    window.location.reload();
}
