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
                const role = claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

                fetchUserIdFromApi(username, role);
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

function fetchUserIdFromApi(username, role) {
    fetch('/api/get-user-id', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, role: role })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.userId) {
                localStorage.setItem('userId', data.userId);
                window.location.href = '/paginaInicial';
            } else {
                console.error('Usuário não encontrado ou erro na requisição.');
            }
        })
        .catch(error => {
            console.error('Erro na requisição para obter o ID do usuário:', error);
        });
}
