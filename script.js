// =============================================
// Gerenciamento do Histórico
// =============================================
class CalculationHistory {
    constructor() {
        this.history = JSON.parse(localStorage.getItem('agrovale_calc_history')) || [];
    }

    addRecord(data) {
        const record = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            type: data.type,
            total: data.total,
            numLotes: data.numLotes,
            cristal: data.cristal || null,
            demerara: data.demerara || null,
            details: data.details
        };
        
        this.history.unshift(record);
        this.save();
        this.render();
    }

    save() {
        localStorage.setItem('agrovale_calc_history', JSON.stringify(this.history));
    }

    clear() {
        if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
            this.history = [];
            this.save();
            this.render();
        }
    }

    exportToCSV() {
        if (this.history.length === 0) {
            alert('Nenhum dado para exportar!');
            return;
        }

        const headers = ['Data', 'Tipo', 'Total', 'Lotes', 'Cristal', 'Demerara', 'Detalhes'];
        const rows = this.history.map(item => [
            new Date(item.timestamp).toLocaleString(),
            this.getTypeLabel(item.type),
            item.total,
            item.numLotes,
            item.cristal || 'N/A',
            item.demerara || 'N/A',
            JSON.stringify(item.details)
        ]);

        let csv = headers.join(';') + '\n';
        csv += rows.map(row => row.join(';')).join('\n');

        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historico_agrovale_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    render() {
        const container = document.getElementById('history-list');
        if (!container) return;

        container.innerHTML = this.history.length === 0 ? 
            '<p class="no-history">Nenhum cálculo registrado ainda.</p>' :
            this.history.map(item => `
                <div class="history-item" data-id="${item.id}">
                    <h3>${this.getTypeLabel(item.type)} • ${new Date(item.timestamp).toLocaleString()}</h3>
                    <div class="history-details">
                        <div class="history-detail"><strong>Total:</strong> ${item.total}</div>
                        <div class="history-detail"><strong>Lotes:</strong> ${item.numLotes}</div>
                        ${item.cristal !== null ? `<div class="history-detail"><strong>Cristal:</strong> ${item.cristal}</div>` : ''}
                        ${item.demerara !== null ? `<div class="history-detail"><strong>Demerara:</strong> ${item.demerara}</div>` : ''}
                    </div>
                    ${item.type === 'fardo-misto' ? `<div class="chart-container"><canvas id="chart-history-${item.id}" height="200"></canvas></div>` : ''}
                </div>
            `).join('');

        // Renderizar gráficos no histórico
        this.history.forEach(item => {
            if (item.type === 'fardo-misto' && item.details) {
                setTimeout(() => {
                    this.renderHistoryChart(item.id, item.details);
                }, 100);
            }
        });
    }

    renderHistoryChart(id, data) {
        const ctx = document.getElementById(`chart-history-${id}`)?.getContext('2d');
        if (!ctx) return;

        const cristalData = data.map(item => {
            const match = item[1].match(/(\d+)\*(\d+)\+?(\d+)?/);
            return match ? parseInt(match[1]) * parseInt(match[2]) + (match[3] ? parseInt(match[3]) : 0) : 0;
        });

        const demeraraData = data.map(item => {
            const match = item[2].match(/(\d+)\*(\d+)\+?(\d+)?/);
            return match ? parseInt(match[1]) * parseInt(match[2]) + (match[3] ? parseInt(match[3]) : 0) : 0;
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item[0]),
                datasets: [
                    {
                        label: 'Cristal',
                        data: cristalData,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Demerara',
                        data: demeraraData,
                        backgroundColor: 'rgba(255, 159, 64, 0.7)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    getTypeLabel(type) {
        const types = {
            'fardo-misto': 'Fardo Misto (Cristal + Demerara)',
            'fardo-simples': 'Fardo Simples',
            'sacaria': 'Sacaria'
        };
        return types[type] || type;
    }
}

// =============================================
// Funções de Cálculo
// =============================================
function formatarPacotes(total, divisor) {
    if (total === 0) return "0";
    const pacotes = Math.floor(total / divisor);
    const resto = total % divisor;
    return resto > 0 ? `${divisor}*${pacotes}+${resto}` : `${divisor}*${pacotes}`;
}

function distribuirLote(nome, tamanho, cristalDisponivel, demeraraDisponivel, isMeioLote) {
    const divisor = isMeioLote ? 6 : 12;
    let cristalLote = 0;
    let demeraraLote = 0;
    
    if (cristalDisponivel > 0) {
        cristalLote = Math.min(cristalDisponivel, tamanho);
        demeraraLote = tamanho - cristalLote;
    } else {
        demeraraLote = tamanho;
    }
    
    const formatoCristal = cristalLote > 0 ? formatarPacotes(cristalLote, divisor) : "0";
    const formatoDemerara = demeraraLote > 0 ? formatarPacotes(demeraraLote, divisor) : "0";
    
    return [nome, formatoCristal, formatoDemerara, tamanho];
}

function generateTable(headers, rows) {
    let html = '<table><thead><tr>';
    headers.forEach(header => html += `<th>${header}</th>`);
    html += '</tr></thead><tbody>';
    
    rows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => html += `<td>${cell}</td>`);
        html += '</tr>';
    });
    
    return html + '</tbody></table>';
}

