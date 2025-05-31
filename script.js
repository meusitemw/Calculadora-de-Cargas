// Variáveis globais
let chartMisto, chartSimples, chartSacaria;
let historico = JSON.parse(localStorage.getItem('historico')) || [];

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initCharts();
    setupEventListeners();
    updateHistoryDisplay();
    setCurrentYear();
    
    // Verificar se é mobile
    if (window.innerWidth <= 992) {
        document.querySelector('.sidebar').classList.remove('active');
    }
});

// Configuração dos gráficos
function initCharts() {
    const ctxMisto = document.getElementById('chart-fardo-misto').getContext('2d');
    const ctxSimples = document.getElementById('chart-fardo-simples').getContext('2d');
    const ctxSacaria = document.getElementById('chart-sacaria').getContext('2d');
    
    chartMisto = new Chart(ctxMisto, getChartConfig('Fardo Misto', ['Cristal', 'Demerara'], ['#4e73df', '#1cc88a']));
    chartSimples = new Chart(ctxSimples, getChartConfig('Apenas Fardos', ['Fardos'], ['#36b9cc']));
    chartSacaria = new Chart(ctxSacaria, getChartConfig('Sacaria', ['Sacos'], ['#f6c23e']));
}

function getChartConfig(title, labels, colors) {
    return {
        type: 'bar',
        data: {
            labels: [],
            datasets: labels.map((label, i) => ({
                label: label,
                backgroundColor: colors[i],
                data: [],
                borderWidth: 1
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: `Distribuição por Lote (${title})`,
                    font: { size: 16 }
                },
                tooltip: { 
                    mode: 'index', 
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 20
                    }
                }
            },
            scales: {
                x: { 
                    title: { 
                        display: true, 
                        text: 'Lotes',
                        font: { weight: 'bold' }
                    },
                    grid: { display: false }
                },
                y: { 
                    title: { 
                        display: true, 
                        text: 'Quantidade',
                        font: { weight: 'bold' }
                    },
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuad'
            }
        }
    };
}

// Configuração dos event listeners
function setupEventListeners() {
    // Botões de cálculo
    document.getElementById('btn-fardo').addEventListener('click', () => {
        const result = calcularFardoMisto();
        if (result) {
            addToHistory('Fardo Misto', result);
            showMessage('Cálculo de fardo misto realizado com sucesso!');
        }
    });
    
    document.getElementById('btn-cristal').addEventListener('click', () => {
        const result = calcularFardoSimples();
        if (result) {
            addToHistory('Apenas Fardos', result);
            showMessage('Cálculo de fardos realizado com sucesso!');
        }
    });
    
    document.getElementById('btn-sacos').addEventListener('click', () => {
        const result = calcularSacaria();
        if (result) {
            addToHistory('Sacaria', result);
            showMessage('Cálculo de sacaria realizado com sucesso!');
        }
    });
    
    // Botões de exportação
    document.getElementById('btn-export-fardo-misto').addEventListener('click', () => exportToPDF('fardo-misto'));
    document.getElementById('btn-export-fardo-simples').addEventListener('click', () => exportToPDF('fardo-simples'));
    document.getElementById('btn-export-sacaria').addEventListener('click', () => exportToPDF('sacaria'));
    
    // Botões do histórico
    document.getElementById('btn-refresh-history').addEventListener('click', updateHistoryDisplay);
    document.getElementById('btn-clear-history').addEventListener('click', clearHistory);
    
    // Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Menu mobile
    document.querySelector('.menu-toggle').addEventListener('click', toggleSidebar);
    document.querySelector('.sidebar-overlay').addEventListener('click', toggleSidebar);
    
    // Botão de histórico mobile
    document.getElementById('btn-history-mobile').addEventListener('click', function() {
        switchTab('historico');
        toggleSidebar();
    });
    
    // Modal
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    
    // Impressão
    document.getElementById('btn-print-current').addEventListener('click', printCurrentSection);
    
    // Redimensionamento da janela
    window.addEventListener('resize', handleWindowResize);
}

// Funções de cálculo - Fardo Misto (ATUALIZADA)
function calcularFardoMisto() {
    const totalFardos = parseInt(document.getElementById('total-fardo').value);
    const numLotes = parseFloat(document.getElementById('lotes-fardo').value);
    const cristal = parseInt(document.getElementById('cristal').value);
    const demerara = parseInt(document.getElementById('demerara').value);
    const tipoInicial = document.getElementById('tipo-inicial').value;
    const data = document.getElementById('data1').value;
    const placa = document.getElementById('placa1').value.toUpperCase();
    const lider = document.getElementById('lider1').value;
    const conferente = document.getElementById('conferente1').value;
    const carregador = document.getElementById('carregador1').value;
    
    // Validações
    if (!validarCampos(totalFardos, numLotes, cristal, demerara)) {
        showError('Por favor, preencha todos os campos com valores válidos!');
        return null;
    }
    
    if (totalFardos !== cristal + demerara) {
        showError('A soma de Cristal e Demerara deve ser igual ao total de fardos!');
        return null;
    }
    
    // Cálculo da distribuição
    const { distribuicao, labels } = calcularDistribuicaoMista(totalFardos, numLotes, cristal, demerara, tipoInicial);
    
    // Exibir resultados
    const html = gerarTabelaResultado(
        'Fardo Misto', 
        totalFardos, 
        numLotes, 
        ['Cristal', 'Demerara'], 
        [cristal, demerara], 
        distribuicao,
        labels
    );
    
    document.getElementById('result-fardo-misto').innerHTML = html;
    updateChart(chartMisto, labels, distribuicao);
    
    return {
        tipo: 'Fardo Misto',
        data: data || formatDate(new Date()),
        placa,
        responsaveis: { lider, conferente, carregador },
        total: totalFardos,
        lotes: numLotes,
        detalhes: { cristal, demerara, tipoInicial },
        distribuicao,
        labels,
        timestamp: new Date().toISOString()
    };
}

function calcularDistribuicaoMista(totalFardos, numLotes, cristal, demerara, tipoInicial) {
    const lotesInteiros = Math.floor(numLotes);
    const temMeioLote = numLotes % 1 !== 0;
    const totalLotes = temMeioLote ? lotesInteiros + 1 : lotesInteiros;
    const fardosPorLote = Math.floor(totalFardos / numLotes);
    
    const distribuicao = [];
    const labels = [];
    
    let cristalRestante = cristal;
    let demeraraRestante = demerara;
    let tipoAtual = tipoInicial;
    
    for (let i = 1; i <= totalLotes; i++) {
        const lote = { numero: i };
        let fardosNoLote = fardosPorLote;
        let label = `Lote ${i}`;
        
        // Ajuste para o meio lote
        if (i === totalLotes && temMeioLote) {
            fardosNoLote = Math.round(totalFardos - (fardosPorLote * lotesInteiros));
            label = 'Meio Lote';
        }
        
        // Distribuir de acordo com o tipo atual
        if (tipoAtual === 'cristal') {
            if (cristalRestante >= fardosNoLote) {
                // Lote completo com cristal
                lote.total = fardosNoLote;
                lote.item0 = fardosNoLote; // Cristal
                lote.item1 = 0; // Demerara
                cristalRestante -= fardosNoLote;
            } else if (cristalRestante > 0) {
                // Usar cristal restante e mudar para demerara no próximo lote
                lote.total = cristalRestante;
                lote.item0 = cristalRestante; // Cristal
                lote.item1 = 0; // Demerara
                cristalRestante = 0;
                tipoAtual = 'demerara';
            } else {
                // Sem cristal restante, usar apenas demerara
                lote.total = Math.min(fardosNoLote, demeraraRestante);
                lote.item0 = 0; // Cristal
                lote.item1 = lote.total; // Demerara
                demeraraRestante -= lote.total;
                tipoAtual = 'demerara';
            }
        } else { // tipoAtual === 'demerara'
            if (demeraraRestante >= fardosNoLote) {
                // Lote completo com demerara
                lote.total = fardosNoLote;
                lote.item0 = 0; // Cristal
                lote.item1 = fardosNoLote; // Demerara
                demeraraRestante -= fardosNoLote;
            } else if (demeraraRestante > 0) {
                // Usar demerara restante e mudar para cristal no próximo lote
                lote.total = demeraraRestante;
                lote.item0 = 0; // Cristal
                lote.item1 = demeraraRestante; // Demerara
                demeraraRestante = 0;
                tipoAtual = 'cristal';
            } else {
                // Sem demerara restante, usar apenas cristal
                lote.total = Math.min(fardosNoLote, cristalRestante);
                lote.item0 = lote.total; // Cristal
                lote.item1 = 0; // Demerara
                cristalRestante -= lote.total;
                tipoAtual = 'cristal';
            }
        }
        
        distribuicao.push(lote);
        labels.push(label);
    }
    
    return { distribuicao, labels };
}

// Funções de cálculo - Apenas Fardos
function calcularFardoSimples() {
    const totalFardos = parseInt(document.getElementById('total-cristal').value);
    const numLotes = parseFloat(document.getElementById('lotes-cristal').value);
    const data = document.getElementById('data2').value;
    const placa = document.getElementById('placa2').value.toUpperCase();
    const lider = document.getElementById('lider2').value;
    const conferente = document.getElementById('conferente2').value;
    const carregador = document.getElementById('carregador2').value;
    
    // Validações
    if (!validarCampos(totalFardos, numLotes)) {
        showError('Por favor, preencha todos os campos com valores válidos!');
        return null;
    }
    
    // Cálculo da distribuição
    const { distribuicao, labels } = calcularDistribuicao(totalFardos, numLotes);
    
    // Exibir resultados
    const html = gerarTabelaResultado(
        'Apenas Fardos', 
        totalFardos, 
        numLotes, 
        ['Fardos'], 
        [totalFardos], 
        distribuicao,
        labels
    );
    
    document.getElementById('result-fardo-simples').innerHTML = html;
    updateChart(chartSimples, labels, distribuicao);
    
    return {
        tipo: 'Apenas Fardos',
        data: data || formatDate(new Date()),
        placa,
        responsaveis: { lider, conferente, carregador },
        total: totalFardos,
        lotes: numLotes,
        distribuicao,
        labels,
        timestamp: new Date().toISOString()
    };
}

// Funções de cálculo - Sacaria
function calcularSacaria() {
    const totalSacos = parseInt(document.getElementById('total-sacos').value);
    const numLotes = parseFloat(document.getElementById('lotes-sacos').value);
    const data = document.getElementById('data3').value;
    const placa = document.getElementById('placa3').value.toUpperCase();
    const lider = document.getElementById('lider3').value;
    const conferente = document.getElementById('conferente3').value;
    const carregador = document.getElementById('carregador3').value;
    
    // Validações
    if (!validarCampos(totalSacos, numLotes)) {
        showError('Por favor, preencha todos os campos com valores válidos!');
        return null;
    }
    
    // Cálculo da distribuição
    const { distribuicao, labels } = calcularDistribuicao(totalSacos, numLotes);
    
    // Exibir resultados
    const html = gerarTabelaResultado(
        'Sacaria', 
        totalSacos, 
        numLotes, 
        ['Sacos'], 
        [totalSacos], 
        distribuicao,
        labels
    );
    
    document.getElementById('result-sacaria').innerHTML = html;
    updateChart(chartSacaria, labels, distribuicao);
    
    return {
        tipo: 'Sacaria',
        data: data || formatDate(new Date()),
        placa,
        responsaveis: { lider, conferente, carregador },
        total: totalSacos,
        lotes: numLotes,
        distribuicao,
        labels,
        timestamp: new Date().toISOString()
    };
}

// Função genérica de distribuição (para fardos simples e sacaria)
function calcularDistribuicao(total, numLotes) {
    const lotesInteiros = Math.floor(numLotes);
    const temMeioLote = numLotes % 1 !== 0;
    const totalLotes = temMeioLote ? lotesInteiros + 1 : lotesInteiros;
    const porLote = Math.floor(total / numLotes);
    const resto = total % numLotes;
    
    const distribuicao = [];
    const labels = [];
    
    for (let i = 1; i <= totalLotes; i++) {
        const lote = { numero: i };
        let label = `Lote ${i}`;
        
        if (i <= lotesInteiros) {
            lote.total = porLote + (i <= resto ? 1 : 0);
        } else {
            lote.total = Math.round(total - (porLote * lotesInteiros));
            label = 'Meio Lote';
        }
        
        lote.item0 = lote.total;
        
        distribuicao.push(lote);
        labels.push(label);
    }
    
    return { distribuicao, labels };
}

// Função para gerar tabela de resultados (ATUALIZADA)
function gerarTabelaResultado(tipo, total, lotes, itens, totais, distribuicao, labels) {
    let html = `
        <div class="result-header">
            <h4>Resultado da Distribuição - ${tipo}</h4>
            <div class="result-summary">
                <span><strong>Total:</strong> ${total}</span>
                <span><strong>Lotes:</strong> ${lotes}</span>
    `;
    
    if (itens.length > 1) {
        html += itens.map((item, i) => `<span><strong>${item}:</strong> ${totais[i]}</span>`).join('');
    }
    
    html += `
            </div>
        </div>
        <div class="table-responsive">
            <table class="result-table">
                <thead>
                    <tr>
                        <th>Lote</th>
                        ${itens.map(item => `<th>${item}</th>`).join('')}
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    distribuicao.forEach((lote, index) => {
        // Formatar a exibição dos itens no formato "12*8+5"
        const formattedItems = itens.map((_, i) => {
            const value = lote[`item${i}`] || 0;
            if (value === 0) return '0';
            
            const fullPallets = Math.floor(value / 12);
            const remainder = value % 12;
            
            if (fullPallets > 0 && remainder > 0) {
                return `12*${fullPallets}+${remainder}`;
            } else if (fullPallets > 0) {
                return `12*${fullPallets}`;
            } else {
                return `${remainder}`;
            }
        });
        
        html += `
                    <tr>
                        <td>${labels[index]}</td>
                        ${formattedItems.map(item => `<td>${item}</td>`).join('')}
                        <td>${lote.total}</td>
                    </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    return html;
}

// Atualizar gráfico
function updateChart(chart, labels, data) {
    if (data[0].item0 !== undefined && data[0].item1 !== undefined) {
        // Fardo misto (múltiplos datasets)
        chart.data.datasets[0].data = data.map(item => item.item0 || 0); // Cristal
        chart.data.datasets[1].data = data.map(item => item.item1 || 0); // Demerara
    } else {
        // Apenas um dataset
        chart.data.datasets[0].data = data.map(item => item.total);
    }
    
    chart.data.labels = labels;
    chart.update();
}

// Funções de histórico
function addToHistory(tipo, data) {
    // Limitar histórico a 50 itens
    if (historico.length >= 50) {
        historico.pop();
    }
    
    historico.unshift(data);
    localStorage.setItem('historico', JSON.stringify(historico));
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('history-list');
    
    if (historico.length === 0) {
        historyList.innerHTML = '<div class="empty-history">Nenhum cálculo no histórico</div>';
        return;
    }
    
    let html = '<div class="history-items">';
    
    historico.forEach((item, index) => {
        html += `
        <div class="history-item">
            <div class="history-header">
                <span class="history-type">${item.tipo}</span>
                <span class="history-date">${item.data}</span>
                ${item.placa ? `<span class="history-placa">${item.placa}</span>` : ''}
            </div>
            <div class="history-details">
                <span><i class="fas fa-box"></i> Total: ${item.total}</span>
                <span><i class="fas fa-layer-group"></i> Lotes: ${item.lotes}</span>
                ${item.detalhes ? Object.entries(item.detalhes).map(([key, val]) => 
                    `<span><i class="fas fa-${key === 'cristal' ? 'snowflake' : key === 'demerara' ? 'cube' : 'info-circle'}"></i> ${key}: ${val}</span>`).join('') : ''}
            </div>
            <div class="history-responsaveis">
                ${item.responsaveis.lider ? `<span><i class="fas fa-user-tie"></i> ${item.responsaveis.lider}</span>` : ''}
                ${item.responsaveis.conferente ? `<span><i class="fas fa-clipboard-check"></i> ${item.responsaveis.conferente}</span>` : ''}
                ${item.responsaveis.carregador ? `<span><i class="fas fa-truck-loading"></i> ${item.responsaveis.carregador}</span>` : ''}
            </div>
            <button class="btn-history-view" data-index="${index}">
                <i class="fas fa-eye"></i> Visualizar
            </button>
        </div>`;
    });
    
    html += '</div>';
    historyList.innerHTML = html;
    
    // Adicionar eventos aos botões de visualização
    document.querySelectorAll('.btn-history-view').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            viewHistoryItem(index);
        });
    });
}

