document.addEventListener('DOMContentLoaded', function() {
    fetch('/templateMenu/template.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('menu-container').innerHTML = data;
            const link = document.createElement('link');
            link.href = '/templateMenu/styletemplate.css';
            link.rel = 'stylesheet';
            link.type = 'text/css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = '/templateMenu/templateScript.js';
            script.onload = function() {
                loadAndDisplayUsername();
                handleEmpresa();
                loadNomeEmpresa();
            };
            document.body.appendChild(script);
        })
        .catch(error => {
            console.error('Erro ao carregar o template:', error);
        });

    fetch('/adicionarUsuario/empresas')
        .then(response => response.json())
        .then(data => {
            const empresasList = document.getElementById('empresas-list');
            data.forEach(empresa => {
                const label = document.createElement('label');
                label.innerHTML = `<input type="checkbox" name="empresa" value="${empresa.IDCLIENTE}"> ${empresa.NOME}`;
                empresasList.appendChild(label);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar empresas:', error);
        });
});

function adicionarUsuario() {
    const cpf = document.getElementById('cpf').value;
    const nome = document.getElementById('nome').value;
    const senha = '123456';
    const roles = [];
    const empresas = [];

    document.querySelectorAll('input[name="role"]:checked').forEach((checkbox) => {
        roles.push(checkbox.value);
    });

    document.querySelectorAll('input[name="empresa"]:checked').forEach((checkbox) => {
        empresas.push(checkbox.value);
    });

    const data = {
        cpf: cpf,
        nome: nome,
        senha: senha,
        roles: roles,
        empresas: empresas
    };

    fetch('/adicionarUsuario/add', {
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
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Erro ao adicionar usuário.');
        });
}

function cancelar() {
    document.getElementById('cpf').value = '';
    document.getElementById('nome').value = '';
    document.querySelectorAll('input[name="role"]:checked').forEach((checkbox) => {
        checkbox.checked = false;
    });
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
    window.location.reload();
}