// =============================================
// Cálculos Específicos
// =============================================
function calcularFardoMisto() {
    // Obter valores dos inputs
    const total = parseInt(document.getElementById("total-fardo-misto").value) || 0;
    const numLotes = parseFloat(document.getElementById("lotes-fardo-misto").value) || 0;
    const cristal = parseInt(document.getElementById("cristal").value) || 0;
    const demerara = parseInt(document.getElementById("demerara").value) || 0;
    
    const validationMessage = document.getElementById("validation-message");
    validationMessage.innerHTML = "";
    validationMessage.className = "message";

    // Validações básicas
    if (total <= 0 || numLotes <= 0) {
        validationMessage.innerHTML = "Total e número de lotes devem ser maiores que zero!";
        validationMessage.className = "message error";
        return;
    }

    if (cristal + demerara !== total) {
        validationMessage.innerHTML = "ERRO! A soma de Cristal + Demerara não corresponde ao total!";
        validationMessage.className = "message error";
        return;
    }

    const lotesInteiros = Math.floor(numLotes);
    const temMeioLote = numLotes % 1 !== 0;
    
    // Calcular tamanho do lote
    let tamanhoLote, resto;
    if (temMeioLote) {
        tamanhoLote = Math.floor(total / (lotesInteiros + 0.5));
        resto = total - (tamanhoLote * lotesInteiros);
    } else {
        tamanhoLote = Math.floor(total / lotesInteiros);
        resto = total % lotesInteiros;
    }

    const dados = [];
    let cristalRestante = cristal;
    let demeraraRestante = demerara;
    let totalCalculado = 0;

    // Função auxiliar para distribuir em um lote
    function distribuirNoLote(loteNome, loteTotal, isMeioLote) {
        const divisor = isMeioLote ? 6 : 12;
        let cristalNoLote = 0;
        let demeraraNoLote = 0;
        
        if (cristalRestante > 0) {
            cristalNoLote = Math.min(cristalRestante, loteTotal);
            demeraraNoLote = loteTotal - cristalNoLote;
        } else {
            demeraraNoLote = loteTotal;
        }
        
        cristalRestante -= cristalNoLote;
        demeraraRestante -= demeraraNoLote;
        totalCalculado += loteTotal;
        
        return [
            loteNome,
            cristalNoLote > 0 ? formatarPacotes(cristalNoLote, divisor) : "0",
            demeraraNoLote > 0 ? formatarPacotes(demeraraNoLote, divisor) : "0",
            loteTotal
        ];
    }

    // Distribuição para lotes inteiros
    for (let i = 0; i < lotesInteiros; i++) {
        dados.push(distribuirNoLote(`Lote ${i+1}`, tamanhoLote, false));
    }

    // Distribuição para meio lote (se existir)
    if (temMeioLote && resto > 0) {
        dados.push(distribuirNoLote("Meio Lote", resto, true));
    }

    // Verificação final
    const valid = totalCalculado === total && cristalRestante === 0 && demeraraRestante === 0;
    document.getElementById("result-fardo-misto").innerHTML = generateTable(
        ["Lote", "Cristal", "Demerara", "Total"], 
        dados
    );

    if (valid) {
        validationMessage.innerHTML = "✓ Distribuição correta! Total: " + totalCalculado;
        validationMessage.className = "message success";
    } else {
        validationMessage.innerHTML = `ERRO! Faltou distribuir: Cristal: ${cristalRestante}/${cristal} | Demerara: ${demeraraRestante}/${demerara}`;
        validationMessage.className = "message error";
    }

    // Salvar no histórico e renderizar gráfico
    history.addRecord({
        type: 'fardo-misto',
        total: total,
        numLotes: numLotes,
        cristal: cristal,
        demerara: demerara,
        details: dados
    });

    renderChart('chart-fardo-misto', dados, true);
}
function calcularFardoSimples() {
    const total = parseInt(document.getElementById("total-fardo-simples").value) || 0;
    const numLotes = parseFloat(document.getElementById("lotes-fardo-simples").value) || 0;
    
    if (total <= 0 || numLotes <= 0) {
        alert("Total e número de lotes devem ser maiores que zero!");
        return;
    }

    const lotesInteiros = Math.floor(numLotes);
    const temMeioLote = numLotes % 1 !== 0;
    const dados = [];

    if (temMeioLote) {
        const base = Math.floor(total / (lotesInteiros + 0.5));
        const resto = total - (base * lotesInteiros);
        
        for (let i = 0; i < lotesInteiros; i++) {
            dados.push([`Lote ${i+1}`, formatarPacotes(base, 12), base]);
        }
        
        if (resto > 0) {
            dados.push(["Meio Lote (Último)", formatarPacotes(resto, 6), resto]);
        }
    } else {
        const base = Math.floor(total / lotesInteiros);
        const resto = total % lotesInteiros;
        
        dados.push(["Lote 1", formatarPacotes(base + resto, 12), base + resto]);
        
        for (let i = 1; i < lotesInteiros; i++) {
            dados.push([`Lote ${i+1}`, formatarPacotes(base, 12), base]);
        }
    }

    document.getElementById("result-fardo-simples").innerHTML = generateTable(
        ["Lote", "Lastro x Altura", "Total"], 
        dados
    );

    // Salvar no histórico e renderizar gráfico
    history.addRecord({
        type: 'fardo-simples',
        total: total,
        numLotes: numLotes,
        details: dados
    });

    renderChart('chart-fardo-simples', dados, false);
}

