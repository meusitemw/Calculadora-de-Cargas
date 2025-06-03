// Função para alternar entre abas
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
    
    // Definir data atual como padrão
    setCurrentDate();
}

// Definir data atual nos campos de data
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll("input[type='date']");
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

// Calcular distribuição de fardos mistos (Cristal + Demerara)
function calcularFardoMisto() {
    const total = parseInt(document.getElementById("total-fardo-misto").value);
    const numLotes = parseFloat(document.getElementById("lotes-fardo-misto").value);
    const cristal = parseInt(document.getElementById("cristal").value);
    const demerara = parseInt(document.getElementById("demerara").value);
    
    // Validar entrada
    const validationMessage = document.getElementById("validation-message");
    
    if (cristal + demerara !== total) {
        validationMessage.innerHTML = "ERRO! A quantidade de fardo informada não bate com a soma total da carga. Verifique a quantidade de cristal e demerara!";
        validationMessage.className = "message error";
        document.getElementById("result-fardo-misto").innerHTML = "";
        return;
    }
    
    const result = distribuirFardosMistos(total, numLotes, cristal, demerara);
    document.getElementById("result-fardo-misto").innerHTML = result.table;
    
    if (result.valid) {
        validationMessage.innerHTML = "✓ Distribuição correta! Total: " + result.totalCalculado;
        validationMessage.className = "message success";
    } else {
        validationMessage.innerHTML = `ERRO! Faltou distribuir: Cristal: ${result.cristalRestante}/${cristal} | Demerara: ${result.demeraraRestante}/${demerara}`;
        validationMessage.className = "message error";
    }
}

// Calcular distribuição de fardos simples
function calcularFardoSimples() {
    const total = parseInt(document.getElementById("total-fardo-simples").value);
    const numLotes = parseFloat(document.getElementById("lotes-fardo-simples").value);
    
    const result = distribuirFardosSimples(total, numLotes);
    document.getElementById("result-fardo-simples").innerHTML = result.table;
}

// Calcular distribuição de sacaria
function calcularSacaria() {
    const total = parseInt(document.getElementById("total-sacos").value);
    const numLotes = parseFloat(document.getElementById("lotes-sacos").value);
    
    const result = distribuirSacaria(total, numLotes);
    document.getElementById("result-sacaria").innerHTML = result.table;
}

// Lógica para distribuir fardos mistos
function distribuirFardosMistos(total, numLotes, cristal, demerara) {
    const lotesInteiros = Math.floor(numLotes);
    const temMeioLote = numLotes % 1 !== 0;
    
    let tamanhoLote, resto;
    if (temMeioLote) {
        tamanhoLote = Math.floor(total / (lotesInteiros + 0.5));
        resto = total - (lotesInteiros * tamanhoLote);
    } else {
        tamanhoLote = Math.floor(total / lotesInteiros);
        resto = total % lotesInteiros;
    }
    
    const dados = [];
    let cristalRestante = cristal;
    let demeraraRestante = demerara;
    let totalCalculado = 0;

    if (temMeioLote) {
        for (let i = 0; i < lotesInteiros + 1; i++) {
            const isMeioLote = i === lotesInteiros;
            const loteAtual = isMeioLote ? resto : tamanhoLote;
            const loteNome = isMeioLote ? "Meio lote" : `Lote ${i+1}`;
            
            let cristalLote = 0;
            let demeraraLote = 0;
            
            if (cristalRestante > 0) {
                if (cristalRestante >= loteAtual) {
                    cristalLote = loteAtual;
                    cristalRestante -= loteAtual;
                } else {
                    cristalLote = cristalRestante;
                    demeraraLote = loteAtual - cristalRestante;
                    demeraraRestante -= demeraraLote;
                    cristalRestante = 0;
                }
            } else {
                demeraraLote = loteAtual;
                demeraraRestante -= loteAtual;
            }
            
            const formatoCristal = formatarPacotes(cristalLote, isMeioLote ? 6 : 12);
            const formatoDemerara = formatarPacotes(demeraraLote, isMeioLote ? 6 : 12);
            
            dados.push([loteNome, formatoCristal, formatoDemerara, loteAtual]);
            totalCalculado += loteAtual;
        }
    } else {
        for (let i = 0; i < lotesInteiros; i++) {
            const loteAtual = tamanhoLote + (i === 0 ? resto : 0);
            
            let cristalLote = 0;
            let demeraraLote = 0;
            
            if (cristalRestante > 0) {
                if (cristalRestante >= loteAtual) {
                    cristalLote = loteAtual;
                    cristalRestante -= loteAtual;
                } else {
                    cristalLote = cristalRestante;
                    demeraraLote = loteAtual - cristalRestante;
                    demeraraRestante -= demeraraLote;
                    cristalRestante = 0;
                }
            } else {
                demeraraLote = loteAtual;
                demeraraRestante -= loteAtual;
            }
            
            const formatoCristal = formatarPacotes(cristalLote, 12);
            const formatoDemerara = formatarPacotes(demeraraLote, 12);
            
            dados.push([`Lote ${i+1}`, formatoCristal, formatoDemerara, loteAtual]);
            totalCalculado += loteAtual;
        }
    }
    
    const valid = totalCalculado === total && cristalRestante === 0 && demeraraRestante === 0;
    
    return {
        table: generateTable(["Lote", "Cristal", "Demerara", "Total"], dados),
        valid,
        totalCalculado,
        cristalRestante,
        demeraraRestante
    };
}

