document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.querySelector('form');

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        let username = document.querySelector('input[name="username"]').value;
        const password = document.querySelector('input[name="password"]').value;

        // Remover pontos, traços e barras do CPF/CNPJ
        username = username.replace(/[.\-\/]/g, '');

        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
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
            .catch((error) => {
                console.error('Error:', error);
                showModalError('Ocorreu um erro ao tentar fazer login. Por favor, tente novamente mais tarde.');
            });
    });
});

function showModalError(message) {
    const modal = document.getElementById('errorModal');
    const span = document.getElementsByClassName('close')[0];
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.textContent = message;

    modal.style.display = "block";

    span.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}
