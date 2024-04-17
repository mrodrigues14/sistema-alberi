

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
