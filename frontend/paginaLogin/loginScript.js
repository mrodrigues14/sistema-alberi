document.addEventListener('DOMContentLoaded', function () {
    clearLocalStorageOnFirstLoad();
    clearCacheOnFirstLoad();

    const loginForm = document.getElementById('loginForm');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const tokenModal = document.getElementById('tokenModal');
    const tokenForm = document.getElementById('tokenForm');
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const closeModalElements = document.querySelectorAll('.close');
    const showPasswordCheckbox = document.getElementById('showPassword');
    const passwordField = document.querySelector('input[name="password"]');

    emailjs.init("IH1XjobLDTSiJcPFV");

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        let username = document.querySelector('input[name="username"]').value;
        const password = passwordField.value;

        // Remover pontos, traços e barras do CPF/CNPJ
        username = username.replace(/[.\-\/]/g, '');

        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Login successful') {
                    localStorage.setItem('username', data.user.username);
                    localStorage.setItem('userRole', data.user.role);
                    localStorage.setItem('idusuario', data.user.idusuario);
                    window.location.href = '/paginaInicial';
                } else {
                    showModalError(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showModalError('Ocorreu um erro ao tentar fazer login. Por favor, tente novamente mais tarde.');
            });
    });

    showPasswordCheckbox.addEventListener('change', function () {
        const type = this.checked ? 'text' : 'password';
        passwordField.setAttribute('type', type);
    });

    forgotPasswordLink.addEventListener('click', function () {
        forgotPasswordModal.style.display = 'block';
    });

    closeModalElements.forEach(element => {
        element.onclick = function () {
            element.parentElement.parentElement.style.display = 'none';
        };
    });

    window.onclick = function (event) {
        if (event.target == forgotPasswordModal) {
            forgotPasswordModal.style.display = 'none';
        } else if (event.target == tokenModal) {
            tokenModal.style.display = 'none';
        } else if (event.target == resetPasswordModal) {
            resetPasswordModal.style.display = 'none';
        }
    };

    forgotPasswordForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
        // Armazena o CPF no localStorage
        localStorage.setItem('cpf', cpf);

        fetch('/api/recuperarSenha', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, cpf })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Armazena o token no localStorage
                    localStorage.setItem('resetToken', data.token);

                    emailjs.send("service_l0jk62j", "template_slz48ud", {
                        to_email: email,
                        to_name: email.split('@')[0],
                        message: data.token
                    }).then(() => {
                        alert('Email de recuperação enviado.');
                        console.log(email)
                        forgotPasswordModal.style.display = 'none';
                        tokenModal.style.display = 'block';
                    }, (error) => {
                        console.error('FAILED...', error);
                        showModalError('Erro ao enviar email de recuperação. Por favor, tente novamente mais tarde.');
                    });
                } else {
                    showModalError(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showModalError('Erro ao enviar email de recuperação. Por favor, tente novamente mais tarde.');
            });
    });

    tokenForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const enteredToken = document.getElementById('token').value;
        const storedToken = localStorage.getItem('resetToken');

        if (enteredToken === storedToken) {
            tokenModal.style.display = 'none';
            resetPasswordModal.style.display = 'block';
        } else {
            showModalError('Token inválido. Por favor, verifique o token enviado para o seu email.');
        }
    });

    resetPasswordForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const novaSenha = document.getElementById('novaSenha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;
        const token = localStorage.getItem('resetToken');
        const cpf = localStorage.getItem('cpf');

        if (novaSenha !== confirmarSenha) {
            alert('As senhas não coincidem.');
            return;
        }

        fetch('/api/resetSenha', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, novaSenha, cpf })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Senha redefinida com sucesso.');
                    resetPasswordModal.style.display = 'none';
                    localStorage.removeItem('resetToken');
                    window.location.href = '/';
                } else {
                    showModalError(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showModalError('Erro ao redefinir senha. Por favor, tente novamente mais tarde.');
            });
    });

    function showModalError(message) {
        const modal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        modal.style.display = "block";
    }

    function clearLocalStorageOnFirstLoad() {
        if (!localStorage.getItem('isPageReloaded')) {
            localStorage.clear();
            localStorage.setItem('isPageReloaded', 'true');
        }
    }

    function clearCacheOnFirstLoad() {
        if (!localStorage.getItem('isCacheCleared')) {
            if ('caches' in window) {
                caches.keys().then(function(names) {
                    for (let name of names) caches.delete(name);
                });
            }
            localStorage.setItem('isCacheCleared', 'true');
        }
    }
});
