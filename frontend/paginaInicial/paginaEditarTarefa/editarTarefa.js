window.onload = function() {
    fetch(`paginainicial/tarefas?idcliente=1`)
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('seletorTarefas');
            data.forEach(tarefa => {
                const option = document.createElement('option');
                option.value = tarefa.IDTAREFA;
                option.textContent = tarefa.TITULO;
                select.appendChild(option);
            })
        })
}

function fecharIframe() {
    const iframeContainer = document.getElementById('iframe-container');
    iframeContainer.style.display = 'none';
    iframeContainer.innerHTML = '';
}