// Lógica para distribuir fardos simples
function distribuirFardosSimples(total, numLotes) {
    const lotesInteiros = Math.floor(numLotes);
    const temMeioLote = numLotes % 1 !== 0;
    
    let dados = [];
    
    if (temMeioLote) {
        const base = Math.floor(total / (lotesInteiros + 0.5));
        const resto = total - (base * lotesInteiros);
        
        for (let i = 0; i < lotesInteiros; i++) {
            dados.push([`Lote ${i+1}`, formatarPacotes(base, 12), base]);
        }
        
        dados.push(["Meio lote", formatarPacotes(resto, 6), resto]);
    } else {
        const base = Math.floor(total / lotesInteiros);
        const resto = total % lotesInteiros;
        
        dados.push(["Lote 1", formatarPacotes(base + resto, 12), base + resto]);
        
        for (let i = 1; i < lotesInteiros; i++) {
            dados.push([`Lote ${i+1}`, formatarPacotes(base, 12), base]);
        }
    }
    
    return {
        table: generateTable(["Lote", "Lastro x Altura", "Total"], dados)
    };
}

// Lógica para distribuir sacaria
function distribuirSacaria(total, numLotes) {
    const lotesInteiros = Math.floor(numLotes);
    const temMeioLote = numLotes % 1 !== 0;
    
    let dados = [];
    
    if (temMeioLote) {
        const base = Math.floor(total / (lotesInteiros + 0.5));
        const resto = total - (base * lotesInteiros);
        
        for (let i = 0; i < lotesInteiros; i++) {
            dados.push([`Lote ${i+1}`, formatarPacotes(base, 5), base]);
        }
        
        dados.push(["Meio lote", formatarPacotes(resto, 5), resto]);
    } else {
        const base = Math.floor(total / lotesInteiros);
        const resto = total % lotesInteiros;
        
        dados.push(["Lote 1", formatarPacotes(base + resto, 5), base + resto]);
        
        for (let i = 1; i < lotesInteiros; i++) {
            dados.push([`Lote ${i+1}`, formatarPacotes(base, 5), base]);
        }
    }
    
    return {
        table: generateTable(["Lote", "Lastro x Altura", "Total"], dados)
    };
}

// Formatar pacotes no formato "12*X+Y"
function formatarPacotes(total, divisor) {
    if (total === 0) return "0";
    const pacotes = Math.floor(total / divisor);
    const resto = total % divisor;
    return `${divisor}*${pacotes}${resto > 0 ? `+${resto}` : ''}`;
}

// Gerar tabela HTML a partir dos dados
function generateTable(headers, rows) {
    let html = '<table><thead><tr>';
    
    // Cabeçalhos
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Linhas
    rows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
            html += `<td>${cell}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    return html;
}

// Inicialização da página
window.onload = function() {
    // Abrir a primeira aba por padrão
    document.querySelector(".tab-button").click();
    
    // Definir data atual
    setCurrentDate();
    
    // Adicionar eventos de input para validação em tempo real
    document.getElementById("cristal").addEventListener("input", validarSomaFardos);
    document.getElementById("demerara").addEventListener("input", validarSomaFardos);
};

// Validar soma de fardos em tempo real
function validarSomaFardos() {
    const total = parseInt(document.getElementById("total-fardo-misto").value) || 0;
    const cristal = parseInt(document.getElementById("cristal").value) || 0;
    const demerara = parseInt(document.getElementById("demerara").value) || 0;
    const validationMessage = document.getElementById("validation-message");
    
    if (cristal + demerara !== total) {
        validationMessage.innerHTML = "Atenção: A soma de Cristal + Demerara não está igual ao total!";
        validationMessage.className = "message error";
    } else {
        validationMessage.innerHTML = "";
        validationMessage.className = "message";
    }
}