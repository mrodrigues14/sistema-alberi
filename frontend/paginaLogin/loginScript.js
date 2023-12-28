document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.querySelector('form');

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.querySelector('input[name="username"]').value;
        const password = document.querySelector('input[name="password"]').value;

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
                    window.location.href = '/paginaInicial/paginaInicial.html';
                } else {
                    alert(data.message);
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    });
});