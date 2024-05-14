document.addEventListener('DOMContentLoaded', function() {
    // Carregar o template do menu
    fetch('/templateMenu/template.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('menu-container').innerHTML = data;

            var link = document.createElement('link');
            link.href = '/templateMenu/styletemplate.css';
            link.rel = 'stylesheet';
            link.type = 'text/css';
            document.head.appendChild(link);

            var script = document.createElement('script');
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


});

const reportForm = document.getElementById('reportForm');
if (reportForm) {
    reportForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(this);

        // Adicionar o ID do usuário ao FormData antes de enviar
        const userId = localStorage.getItem('idusuario');
        formData.append('ID_USUARIO', userId);

        fetch('/report/adicionar', {
            method: 'POST',
            body: formData
        }).then(response => {
            if (response.ok) {
                console.log('Report enviado com sucesso!');
                response.text().then(text => console.log(text));

                // Exibir o popup de sucesso
                showSuccessPopup();

                // Atualizar a lista de relatórios após enviar
                loadUserReports(userId);
            } else {
                response.text().then(text => console.error('Erro ao enviar report:', text));
            }
        }).catch(error => {
            console.error('Erro ao enviar report:', error);
        });
    });
}

// Função para carregar os relatórios do usuário
function loadUserReports(userId) {
    fetch(`/report/listar?ID_USUARIO=${userId}`)
        .then(response => response.json())
        .then(reports => {
            const reportList = document.getElementById('reportList');
            reportList.innerHTML = ''; // Limpa a lista antes de adicionar novos itens
            reports.forEach(report => {
                const listItem = document.createElement('li');
                listItem.textContent = `Título: ${report.TITULO}, Descrição: ${report.DESCRICAO}, Data: ${new Date(report.DATA).toLocaleString()}`;
                reportList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar reports:', error);
        });
}

// Função para exibir o popup de sucesso
function showSuccessPopup() {
    const successPopup = document.getElementById('successPopup');
    const popupContent = successPopup.querySelector('.popup-content');

    // Criar o elemento dotlottie-player
    const lottiePlayer = document.createElement('dotlottie-player');
    lottiePlayer.setAttribute('src', 'https://lottie.host/f970532a-cffa-46c6-bb0c-a868908cb65c/UR2kFoKi9D.json');
    lottiePlayer.setAttribute('background', 'transparent');
    lottiePlayer.setAttribute('speed', '2');
    lottiePlayer.style.width = '300px';
    lottiePlayer.style.height = '300px';
    lottiePlayer.setAttribute('direction', '1');
    lottiePlayer.setAttribute('playMode', 'normal');
    lottiePlayer.setAttribute('autoplay', 'true');

    // Inserir o dotlottie-player no início do conteúdo do popup
    popupContent.insertBefore(lottiePlayer, popupContent.firstChild);

    successPopup.classList.add('show', 'fade-in'); // Adiciona classes para exibir e animar o popup
}


// Função para fechar o popup de sucesso
function closePopup() {
    const successPopup = document.getElementById('successPopup');
    successPopup.classList.remove('show'); // Remove a classe para esconder o popup
    window.location.reload();

}

const userId = localStorage.getItem('idusuario');
if (userId) {
    loadUserReports(userId);
}