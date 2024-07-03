document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadTemplateAndStyles();
    } catch (error) {
        console.error('Erro ao carregar o template:', error);
    }
});

async function loadTemplateAndStyles() {
    const cachedCSS = localStorage.getItem('templateCSS');
    const cachedHTML = localStorage.getItem('templateHTML');

    if (cachedCSS && cachedHTML) {
        applyCSS(cachedCSS);
        applyHTML(cachedHTML);
    } else {
        const [cssData, htmlData] = await Promise.all([
            fetchText('/templateMenu/styletemplate.css'),
            fetchText('/templateMenu/template.html')
        ]);

        localStorage.setItem('templateCSS', cssData);
        localStorage.setItem('templateHTML', htmlData);

        applyCSS(cssData);
        applyHTML(htmlData);
    }

    const script = document.createElement('script');
    script.src = '/templateMenu/templateScript.js';
    script.onload = function() {
        loadAndDisplayUsername();
        handleEmpresa();
        loadNomeEmpresa();
    };
    document.body.appendChild(script);
}

function fetchText(url) {
    return fetch(url).then(response => response.text());
}

function applyCSS(cssData) {
    const style = document.createElement('style');
    style.textContent = cssData;
    document.head.appendChild(style);
}

function applyHTML(htmlData) {
    document.getElementById('menu-container').innerHTML = htmlData;
}

const reportForm = document.getElementById('reportForm');
const filesInput = document.getElementById('files');
const previewContainer = document.getElementById('preview');
const submitBtn = document.getElementById('submitBtn');

filesInput.addEventListener('change', function() {
    previewContainer.innerHTML = '';
    const files = Array.from(this.files);

    files.forEach((file, index) => {
        const fileReader = new FileReader();

        fileReader.onload = function(e) {
            const previewElement = document.createElement('div');
            previewElement.classList.add('preview-item');

            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-preview');
            removeButton.innerHTML = '&times;';
            removeButton.addEventListener('click', () => {
                files.splice(index, 1);
                previewContainer.removeChild(previewElement);
                updateFilesInput(files);
            });

            previewElement.appendChild(removeButton);

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.classList.add('preview-image');
                previewElement.appendChild(img);
            } else if (file.type === 'application/pdf') {
                const pdfPreview = document.createElement('object');
                pdfPreview.data = e.target.result;
                pdfPreview.type = 'application/pdf';
                pdfPreview.classList.add('preview-object');
                previewElement.appendChild(pdfPreview);
            } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const wordIcon = document.createElement('img');
                wordIcon.classList.add('preview-image');
                previewElement.appendChild(wordIcon);
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = e.target.result;
                video.controls = true;
                video.classList.add('preview-video');
                previewElement.appendChild(video);
            } else {
                const fileIcon = document.createElement('img');
                fileIcon.classList.add('preview-image');
                previewElement.appendChild(fileIcon);
            }

            previewContainer.appendChild(previewElement);
        };

        fileReader.readAsDataURL(file);
    });
});

function updateFilesInput(files) {
    const dataTransfer = new DataTransfer();
    files.forEach(file => {
        dataTransfer.items.add(file);
    });
    filesInput.files = dataTransfer.files;
}

