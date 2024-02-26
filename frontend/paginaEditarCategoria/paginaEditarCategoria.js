window.onload = function() {
    fetch('/categoria/dados')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('seletorCategoria');
            data.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.IDCATEGORIA;
                option.textContent = categoria.NOME;
                select.appendChild(option);
            });
        })
}