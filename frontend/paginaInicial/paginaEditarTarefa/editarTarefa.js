
let idtarefa = window.location.search.split('=')[1];
document.getElementById('todo-id').value = idtarefa;

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const dias = Math.floor((date - today) / (1000 * 60 * 60 * 24));

    return `${day}/${month}/${year}`;

}

document.addEventListener('DOMContentLoaded', function() {
    fetch(`/paginaInicial/editartarefa/gettarefa?idtarefa=${idtarefa}`)
        .then(response => response.json())
        .then(data => {
            const table = document.getElementById('todo-table');
            const tbody = table.querySelector('tbody');
            tbody.innerHTML = '';
            data.forEach(tarefa => {
                const row = tbody.insertRow();
                row.insertCell().innerText = tarefa.TITULO;
                row.insertCell().innerText = formatDate(tarefa.DATA_LIMITE);
            })
        })
});

function fecharIframe() {
    // Primeiro recarrega a página pai
    parent.location.reload();

    // Então, define um curto atraso para esconder e limpar o iframe
    // isso dá tempo para a página recarregar antes de mudar o estado do iframe
    setTimeout(() => {
        const iframeContainer = parent.document.getElementById('iframe-container');
        if (iframeContainer) {
            iframeContainer.style.display = 'none';
            iframeContainer.innerHTML = '';
        }
    }, 100); // Atraso de 100ms. Ajuste conforme necessário.
}

