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

    fetch('/usuario/listar')
        .then(response => response.json())
        .then(data => {
            const userSelect = document.getElementById('userSelect');
            data.forEach(usuario => {
                const option = document.createElement('option');
                option.value = usuario.ID;
                option.textContent = usuario.NOME;
                userSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar usuários:', error);
        });
});

function loadUserDetails() {
    const userId = document.getElementById('userSelect').value;
    if (!userId) {
        return;
    }

    fetch(`/usuario/${userId}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('cpf').value = data.CPF ? formatCPF(data.CPF) : '';
            document.getElementById('nome').value = data.NOME;
            document.getElementById('email').value = data.EMAIL;
            document.getElementById('role').value = data.ROLE;
            document.getElementById('ativo').value = data.ATIVO ? 'true' : 'false';

            fetch('/usuario/empresas')
                .then(response => response.json())
                .then(empresas => {
                    const empresasList = document.getElementById('empresas-list');
                    empresasList.innerHTML = '';
                    empresas.forEach(empresa => {
                        const isChecked = data.EMPRESAS.includes(empresa.IDCLIENTE) ? 'checked' : '';
                        const label = document.createElement('label');
                        label.innerHTML = `<input type="checkbox" name="empresa" value="${empresa.IDCLIENTE}" ${isChecked}> ${empresa.NOME}`;
                        empresasList.appendChild(label);
                    });
                })
                .catch(error => {
                    console.error('Erro ao carregar empresas:', error);
                });

            document.getElementById('editUserForm').style.display = 'block';
        })
        .catch(error => {
            console.error('Erro ao carregar detalhes do usuário:', error);
        });
}

function editarUsuario() {
    const userId = document.getElementById('userSelect').value;
    const cpfInput = document.getElementById('cpf');
    let cpf = cpfInput.value;
    cpf = cpf.replace(/\D/g, ''); // Remove todos os caracteres não numéricos

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
