const idExtrato = window.location.search.split('=')[1];

document.addEventListener('DOMContentLoaded', function() {
    fetch(`/consulta/editar/extrato?id=${idExtrato}`)
        .then(response => response.json())
        .then(dados => {
            const table = document.getElementById('consulta');
            const tbody = table.querySelector('tbody');
            tbody.innerHTML = '';

            dados.forEach(data => {
                const row = tbody.insertRow();
                row.insertCell().textContent = formatDate(data.DATA);
                row.insertCell().textContent = data.CATEGORIA;
                row.insertCell().textContent = data.DESCRICAO;
                row.insertCell().textContent = data.NOME_NO_EXTRATO;
                row.insertCell().textContent = data.NOME_FORNECEDOR;
                row.insertCell().textContent = data.NOME_BANCO;
                row.insertCell().textContent = data.TIPO_DE_TRANSACAO;
                row.insertCell().textContent = data.VALOR;
            });

            const editRow = tbody.insertRow();
            editRow.insertCell().innerHTML = `<input type="date" value="${formatDate(dados[0].DATA)}" name="data">`;
            editRow.insertCell().innerHTML = `<input type="text" value="${dados[0].CATEGORIA}" name="categoria">`;
            editRow.insertCell().innerHTML = `<input type="text" value="${dados[0].DESCRICAO}" name="descricao">`;
            editRow.insertCell().innerHTML = `<input type="text" value="${dados[0].NOME_NO_EXTRATO}" name="nome_no_extrato">`;
            editRow.insertCell().innerHTML = ``;
            editRow.insertCell().innerHTML = ``;
            editRow.insertCell().innerHTML = `<select name="tipo">
                                                    <option value="entrada">Entrada</option>
                                                    <option value="saida">Saída</option>
                                              </select>`;
            editRow.insertCell().innerHTML = `<input type="text" value="${dados[0].VALOR}" name="valor">`;

            const update = document.getElementById('update');
            update.innerHTML = `<button onclick="editarExtrato()">Editar</button>`;

        })
        .catch(error => {
            console.error('Erro ao buscar os dados do extrato:', error);
        });
});

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

function fecharIframe() {
    const iframeContainer = parent.document.getElementById('iframe-container');
    parent.location.reload();
    iframeContainer.style.display = 'none';
    iframeContainer.innerHTML = '';
}

function editarExtrato(){
    const data = document.querySelector('input[name="data"]').value;
    const categoria = document.querySelector('input[name="categoria"]').value;
    const descricao = document.querySelector('input[name="descricao"]').value;
    const nome_no_extrato = document.querySelector('input[name="nome_no_extrato"]').value;
    const tipo = document.querySelector('select[name="tipo"]').value;
    const valor = document.querySelector('input[name="valor"]').value;

    const body = {
        id: idExtrato,
        data: data,
        categoria: categoria,
        descricao: descricao,
        nome_no_extrato: nome_no_extrato,
        tipo: tipo,
        valor: valor
    };

    fetch('/consulta/editar/extrato', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Sucesso:', data);
        fecharIframe();
    })
    .catch((error) => {
        console.error('Erro:', error);
    });
}