function viewHistoryItem(index) {
    const item = historico[index];
    
    // Determinar qual aba ativar
    let tabId;
    switch(item.tipo) {
        case 'Sacaria':
            tabId = 'sacaria';
            break;
        case 'Apenas Fardos':
            tabId = 'fardo-simples';
            break;
        default:
            tabId = 'fardo-misto';
    }
    
    switchTab(tabId);
    
    // Preencher os campos com os dados do histórico
    const tabPrefix = tabId === 'sacaria' ? '3' : tabId === 'fardo-simples' ? '2' : '1';
    
    // Preencher campos comuns
    document.getElementById(`total-${tabId === 'sacaria' ? 'sacos' : tabId === 'fardo-simples' ? 'cristal' : 'fardo'}`).value = item.total;
    document.getElementById(`lotes-${tabId === 'sacaria' ? 'sacos' : tabId === 'fardo-simples' ? 'cristal' : 'fardo'}`).value = item.lotes;
    document.getElementById(`data${tabPrefix}`).value = item.data;
    document.getElementById(`placa${tabPrefix}`).value = item.placa || '';
    document.getElementById(`lider${tabPrefix}`).value = item.responsaveis.lider || '';
    document.getElementById(`conferente${tabPrefix}`).value = item.responsaveis.conferente || '';
    document.getElementById(`carregador${tabPrefix}`).value = item.responsaveis.carregador || '';
    
    // Preencher campos específicos do fardo misto
    if (item.tipo === 'Fardo Misto') {
        document.getElementById('cristal').value = item.detalhes.cristal;
        document.getElementById('demerara').value = item.detalhes.demerara;
        document.getElementById('tipo-inicial').value = item.detalhes.tipoInicial || 'cristal';
    }
    
    // Disparar o cálculo novamente para atualizar gráficos
    setTimeout(() => {
        const calcularBtn = document.querySelector(`#${tabId} .btn-calculate`);
        if (calcularBtn) {
            calcularBtn.click();
        }
    }, 100);
    
    showMessage('Cálculo carregado do histórico!');
}

