document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadTemplateAndStyles();
    } catch (error) {
        console.error('Erro ao carregar o template:', error);
    }
});

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

function adicionarUsuario(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const cpfInput = document.getElementById('cpf');
    let cpf = cpfInput.value;
    cpf = cpf.replace(/\D/g, ''); // Remove todos os caracteres não numéricos

    if (cpf.length !== 11) {
        alert('CPF deve conter exatamente 11 dígitos.');
        return false;
    }

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const role = document.getElementById('role').value;

    if (!role) {
        alert('Por favor, selecione uma função.');
        return false;
    }

    const empresas = [];
    document.querySelectorAll('input[name="empresa"]:checked').forEach((checkbox) => {
        empresas.push(checkbox.value);
    });

    if (!empresas.includes('68')) {
        empresas.push('68');
    }

    const data = {
        cpf: cpf,
        nome: nome,
        email: email,
        role: role,
        empresas: empresas,
        senha: "$2b$10$vct7oGqYuA2x9WGd/G3oS.mbTOIEXf7bGJC3vETN4j9ij8qj8IA9m"
    };

    fetch('/usuario/add', {
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
            showSuccessPopup();
            resetForm();
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Erro ao adicionar usuário.');
    });

    return false;
}


function resetForm() {
    document.getElementById('addUserForm').reset();
}

function cancelar() {
    document.getElementById('cpf').value = '';
    document.getElementById('nome').value = '';
    document.getElementById('email').value = '';
    document.getElementById('role').value = '';
    document.querySelectorAll('input[name="empresa"]:checked').forEach((checkbox) => {
        checkbox.checked = false;
    });
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
    cancelar();
    window.location.reload();
}
