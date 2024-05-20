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

        const userId = localStorage.getItem('idusuario');
        formData.append('ID_USUARIO', userId);

        fetch('/report/adicionar', {
            method: 'POST',
            body: formData
        }).then(response => {
            if (response.ok) {
                console.log('Report enviado com sucesso!');
                response.text().then(text => console.log(text));
                showSuccessPopup();
                loadUserReports(userId, 1, 10);
            } else {
                response.text().then(text => console.error('Erro ao enviar report:', text));
            }
        }).catch(error => {
            console.error('Erro ao enviar report:', error);
        });
    });
}

let currentPage = 1;
let currentFilter = null;

function loadUserReports(userId, page = 1, limit = 10, situacao = null) {
    currentPage = page;
    currentFilter = situacao;

    fetch(`/report/listar?ID_USUARIO=${userId}&page=${page}&limit=${limit}&situacao=${situacao}`)
        .then(response => response.json())
        .then(reports => {
            const reportList = document.getElementById('reportList');
            reportList.innerHTML = ''; // Limpa a lista antes de adicionar novos itens
            if (reports.length > 0) {
                reports.forEach(report => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <strong>Título:</strong> ${report.TITULO}<br>
                        <strong>Tipo:</strong> ${report.PRIORIDADE}<br>
                        <strong>Descrição:</strong> ${report.DESCRICAO}<br>
                        <strong>Data:</strong> ${new Date(report.DATA).toLocaleString()}<br>
                        <strong>Situação:</strong> ${report.SITUACAO}
                    `;
                    reportList.appendChild(listItem);
                });
            } else {
                reportList.innerHTML = '<li>Nenhum relatório encontrado</li>';
            }
            document.getElementById('pageNumber').textContent = page;
        })
        .catch(error => {
            console.error('Erro ao carregar reports:', error);
        });
}

function changePage(direction) {
    const userId = localStorage.getItem('idusuario');
    if (direction === 'next') {
        currentPage += 1;
    } else if (direction === 'prev' && currentPage > 1) {
        currentPage -= 1;
    }

    loadUserReports(userId, currentPage, 10, currentFilter);
}

function showSuccessPopup() {
    const successPopup = document.getElementById('successPopup');
    const popupContent = successPopup.querySelector('.popup-content');

    const lottiePlayer = document.createElement('dotlottie-player');
    lottiePlayer.setAttribute('src', 'https://lottie.host/f970532a-cffa-46c6-bb0c-a868908cb65c/UR2kFoKi9D.json');
    lottiePlayer.setAttribute('background', 'transparent');
    lottiePlayer.setAttribute('speed', '2');
    lottiePlayer.style.width = '300px';
    lottiePlayer.style.height = '300px';
    lottiePlayer.setAttribute('direction', '1');
    lottiePlayer.setAttribute('playMode', 'normal');
    lottiePlayer.setAttribute('autoplay', 'true');

    popupContent.insertBefore(lottiePlayer, popupContent.firstChild);

    successPopup.classList.add('show', 'fade-in');
}

// Função para fechar o popup de sucesso
function closePopup() {
    const successPopup = document.getElementById('successPopup');
    successPopup.classList.remove('show'); // Remove a classe para esconder o popup
    window.location.reload();
}

const userId = localStorage.getItem('idusuario');
if (userId) {
    loadUserReports(userId, 1, 10);
}