if (reportForm) {
    reportForm.addEventListener('submit', function(event) {
        event.preventDefault();
        submitBtn.disabled = true;
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
            submitBtn.disabled = false;
        }).catch(error => {
            console.error('Erro ao enviar report:', error);
            submitBtn.disabled = false;
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
            reportList.innerHTML = '';

            if (reports.length > 0) {
                reports.forEach(report => {
                    const listItem = document.createElement('li');
                    const formattedDescription = report.DESCRICAO.replace(/\n/g, '<br>');
                    listItem.innerHTML = `
                        <strong>Autor: </strong> ${report.NOME_DO_USUARIO}<br>
                        <strong>Nº: ${report.ID} Título:</strong> ${report.TITULO}<br>
                        <strong>Tipo:</strong> ${report.PRIORIDADE}<br>
                        <strong>Funcionalidade Afetada:</strong> ${report.FUNCIONALIDADE_AFETADA}<br>
                        <strong>Descrição:</strong> ${formattedDescription}<br>
                        <strong>Data:</strong> ${new Date(report.DATA).toLocaleString()}<br>
                        <strong>Situação:</strong> ${report.SITUACAO}<br>
                        ${report.DESCRICAO_RECUSA ? `<strong>Motivo da Recusa:</strong> ${report.DESCRICAO_RECUSA}<br>` : ''}
                        <div class="button-group">
                            ${situacao !== 'Concluido' ? `<button class="edit-btn button-group-editar" onclick="openEditPopup(${report.ID})">Editar Chamado</button>` : ''}
                            ${situacao === 'Em validacao' ? `<button class="complete-btn" onclick="markAsCompleted(${report.ID})">Concluir Chamado</button>` : ''}
                            ${situacao === 'Em validacao' ? `<button class="reject-btn" onclick="openRejectPopup(${report.ID})">Recusar Chamado</button>` : ''}
                        </div>
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

function markAsCompleted(reportId) {
    fetch(`/report/concluir/${reportId}`, {
        method: 'PUT'
    })
        .then(response => {
            if (response.ok) {
                console.log('Status atualizado com sucesso!');
                const userId = localStorage.getItem('idusuario');
                loadUserReports(userId, currentPage, 10, currentFilter); // Reload the reports
            } else {
                console.error('Erro ao atualizar o status');
            }
        })
        .catch(error => {
            console.error('Erro ao atualizar o status:', error);
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
    showLoadingBar();
}

function closePopup() {
    const successPopup = document.getElementById('successPopup');
    successPopup.classList.remove('show');
    window.location.reload();
}

const userId = localStorage.getItem('idusuario');
if (userId) {
    loadUserReports(userId, 1, 10);
}

function openRejectPopup(reportId) {
    const rejectPopup = document.getElementById('rejectPopup');
    rejectPopup.dataset.reportId = reportId;
    rejectPopup.classList.add('show', 'fade-in');
}

function closeRejectPopup() {
    const rejectPopup = document.getElementById('rejectPopup');
    rejectPopup.classList.remove('show');
}

function submitRejection() {
    const rejectPopup = document.getElementById('rejectPopup');
    const reportId = rejectPopup.dataset.reportId;
    const motivo = document.getElementById('rejectReason').value;
    const rejectFiles = document.getElementById('rejectFiles').files;

    if (!motivo.trim()) {
        alert('Por favor, descreva o motivo da recusa.');
        return;
    }

    fetch(`/report/recusar/${reportId}`, {
        method: 'POST',
        body: JSON.stringify({ motivo: motivo }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.ok) {
                console.log('Chamado recusado com sucesso!');
                const userId = localStorage.getItem('idusuario');
                loadUserReports(userId, currentPage, 10, currentFilter); // Reload the reports
                closeRejectPopup();
            } else {
                response.text().then(text => console.error('Erro ao recusar chamado:', text));
            }
        })
        .catch(error => {
            console.error('Erro ao recusar chamado:', error);
        });
}
function openEditPopup(reportId) {
    const editPopup = document.getElementById('editPopup');
    editPopup.dataset.reportId = reportId;
    fetch(`/report/getReport/${reportId}`)
        .then(response => response.json())
        .then(report => {
            document.getElementById('editTitle').value = report.TITULO;
            document.getElementById('editPriority').value = report.PRIORIDADE;
            document.getElementById('editFunctionality').value = report.FUNCIONALIDADE_AFETADA;
            document.getElementById('editDescription').value = report.DESCRICAO.replace(/\n/g, '\n');
            document.getElementById('editComment').value = '';

            const editPreview = document.getElementById('editPreview');
            editPreview.innerHTML = '';

            editPopup.classList.add('show', 'fade-in');
        })
        .catch(error => {
            console.error('Erro ao carregar detalhes do chamado para edição:', error);
        });
}

function closeEditPopup() {
    const editPopup = document.getElementById('editPopup');
    editPopup.classList.remove('show');
}

function submitEdit() {
    const editPopup = document.getElementById('editPopup');
    const reportId = editPopup.dataset.reportId;
    const editForm = document.getElementById('editForm');
    const formData = new FormData(editForm);

    fetch(`/report/editar/${reportId}`, {
        method: 'PUT',
        body: formData
    })
        .then(response => {
            if (response.ok) {
                console.log('Chamado atualizado com sucesso!');
                const userId = localStorage.getItem('idusuario');
                loadUserReports(userId, currentPage, 10, currentFilter);
                closeEditPopup();
            } else {
                response.text().then(text => console.error('Erro ao atualizar chamado:', text));
            }
        })
        .catch(error => {
            console.error('Erro ao atualizar chamado:', error);
        });
}

function deleteReport() {
    const editPopup = document.getElementById('editPopup');
    const reportId = editPopup.dataset.reportId;

    if (confirm('Tem certeza que deseja deletar este chamado?')) {
        fetch(`/report/deletar/${reportId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (response.ok) {
                    console.log('Chamado deletado com sucesso!');
                    const userId = localStorage.getItem('idusuario');
                    loadUserReports(userId, currentPage, 10, currentFilter);
                    closeEditPopup();
                } else {
                    response.text().then(text => console.error('Erro ao deletar chamado:', text));
                }
            })
            .catch(error => {
                console.error('Erro ao deletar chamado:', error);
            });
    }
}

function addComment() {
    const commentTextarea = document.getElementById('editComment');
    const descriptionTextarea = document.getElementById('editDescription');
    const comment = commentTextarea.value.trim();
    const username = localStorage.getItem('username');

    if (comment) {
        const currentDateTime = new Date().toLocaleString();
        const formattedComment = `**Comentário de ${username} - ${currentDateTime}:** ***${comment}***\n`;
        descriptionTextarea.value += '\n' + formattedComment;
        commentTextarea.value = '';

        submitEdit();
    } else {
        alert('Por favor, insira um comentário.');
    }
}

function showLoadingBar() {
    setTimeout(() => {
        closePopup();
    }, 3000);
}