function clearHistory() {
    showConfirmModal('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.', () => {
        historico = [];
        localStorage.setItem('historico', JSON.stringify(historico));
        updateHistoryDisplay();
        showMessage('Histórico limpo com sucesso!');
    });
}

// Funções de UI
function switchTab(tabId) {
    // Esconder todas as seções
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remover active de todos os itens do menu
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Ativar a seção e item do menu correspondentes
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.nav-item[data-tab="${tabId}"]`).classList.add('active');
    
    // Fechar sidebar se estiver em mobile
    if (window.innerWidth <= 992) {
        toggleSidebar(false);
    }
}

function toggleSidebar(show = null) {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (show === null) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    } else if (show) {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    } else {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
}

function showError(message) {
    showMessage(message, true);
}

function showMessage(message, isError = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `user-message ${isError ? 'error' : 'success'}`;
    
    const icon = isError ? 'exclamation-circle' : 'check-circle';
    msgDiv.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
        msgDiv.classList.add('fade-out');
        setTimeout(() => msgDiv.remove(), 500);
    }, 3000);
}

function showConfirmModal(message, callback) {
    document.getElementById('modal-message').textContent = message;
    const modal = document.getElementById('modal-confirm');
    
    // Configurar botão de confirmação
    const confirmBtn = document.getElementById('modal-confirm-btn');
    confirmBtn.onclick = function() {
        closeModal();
        callback();
    };
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('modal-confirm').classList.remove('active');
}

// Funções de exportação
function exportToPDF(sectionId) {
    showLoader();
    
    setTimeout(() => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const section = document.getElementById(sectionId);
            const title = section.querySelector('.card-header h3').textContent;
            const date = document.getElementById(sectionId === 'sacaria' ? 'data3' : sectionId === 'fardo-simples' ? 'data2' : 'data1').value || formatDate(new Date());
            const placa = document.getElementById(sectionId === 'sacaria' ? 'placa3' : sectionId === 'fardo-simples' ? 'placa2' : 'placa1').value || 'NÃO INFORMADA';
            
            // Configuração do PDF
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text(title, 14, 20);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.text(`Data: ${date}`, 14, 30);
            doc.text(`Placa: ${placa}`, 14, 38);
            
            // Adicionar tabela
            const table = section.querySelector('.result-table');
            if (table) {
                const headers = [];
                const rows = [];
                
                table.querySelectorAll('th').forEach(th => headers.push(th.textContent));
                table.querySelectorAll('tr:not(:first-child)').forEach(tr => {
                    const row = [];
                    tr.querySelectorAll('td').forEach(td => row.push(td.textContent));
                    rows.push(row);
                });
                
                doc.autoTable({
                    head: [headers],
                    body: rows,
                    startY: 50,
                    styles: { 
                        fontSize: 10,
                        cellPadding: 5,
                        valign: 'middle'
                    },
                    headStyles: { 
                        fillColor: [46, 125, 50],
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    alternateRowStyles: {
                        fillColor: [245, 245, 245]
                    },
                    margin: { top: 50 }
                });
            }
            
            // Adicionar gráfico
            const chartCanvas = section.querySelector('canvas');
            if (chartCanvas) {
                const chartImage = chartCanvas.toDataURL('image/png', 1);
                const yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 50;
                doc.addImage(chartImage, 'PNG', 15, yPosition, 180, 100);
            }
            
            // Adicionar rodapé
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(
                    `Página ${i} de ${pageCount} - MW System © ${new Date().getFullYear()}`,
                    doc.internal.pageSize.getWidth() - 15,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'right' }
                );
            }
            
            // Salvar o PDF
            doc.save(`Agrovale_${title.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.pdf`);
            
            hideLoader();
            showMessage('PDF exportado com sucesso!');
        } catch (error) {
            hideLoader();
            showError('Erro ao gerar PDF: ' + error.message);
            console.error(error);
        }
    }, 500);
}

function printCurrentSection() {
    const activeSection = document.querySelector('.content-section.active');
    const printContent = activeSection.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
        <style>
            @media print {
                body * {
                    visibility: hidden;
                }
                .print-content, .print-content * {
                    visibility: visible;
                }
                .print-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
                .no-print {
                    display: none !important;
                }
            }
            .result-table {
                width: 100%;
                border-collapse: collapse;
            }
            .result-table th, .result-table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: center;
            }
            .result-table th {
                background-color: #f2f2f2;
            }
        </style>
        <div class="print-content">
            ${printContent}
        </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    location.reload();
}

// Funções utilitárias
function formatDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${year}-${month}-${day}`;
}

function setCurrentYear() {
    document.getElementById('current-year').textContent = new Date().getFullYear();
}

function showLoader() {
    document.getElementById('loader').classList.add('active');
}

function hideLoader() {
    document.getElementById('loader').classList.remove('active');
}

function handleWindowResize() {
    // Ajustar sidebar em telas pequenas
    if (window.innerWidth > 992) {
        document.querySelector('.sidebar').classList.remove('active');
        document.querySelector('.sidebar-overlay').classList.remove('active');
    }
    
    // Redimensionar gráficos
    if (chartMisto) chartMisto.resize();
    if (chartSimples) chartSimples.resize();
    if (chartSacaria) chartSacaria.resize();
}

function validarCampos(...values) {
    for (const value of values) {
        if (isNaN(value) || value <= 0) {
            return false;
        }
    }
    return true;
}