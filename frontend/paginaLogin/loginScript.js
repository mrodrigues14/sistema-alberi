

document.addEventListener('DOMContentLoaded', function () {
    const auth0Client = new Auth0Client({
        domain: 'dev-usjcus5lkrz7ygfy.us.auth0.com',
        client_id: 'oLGVuEq7pnHrs1WcfZZVXjrpT3y7RonD',
        redirect_uri: 'http://localhost:8080/paginaInicial'
    });

    auth0Client.isAuthenticated().then(function (isAuthenticated) {
        if (isAuthenticated) {
            auth0Client.getIdTokenClaims().then(function(claims) {
                const username = claims['nickname'];
                const userRole = claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
                localStorage.setItem('userRole', userRole)

                buscarIdUsuarioApi(username);
            });
        } else {
            auth0Client.loginWithRedirect();
        }
    });

    window.logout = function() {
        auth0Client.logout({
            returnTo: window.location.origin
        });
    };
});

function buscarIdUsuarioApi(username) {
    fetch('/login/buscarIdUsuario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username})
    })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.idusuario) {
                localStorage.setItem('userId', data.idusuario);
                window.location.href = '/paginaInicial';
            } else {
                console.error('Usuário não encontrado ou erro na requisição.');
            }
        })
        .catch(error => {
            console.error('Erro na requisição para obter o ID do usuário:', error);
        });
}
