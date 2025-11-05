console.log('=== Iniciando app.js ===');

console.log('Chart disponible:', typeof Chart !== 'undefined');
console.log('jsPDF disponible:', typeof window.jspdf !== 'undefined');

let ecgData = [];
let ecgChart = null;
let hrvChart = null;
let rPeaksIndices = [];
let currentPatient = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado');
    
    console.log('ecgChart canvas:', document.getElementById('ecgChart'));
    console.log('hrvChart canvas:', document.getElementById('hrvChart'));
    
    // Inicializar
    try {
        initCharts();
        loadSelectedPatient();
        setupEventListeners();
        console.log('Inicialización completa');
    } catch (error) {
        console.error('Error en inicialización:', error);
    }
});

function setupEventListeners() {
    const fileInput = document.getElementById('fileInput');
    const loadSampleBtn = document.getElementById('loadSampleBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const thresholdInput = document.getElementById('threshold');
    const thresholdValue = document.getElementById('thresholdValue');
    
    if (fileInput) fileInput.addEventListener('change', handleFileUpload);
    if (loadSampleBtn) loadSampleBtn.addEventListener('click', loadSampleData);
    if (analyzeBtn) analyzeBtn.addEventListener('click', analyzeECG);
    if (thresholdInput) {
        thresholdInput.addEventListener('input', (e) => {
            if (thresholdValue) {
                thresholdValue.textContent = `${e.target.value}%`;
            }
        });
    }
    
    console.log('Event listeners configurados');
}

// Inicializar gráficos
function initCharts() {
    console.log('Inicializando gráficos...');
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js no está disponible');
        alert('Error: Chart.js no se ha cargado correctamente. Por favor recarga la página.');
        return;
    }
    
    const ecgCanvas = document.getElementById('ecgChart');
    const hrvCanvas = document.getElementById('hrvChart');
    
    if (!ecgCanvas || !hrvCanvas) {
        console.error('Canvas no encontrados');
        return;
    }
    
    try {
        ecgChart = new Chart(ecgCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Señal ECG (mV)',
                    data: [],
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Tiempo (s)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Amplitud (mV)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
        
        hrvChart = new Chart(hrvCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Intervalo RR (ms)',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Latido #'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Intervalo RR (ms)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
        
        console.log('Gráficos inicializados correctamente');
    } catch (error) {
        console.error('Error al inicializar gráficos:', error);
    }
}

// Cargar paciente seleccionado si existe
function loadSelectedPatient() {
    const selectedPatient = localStorage.getItem('selected_patient');
    if (selectedPatient) {
        currentPatient = JSON.parse(selectedPatient);
        
        const header = document.querySelector('header');
        const patientBanner = document.createElement('div');
        patientBanner.className = 'mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded';
        patientBanner.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex-1">
                    <p class="text-sm font-medium text-blue-800">Analizando ECG de:</p>
                    <p class="text-lg font-bold text-blue-900">${currentPatient.fullName}</p>
                    <p class="text-sm text-blue-700">ID: ${currentPatient.id} | Edad: ${currentPatient.age} años</p>
                    ${currentPatient.ecgResults ? '<p class="text-xs text-green-700 mt-1">✓ Ya cuenta con resultados de ECG. Puedes generar el PDF completo desde la lista de pacientes.</p>' : '<p class="text-xs text-gray-600 mt-1">Realiza el análisis ECG para generar el informe completo.</p>'}
                </div>
                <button 
                    onclick="clearSelectedPatient()"
                    class="text-blue-600 hover:text-blue-800"
                    title="Cerrar"
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
        header.appendChild(patientBanner);
        console.log('Paciente cargado:', currentPatient);
    }
}

// Limpiar paciente seleccionado
function clearSelectedPatient() {
    localStorage.removeItem('selected_patient');
    location.reload();
}

// Guardar resultados del análisis
function saveAnalysisResults(results) {
    if (currentPatient) {
        // Agregar resultados al paciente actual
        currentPatient.ecgResults = results;
        currentPatient.analysisDate = new Date().toISOString();
        
        localStorage.setItem('selected_patient', JSON.stringify(currentPatient));
        
        const patients = JSON.parse(localStorage.getItem('ecg_patients') || '[]');
        const index = patients.findIndex(p => p.id === currentPatient.id);
        if (index !== -1) {
            patients[index].ecgResults = results;
            patients[index].analysisDate = new Date().toISOString();
            localStorage.setItem('ecg_patients', JSON.stringify(patients));
        }
        
        console.log('Resultados guardados:', results);
        showStatus('Resultados guardados correctamente. Puedes generar el PDF completo desde la lista de pacientes.', 'success');
    }
}

// Generar datos de muestras
function generateSampleECG(duration = 10, samplingRate = 250, heartRate = 75) {
    const samples = duration * samplingRate;
    const data = [];
    const beatInterval = samplingRate / (heartRate / 60);

    for (let i = 0; i < samples; i++) {
        let value = 0;
        const beatPhase = (i % beatInterval) / beatInterval;
        
        if (beatPhase < 0.1) {
            value += 0.15 * Math.sin(beatPhase * 10 * Math.PI);
        }
        else if (beatPhase >= 0.15 && beatPhase < 0.25) {
            const qrsPhase = (beatPhase - 0.15) / 0.1;
            if (qrsPhase < 0.3) value -= 0.3;
            else if (qrsPhase < 0.6) value += 2.5;
            else value -= 0.4;
        }
        else if (beatPhase >= 0.4 && beatPhase < 0.65) {
            const tPhase = (beatPhase - 0.4) / 0.25;
            value += 0.3 * Math.sin(tPhase * Math.PI);
        }
        
        value += (Math.random() - 0.5) * 0.05;
        data.push(value);
    }
    
    return data;
}

// Cargar datos de muestras
function loadSampleData() {
    console.log('Cargando señal de ejemplo...');
    showStatus('Generando señal ECG de ejemplo...', 'info');
    
    const samplingRate = parseInt(document.getElementById('samplingRate').value);
    ecgData = generateSampleECG(10, samplingRate, 75);
    updateECGChart();
    showStatus('Señal de ejemplo cargada correctamente', 'success');
}

// Manejar carga de archivo
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    showStatus('Cargando archivo...', 'info');

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            
            if (file.name.endsWith('.json')) {
                const jsonData = JSON.parse(content);
                ecgData = jsonData.data || jsonData;
            } else {
                const lines = content.split('\n');
                ecgData = lines
                    .map(line => parseFloat(line.trim()))
                    .filter(val => !isNaN(val));
            }
            
            updateECGChart();
            showStatus(`Archivo cargado: ${ecgData.length} muestras`, 'success');
        } catch (error) {
            showStatus('Error al cargar el archivo', 'error');
            console.error(error);
        }
    };
    
    reader.readAsText(file);
}

