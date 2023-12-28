function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
    var dropbtn = document.querySelector(".dropbtn");
    dropbtn.classList.toggle("dropbtn-active");
}

window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var dropbtn = document.querySelector(".dropbtn");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
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

