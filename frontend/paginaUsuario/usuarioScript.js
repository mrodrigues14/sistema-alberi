document.addEventListener('DOMContentLoaded', function() {
    fetch('/templateMenu/template.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('menu-container').innerHTML = data;
            const link = document.createElement('link');
            link.href = '/templateMenu/styletemplate.css';
            link.rel = 'stylesheet';
            link.type = 'text/css';
            document.head.appendChild(link);

            const script = document.createElement('script');
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

    fetch('/usuario/empresas')
        .then(response => response.json())
        .then(data => {
            const empresasList = document.getElementById('empresas-list');
            data.forEach(empresa => {
                const label = document.createElement('label');
                label.innerHTML = `<input type="checkbox" name="empresa" value="${empresa.IDCLIENTE}"> ${empresa.NOME}`;
                empresasList.appendChild(label);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar empresas:', error);
        });
});