// Actualizar gráfico ECG
function updateECGChart() {
    if (!ecgChart) {
        console.error('ecgChart no inicializado');
        return;
    }
    
    const samplingRate = parseInt(document.getElementById('samplingRate').value);
    const timeLabels = ecgData.map((_, i) => (i / samplingRate).toFixed(2));
    
    ecgChart.data.labels = timeLabels;
    ecgChart.data.datasets[0].data = ecgData;
    ecgChart.update();
    
    console.log('Gráfico ECG actualizado con', ecgData.length, 'puntos');
}

// Detectar picos R
function detectRPeaks(data, threshold) {
    const peaks = [];
    const normalizedData = normalizeSignal(data);
    const thresholdValue = threshold / 100;
    
    for (let i = 1; i < data.length - 1; i++) {
        const prev = normalizedData[i - 1];
        const current = normalizedData[i];
        const next = normalizedData[i + 1];
        
        if (current > prev && current > next && current > thresholdValue) {
            if (peaks.length === 0 || i - peaks[peaks.length - 1] > 50) {
                peaks.push(i);
            }
        }
    }
    
    return peaks;
}

// Normalizar señal
function normalizeSignal(data) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    return data.map(val => (val - min) / range);
}

// Calcular intervalos RR
function calculateRRIntervals(peaks, samplingRate) {
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
        const interval = ((peaks[i] - peaks[i - 1]) / samplingRate) * 1000;
        intervals.push(interval);
    }
    return intervals;
}

