document.addEventListener('DOMContentLoaded', function() {
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
            };
            document.body.appendChild(script);
        })
        .catch(error => {
            console.error('Erro ao carregar o template:', error);
        });
    // Aqui você configuraria seus endpoints para buscar os dados
    // Por agora, vamos simular dados para o exemplo
    const data = [
        { receita: 220306.46, custoOperacional: 20484.98, custosNaoOperacionais: 18959.44 },
        // Adicione todos os outros meses
    ];

    // Calcula lucros e custos totais e médias
    calculateAndDisplay(data);
});


function calculateAndDisplay(data) {
    let totalRevenue = 0, totalOperationalCost = 0, totalNonOperationalCost = 0;

    // Insira os dados na tabela
    data.forEach((item, index) => {
        const row = document.createElement('tr');

        const revenue = item.receita;
        const operationalCost = item.custoOperacional;
        const operationalProfit = revenue - operationalCost;
        const nonOperationalCost = item.custosNaoOperacionais;
        const totalCost = operationalCost + nonOperationalCost;
        const totalProfit = revenue - totalCost;

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${revenue.toFixed(2)}</td>
            <td>${operationalCost.toFixed(2)}</td>
            <td>${operationalProfit.toFixed(2)}</td>
            <td>${nonOperationalCost.toFixed(2)}</td>
            <td>${totalCost.toFixed(2)}</td>
            <td>${totalProfit.toFixed(2)}</td>
        `;

        document.querySelector('#financeTable tbody').appendChild(row);

        // Acumula valores para totais e médias
        totalRevenue += revenue;
        totalOperationalCost += operationalCost;
        totalNonOperationalCost += nonOperationalCost;
    });

    const totalOperationalProfit = totalRevenue - totalOperationalCost;
    const totalCost = totalOperationalCost + totalNonOperationalCost;
    const totalProfit = totalRevenue - totalCost;

    // Calcula médias
    const averageRevenue = totalRevenue / data.length;
    const averageOperationalCost = totalOperationalCost / data.length;
    const averageOperationalProfit = totalOperationalProfit / data.length;
    const averageNonOperationalCost = totalNonOperationalCost / data.length;
    const averageCost = totalCost / data.length;
    const averageProfit = totalProfit / data.length;

    // Exibe totais e médias no rodapé da tabela
    document.getElementById('totalRevenue').textContent = totalRevenue.toFixed(2);
    document.getElementById('totalOperationalCost').textContent = totalOperationalCost.toFixed(2);
    document.getElementById('totalOperationalProfit').textContent = totalOperationalProfit.toFixed(2);
    document.getElementById('totalNonOperationalCost').textContent = totalNonOperationalCost.toFixed(2);
    document.getElementById('totalCost').textContent = totalCost.toFixed(2);
    document.getElementById('totalProfit').textContent = totalProfit.toFixed(2);

    document.getElementById('averageRevenue').textContent = averageRevenue.toFixed(2);
    document.getElementById('averageOperationalCost').textContent = averageOperationalCost.toFixed(2);
    document.getElementById('averageOperationalProfit').textContent = averageOperationalProfit.toFixed(2);
    document.getElementById('averageNonOperationalCost').textContent = averageNonOperationalCost.toFixed(2);
    document.getElementById('averageCost').textContent = averageCost.toFixed(2);
    document.getElementById('averageProfit').textContent = averageProfit.toFixed(2);
}
