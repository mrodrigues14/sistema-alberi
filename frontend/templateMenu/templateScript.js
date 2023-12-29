function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
    document.querySelector('.dropbtn').classList.toggle('active');
    var empresaSelecionada = document.querySelector('.empresaSelecionada');
    if(document.querySelector('.dropbtn').classList.contains('active')){
        empresaSelecionada.style.borderRadius = '0';
    } else {
        empresaSelecionada.style.borderRadius = '0 0 5px 5px';
    }
}

window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
                document.querySelector('.dropbtn').classList.remove('active');
                var empresaSelecionada = document.querySelector('.empresaSelecionada');
                empresaSelecionada.style.borderRadius = '0 0 5px 5px';
            }
        }
    }
}
function loadAndDisplayUsername() {
    fetch('/api/usuario-logado')
        .then(response => {
            if (!response.ok) {
                throw new Error('Não foi possível obter o nome do usuário logado');
            }
            return response.json();
        })
        .then(data => {
            const userButton = document.querySelector('.usernameDisplay');
            if (userButton && data.username) {
                userButton.textContent = data.username;
            }
        })
        .catch(error => {
            console.error('Erro:', error);
        });
}