// Analizar ECG
function analyzeECG() {
    console.log('Analizando ECG...');
    
    if (ecgData.length === 0) {
        showStatus('Por favor, carga una señal ECG primero', 'error');
        return;
    }

    showStatus('Analizando señal ECG...', 'info');

    setTimeout(() => {
        const samplingRate = parseInt(document.getElementById('samplingRate').value);
        const threshold = parseInt(document.getElementById('threshold').value);

        rPeaksIndices = detectRPeaks(ecgData, threshold);
        const rrIntervals = calculateRRIntervals(rPeaksIndices, samplingRate);
        const avgRRInterval = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
        const heartRate = Math.round(60000 / avgRRInterval);
        const duration = (ecgData.length / samplingRate).toFixed(2);

        // Actualizar resultados en la UI
        document.getElementById('heartRate').textContent = `${heartRate} bpm`;
        document.getElementById('rPeaks').textContent = rPeaksIndices.length;
        document.getElementById('rrInterval').textContent = `${avgRRInterval.toFixed(2)} ms`;
        document.getElementById('duration').textContent = `${duration} s`;

        updateHRVChart(rrIntervals);
        markRPeaksOnChart();

        // Guardar resultados
        const results = {
            heartRate: heartRate,
            rPeaks: rPeaksIndices.length,
            rrInterval: avgRRInterval.toFixed(2),
            duration: duration,
            samplingRate: samplingRate,
            threshold: threshold
        };

        saveAnalysisResults(results);
        showStatus('Análisis completado exitosamente', 'success');
    }, 500);
}

// Actualizar gráfico HRV
function updateHRVChart(rrIntervals) {
    if (!hrvChart) return;
    
    const labels = rrIntervals.map((_, i) => i + 1);
    hrvChart.data.labels = labels;
    hrvChart.data.datasets[0].data = rrIntervals;
    hrvChart.update();
}

// Marcar picos R en el gráfico
function markRPeaksOnChart() {
    if (ecgChart.data.datasets.length > 1) {
        ecgChart.data.datasets.pop();
    }

    const peakData = ecgData.map(() => null);
    rPeaksIndices.forEach(idx => {
        peakData[idx] = ecgData[idx];
    });

    ecgChart.data.datasets.push({
        label: 'Picos R',
        data: peakData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgb(34, 197, 94)',
        pointRadius: 6,
        pointHoverRadius: 8,
        showLine: false,
        type: 'scatter'
    });

    ecgChart.update();
}

// Mostrar mensajes de estado
function showStatus(message, type = 'info') {
    const statusMessage = document.getElementById('statusMessage');
    const statusText = document.getElementById('statusText');
    
    if (!statusText || !statusMessage) return;
    
    statusText.textContent = message;
    statusMessage.classList.remove('hidden');

    const alertDiv = statusMessage.querySelector('div');
    alertDiv.className = 'p-4 rounded-lg border-l-4';

    if (type === 'success') {
        alertDiv.className += ' bg-green-100 border-green-500 text-green-700';
    } else if (type === 'error') {
        alertDiv.className += ' bg-red-100 border-red-500 text-red-700';
    } else {
        alertDiv.className += ' bg-blue-100 border-blue-500 text-blue-700';
    }

    setTimeout(() => {
        if (type === 'success' || type === 'error') {
            statusMessage.classList.add('hidden');
        }
    }, 5000);
}