function calcularSacaria() {
    const total = parseInt(document.getElementById("total-sacos").value) || 0;
    const numLotes = parseFloat(document.getElementById("lotes-sacos").value) || 0;
    
    if (total <= 0 || numLotes <= 0) {
        alert("Total e número de lotes devem ser maiores que zero!");
        return;
    }

    const lotesInteiros = Math.floor(numLotes);
    const temMeioLote = numLotes % 1 !== 0;
    const dados = [];

    if (temMeioLote) {
        const base = Math.floor(total / (lotesInteiros + 0.5));
        const resto = total - (base * lotesInteiros);
        
        for (let i = 0; i < lotesInteiros; i++) {
            dados.push([`Lote ${i+1}`, formatarPacotes(base, 5), base]);
        }
        
        if (resto > 0) {
            dados.push(["Meio Lote (Último)", formatarPacotes(resto, 5), resto]);
        }
    } else {
        const base = Math.floor(total / lotesInteiros);
        const resto = total % lotesInteiros;
        
        dados.push(["Lote 1", formatarPacotes(base + resto, 5), base + resto]);
        
        for (let i = 1; i < lotesInteiros; i++) {
            dados.push([`Lote ${i+1}`, formatarPacotes(base, 5), base]);
        }
    }

    document.getElementById("result-sacaria").innerHTML = generateTable(
        ["Lote", "Lastro x Altura", "Total"], 
        dados
    );

    // Salvar no histórico e renderizar gráfico
    history.addRecord({
        type: 'sacaria',
        total: total,
        numLotes: numLotes,
        details: dados
    });

    renderChart('chart-sacaria', dados, false);
}

