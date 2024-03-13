function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
    document.querySelector('.dropbtn').classList.toggle('active');
    var empresaSelecionada = document.querySelector('.empresaSelecionada');
    if (document.querySelector('.dropbtn').classList.contains('active')) {
        empresaSelecionada.style.borderRadius = '0';
    } else {
        empresaSelecionada.style.borderRadius = '0 0 5px 5px';
    }
}

window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
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

function handleEmpresa() {
    var nomeEmpresa = getStoredEmpresaName();
    updateNomeEmpresa(nomeEmpresa);
}

function getStoredEmpresaName() {
    return localStorage.getItem('nomeEmpresaSelecionada');
}

function updateNomeEmpresa(nomeEmpresa) {
    var empresaSelecionadaElement = document.querySelector('.empresaSelecionada');
    if (empresaSelecionadaElement && nomeEmpresa) {
        empresaSelecionadaElement.textContent = nomeEmpresa;
    }
}

function showCalendarModal() {
    fetch('templateMenu/calendar.html') // Caminho para o seu calendar.html
        .then(response => response.text())
        .then(html => {
            document.getElementById('calendarModalContent').innerHTML = html;
            document.getElementById('calendarModal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error loading the calendar:', error);
        });
}

function closeCalendarModal() {
    document.getElementById('calendarModal').style.display = 'none';
}

// Evento para fechar o modal se clicado fora dele
window.onclick = function(event) {
    var modal = document.getElementById('calendarModal');
    if (event.target == modal) {
        closeCalendarModal();
    }
}


document.addEventListener('DOMContentLoaded', function() {
    handleEmpresa()
    loadAndDisplayUsername();


});