// =============================================
// Renderização de Gráficos
// =============================================
function renderChart(canvasId, data, isMixed) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    // Destruir gráfico anterior se existir
    if (ctx.chart) {
        ctx.chart.destroy();
    }

    const labels = data.map(item => item[0]);
    const values = data.map(item => item[item.length - 1]); // Pega a coluna Total

    if (isMixed) {
        const cristalData = data.map(item => {
            const match = item[1].match(/(\d+)\*(\d+)\+?(\d+)?/);
            return match ? parseInt(match[1]) * parseInt(match[2]) + (match[3] ? parseInt(match[3]) : 0) : 0;
        });

        const demeraraData = data.map(item => {
            const match = item[2].match(/(\d+)\*(\d+)\+?(\d+)?/);
            return match ? parseInt(match[1]) * parseInt(match[2]) + (match[3] ? parseInt(match[3]) : 0) : 0;
        });

        ctx.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Cristal',
                        data: cristalData,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Demerara',
                        data: demeraraData,
                        backgroundColor: 'rgba(255, 159, 64, 0.7)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: getChartOptions('Distribuição por Lote (Cristal vs. Demerara)')
        });
    } else {
        ctx.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: canvasId.includes('sacaria') ? 'Sacos' : 'Fardos',
                    data: values,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: getChartOptions(`Distribuição de ${canvasId.includes('sacaria') ? 'Sacaria' : 'Fardos'} por Lote`)
        });
    }
}

function getChartOptions(title) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Quantidade'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Lotes'
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: title,
                font: {
                    size: 16
                }
            },
            legend: {
                position: 'top'
            }
        }
    };
}

// =============================================
// Funções Auxiliares
// =============================================
function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = "none";
    }
    
    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].className = tabButtons[i].className.replace(" active", "");
    }
    
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
    
    // Atualizar gráficos ao alternar abas
    if (tabName === 'historico') {
        history.render();
    }
}

function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll("input[type='date']").forEach(input => {
        if (!input.value) input.value = today;
    });
}

// =============================================
// Inicialização
// =============================================
const history = new CalculationHistory();

document.addEventListener('DOMContentLoaded', () => {
    // Abrir a primeira aba por padrão
    document.querySelector(".tab-button").click();
    setCurrentDate();
    
    // Eventos do histórico
    document.getElementById("clear-history")?.addEventListener("click", () => history.clear());
    document.getElementById("export-history")?.addEventListener("click", () => history.exportToCSV());
    
    // Validação em tempo real para fardo misto
    document.getElementById("cristal")?.addEventListener("input", validarSomaFardos);
    document.getElementById("demerara")?.addEventListener("input", validarSomaFardos);
});

function validarSomaFardos() {
    const total = parseInt(document.getElementById("total-fardo-misto").value) || 0;
    const cristal = parseInt(document.getElementById("cristal").value) || 0;
    const demerara = parseInt(document.getElementById("demerara").value) || 0;
    const validationMessage = document.getElementById("validation-message");
    
    if (cristal + demerara !== total) {
        validationMessage.innerHTML = "Atenção: A soma de Cristal + Demerara não corresponde ao total!";
        validationMessage.className = "message error";
    } else {
        validationMessage.innerHTML = "";
        validationMessage.className = "message";
    }
}