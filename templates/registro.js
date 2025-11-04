// Clase para manejar pacientes
class PatientManager {
    constructor() {
        this.patients = this.loadPatients();
        this.init();
    }

    init() {
        this.updateDateTime();
        this.generateNewId();
        this.renderPatients();
        this.updateStatistics();
        this.setupEventListeners();
    }

    // Generar ID único automáticamente
    generateNewId() {
        const prefix = 'ECG';
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        
        const newId = `${prefix}-${year}-${timestamp}${random}`;
        const idInput = document.getElementById('patientId');
        if (idInput) {
            idInput.value = newId;
        }
        return newId;
    }

    // Cargar pacientes desde localStorage
    loadPatients() {
        try {
            const stored = localStorage.getItem('ecg_patients');
            if (stored) {
                const patients = JSON.parse(stored);
                console.log('Pacientes cargados:', patients);
                return patients;
            }
        } catch (error) {
            console.error('Error al cargar pacientes:', error);
        }
        return [];
    }

    // Guardar pacientes en localStorage
    savePatients() {
        try {
            localStorage.setItem('ecg_patients', JSON.stringify(this.patients));
            console.log('Pacientes guardados:', this.patients);
            return true;
        } catch (error) {
            console.error('Error al guardar pacientes:', error);
            alert('Error al guardar el paciente. Por favor, verifica el almacenamiento del navegador.');
            return false;
        }
    }

    // Agregar nuevo paciente
    addPatient(patientData) {
        const patient = {
            id: document.getElementById('patientId').value,
            fullName: patientData.fullName.trim(),
            age: parseInt(patientData.age),
            gender: patientData.gender || 'No especificado',
            notes: patientData.notes ? patientData.notes.trim() : '',
            registrationDate: new Date().toISOString(),
            registeredBy: 'AndreaRuizP'
        };

        console.log('Agregando paciente:', patient);
        
        this.patients.unshift(patient);
        
        if (this.savePatients()) {
            this.renderPatients();
            this.updateStatistics();
            return patient;
        }
        
        return null;
    }

    // Eliminar paciente
    deletePatient(id) {
        const patient = this.patients.find(p => p.id === id);
        if (!patient) {
            alert('Paciente no encontrado');
            return;
        }

        if (confirm(`¿Estás seguro de que deseas eliminar al paciente ${patient.fullName}?`)) {
            this.patients = this.patients.filter(p => p.id !== id);
            this.savePatients();
            this.renderPatients();
            this.updateStatistics();
            console.log('Paciente eliminado:', id);
        }
    }

    // Generar PDF completo del paciente
    generatePatientPDF(id) {
        const patient = this.patients.find(p => p.id === id);
        if (!patient) {
            alert('Paciente no encontrado');
            return;
        }

        // Verificar que jsPDF esté disponible
        if (typeof window.jspdf === 'undefined') {
            alert('Error: Librería PDF no cargada. Por favor recarga la página.');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Colores corporativos
            const primaryColor = [255, 255, 255];
            const accentColor = [125, 224, 255];
            const textDark = [31, 41, 55];
            const textLight = [107, 114, 128];
            const bgLight = [249, 250, 251];

            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 20;

            // ============ HEADER ============
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, pageWidth, 25, 'F');

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(28);
            doc.setFont(undefined, 'bold');
            doc.text('Ficha Médica - ECG', pageWidth / 2, 16, { align: 'center' });

            doc.setFillColor(...accentColor);
            doc.rect(0, 25, pageWidth, 3, 'F');

            // ============ INFORMACIÓN DEL PACIENTE ============
            let yPos = 45;

            doc.setFillColor(...bgLight);
            doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 60, 2, 2, 'F');

            // Columna izquierda
            doc.setTextColor(...textDark);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('Nombre del paciente', margin + 5, yPos + 8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...textLight);
            doc.setFontSize(11);
            doc.text(patient.fullName, margin + 5, yPos + 15);

            doc.setTextColor(...textDark);
            doc.setFont(undefined, 'bold');
            doc.setFontSize(10);
            doc.text('ID del paciente', margin + 5, yPos + 26);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...textLight);
            doc.setFontSize(11);
            doc.text(patient.id, margin + 5, yPos + 33);

            const regDate = new Date(patient.registrationDate).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            doc.setTextColor(...textDark);
            doc.setFont(undefined, 'bold');
            doc.setFontSize(10);
            doc.text('Fecha de registro', margin + 5, yPos + 44);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...textLight);
            doc.setFontSize(11);
            doc.text(regDate, margin + 5, yPos + 51);

            // Columna derecha
            doc.setTextColor(...textDark);
            doc.setFont(undefined, 'bold');
            doc.setFontSize(10);
            doc.text('Género', pageWidth / 2 + 10, yPos + 8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...textLight);
            doc.setFontSize(11);
            const genderText = this.getGenderText(patient.gender);
            doc.text(genderText, pageWidth / 2 + 10, yPos + 15);

            doc.setTextColor(...textDark);
            doc.setFont(undefined, 'bold');
            doc.setFontSize(10);
            doc.text('Edad', pageWidth / 2 + 10, yPos + 26);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...textLight);
            doc.setFontSize(11);
            doc.text(`${patient.age} años`, pageWidth / 2 + 10, yPos + 33);

            // Fecha de análisis (si existe)
            if (patient.analysisDate) {
                const analysisDate = new Date(patient.analysisDate).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                doc.setTextColor(...textDark);
                doc.setFont(undefined, 'bold');
                doc.setFontSize(10);
                doc.text('Fecha de análisis', pageWidth / 2 + 10, yPos + 44);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(...textLight);
                doc.setFontSize(11);
                doc.text(analysisDate, pageWidth / 2 + 10, yPos + 51);
            }

            yPos += 70;
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);

            // ============ OBSERVACIONES ============
            yPos += 12;

            doc.setTextColor(...textDark);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Observaciones clínicas', margin, yPos);

            yPos += 10;

            doc.setFillColor(...bgLight);
            const notesHeight = patient.notes ? 40 : 20;
            doc.roundedRect(margin, yPos, pageWidth - 2 * margin, notesHeight, 2, 2, 'F');

            doc.setTextColor(...textLight);
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');

            if (patient.notes) {
                const notesLines = doc.splitTextToSize(patient.notes, pageWidth - 2 * margin - 10);
                doc.text(notesLines, margin + 5, yPos + 8);
                yPos += notesHeight + 10;
            } else {
                doc.setFont(undefined, 'italic');
                doc.text('Sin observaciones registradas', margin + 5, yPos + 10);
                yPos += notesHeight + 10;
            }

            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);

            // ============ RESULTADOS DEL ESTUDIO ECG ============
            yPos += 12;

            doc.setTextColor(...textDark);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Resultados del estudio ECG', margin, yPos);

            yPos += 10;

            // Verificar si hay resultados de ECG
            if (patient.ecgResults) {
                // Tabla de resultados con datos reales
                const rowHeight = 12;
                const col1X = margin + 5;
                const col2X = pageWidth / 2 + 5;

                // Dibujar tabla
                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(200, 200, 200);
                doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight * 4);

                // Líneas horizontales
                for (let i = 1; i <= 4; i++) {
                    doc.line(margin, yPos + (rowHeight * i), pageWidth - margin, yPos + (rowHeight * i));
                }

                // Línea vertical
                doc.line(pageWidth / 2, yPos, pageWidth / 2, yPos + (rowHeight * 4));

                // Encabezados
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(...textDark);
                doc.text('Parámetro', col1X, yPos + 8);
                doc.text('Valor', col2X, yPos + 8);

                // Fila 1: Frecuencia cardíaca
                doc.setFont(undefined, 'normal');
                doc.setTextColor(...textDark);
                doc.text('Frecuencia cardíaca', col1X, yPos + rowHeight + 8);
                doc.setTextColor(...accentColor);
                doc.setFont(undefined, 'bold');
                doc.text(`${patient.ecgResults.heartRate} bpm`, col2X, yPos + rowHeight + 8);

                // Fila 2: Intervalo RR
                doc.setFont(undefined, 'normal');
                doc.setTextColor(...textDark);
                doc.text('Intervalo RR', col1X, yPos + rowHeight * 2 + 8);
                doc.setTextColor(...accentColor);
                doc.setFont(undefined, 'bold');
                doc.text(`${patient.ecgResults.rrInterval} ms`, col2X, yPos + rowHeight * 2 + 8);

                // Fila 3: Picos R detectados
                doc.setFont(undefined, 'normal');
                doc.setTextColor(...textDark);
                doc.text('Picos R detectados', col1X, yPos + rowHeight * 3 + 8);
                doc.setTextColor(...accentColor);
                doc.setFont(undefined, 'bold');
                doc.text(`${patient.ecgResults.rPeaks}`, col2X, yPos + rowHeight * 3 + 8);

                yPos += rowHeight * 4 + 10;

                // Nota de confirmación
                doc.setFillColor(217, 249, 217); 
                doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 2, 2, 'F');
                
                doc.setFontSize(8);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(21, 128, 61); 
                doc.text('Análisis ECG completado', pageWidth / 2, yPos + 8, { align: 'center' });
                doc.setFont(undefined, 'normal');
                doc.text('Los resultados mostrados corresponden al último estudio realizado.',
                         pageWidth / 2, yPos + 14, { align: 'center' });

            } else {
                // Sin resultados - mostrar tabla vacía
                const rowHeight = 12;
                const col1X = margin + 5;
                const col2X = pageWidth / 2 + 5;

                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(200, 200, 200);
                doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight * 4);

                for (let i = 1; i <= 4; i++) {
                    doc.line(margin, yPos + (rowHeight * i), pageWidth - margin, yPos + (rowHeight * i));
                }

                doc.line(pageWidth / 2, yPos, pageWidth / 2, yPos + (rowHeight * 4));

                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(...textDark);
                doc.text('Parámetro', col1X, yPos + 8);
                doc.text('Valor', col2X, yPos + 8);

                doc.setFont(undefined, 'normal');
                doc.setTextColor(...textLight);
                doc.text('Frecuencia cardíaca', col1X, yPos + rowHeight + 8);
                doc.text('-- bpm', col2X, yPos + rowHeight + 8);

                doc.text('Intervalo RR', col1X, yPos + rowHeight * 2 + 8);
                doc.text('-- ms', col2X, yPos + rowHeight * 2 + 8);

                doc.text('Picos R detectados', col1X, yPos + rowHeight * 3 + 8);
                doc.text('--', col2X, yPos + rowHeight * 3 + 8);

                yPos += rowHeight * 4 + 10;

                // Nota informativa
                doc.setFillColor(254, 243, 199); // Amarillo suave
                doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 2, 2, 'F');
                
                doc.setFontSize(8);
                doc.setFont(undefined, 'italic');
                doc.setTextColor(146, 64, 14); // Texto ámbar
                doc.text('Los resultados del análisis ECG se completarán después de realizar el estudio correspondiente.', 
                         pageWidth / 2, yPos + 8, { align: 'center' });
                doc.text('Este documento será actualizado con los valores obtenidos del electrocardiograma.',
                         pageWidth / 2, yPos + 14, { align: 'center' });
            }

            doc.setFillColor(...accentColor);
            doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

            doc.setFontSize(7);
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'normal');
            const currentDate = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            doc.text(`Documento generado: ${currentDate}`, pageWidth / 2, pageHeight - 3, { align: 'center' });

            // Guardar el PDF
            const statusText = patient.ecgResults ? 'Completo' : 'Registro';
            const fileName = `${patient.fullName.replace(/\s+/g, '_')}_${statusText}_${patient.id}.pdf`;
            doc.save(fileName);

            console.log('PDF generado:', fileName);

        } catch (error) {
            console.error('Error al generar PDF:', error);
            alert('Error al generar el PDF: ' + error.message);
        }
    }

    // Obtener texto del género
    getGenderText(gender) {
        const genderMap = {
            'M': 'Masculino',
            'F': 'Femenino',
            'O': 'Otro',
            'No especificado': 'No especificado'
        };
        return genderMap[gender] || 'No especificado';
    }

    // Seleccionar paciente para análisis ECG
    selectPatient(id) {
        const patient = this.patients.find(p => p.id === id);
        if (patient) {
            try {
                localStorage.setItem('selected_patient', JSON.stringify(patient));
                console.log('Paciente seleccionado para análisis:', patient);
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error al seleccionar paciente:', error);
                alert('Error al seleccionar el paciente');
            }
        }
    }

    // Renderizar tabla de pacientes
    renderPatients(filter = '') {
        const tbody = document.getElementById('patientTableBody');
        const emptyState = document.getElementById('emptyState');
        
        if (!tbody || !emptyState) {
            console.error('Elementos de la tabla no encontrados');
            return;
        }

        let filteredPatients = this.patients;
        
        if (filter) {
            filteredPatients = this.patients.filter(p => 
                p.fullName.toLowerCase().includes(filter.toLowerCase()) ||
                p.id.toLowerCase().includes(filter.toLowerCase())
            );
        }

        if (filteredPatients.length === 0) {
            tbody.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        
        tbody.innerHTML = filteredPatients.map(patient => {
            // Determinar si el paciente tiene resultados ECG
            const hasResults = patient.ecgResults ? true : false;
            const pdfTooltip = hasResults ? 'Descargar PDF Completo (con resultados ECG)' : 'Descargar PDF de Registro';
            const pdfIconColor = hasResults ? 'text-blue-600 hover:text-blue-900' : 'text-blue-600 hover:text-blue-900';
            
            return `
            <tr class="hover:bg-gray-50 transition duration-150">
                <td class="px-4 py-4">
                    <div class="flex items-center gap-2">
                        <span class="font-mono text-sm font-semibold text-blue-600">${patient.id}</span>
                        ${hasResults ? '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">✓ ECG</span>' : ''}
                    </div>
                </td>
                <td class="px-4 py-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            ${patient.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-gray-900">${patient.fullName}</p>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-4 text-sm text-gray-700">${patient.age} años</td>
                <td class="px-4 py-4 text-sm text-gray-700">
                    ${this.getGenderBadge(patient.gender)}
                </td>
                <td class="px-4 py-4 text-sm text-gray-700">
                    ${new Date(patient.registrationDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </td>
                <td class="px-4 py-4 text-sm font-medium">
                    <div class="flex space-x-2">
                        <button 
                            onclick="patientManager.selectPatient('${patient.id}')"
                            class="text-green-600 hover:text-green-900 transition" 
                            title="Analizar ECG"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                        </button>
                        <button 
                            onclick="patientManager.generatePatientPDF('${patient.id}')"
                            class="${pdfIconColor} transition" 
                            title="${pdfTooltip}"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                        </button>
                        <button 
                            onclick="patientManager.deletePatient('${patient.id}')"
                            class="text-red-600 hover:text-red-900 transition" 
                            title="Eliminar"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        }).join('');

        console.log('Tabla renderizada con', filteredPatients.length, 'pacientes');
    }

    // Badge de género
    getGenderBadge(gender) {
        const badges = {
            'M': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Masculino</span>',
            'F': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-pink-100 text-pink-800">Femenino</span>',
            'O': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Otro</span>',
            'No especificado': '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">N/E</span>'
        };
        return badges[gender] || badges['No especificado'];
    }

    // Actualizar estadísticas
    updateStatistics() {
        const totalPatientsEl = document.getElementById('totalPatients');
        const todayPatientsEl = document.getElementById('todayPatients');

        if (totalPatientsEl && todayPatientsEl) {
            const today = new Date().toDateString();
            const todayPatients = this.patients.filter(p => 
                new Date(p.registrationDate).toDateString() === today
            ).length;

            totalPatientsEl.textContent = this.patients.length;
            todayPatientsEl.textContent = todayPatients;
            
            console.log('Estadísticas actualizadas - Total:', this.patients.length, 'Hoy:', todayPatients);
        }
    }

    // Actualizar fecha y hora
    updateDateTime() {
        const dateEl = document.getElementById('currentDate');
        if (dateEl) {
            const now = new Date();
            const formatted = now.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            dateEl.textContent = formatted;
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        const form = document.getElementById('patientForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const fullNameInput = document.getElementById('fullName');
                const ageInput = document.getElementById('age');
                const genderInput = document.getElementById('gender');
                const notesInput = document.getElementById('notes');

                if (!fullNameInput || !ageInput) {
                    console.error('Campos del formulario no encontrados');
                    return;
                }

                const formData = {
                    fullName: fullNameInput.value,
                    age: ageInput.value,
                    gender: genderInput ? genderInput.value : '',
                    notes: notesInput ? notesInput.value : ''
                };

                console.log('Datos del formulario:', formData);

                const patient = this.addPatient(formData);
                
                if (patient) {
                    this.showSuccessModal();
                    form.reset();
                    this.generateNewId();
                }
            });
        }

        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const form = document.getElementById('patientForm');
                if (form) {
                    form.reset();
                    this.generateNewId();
                }
            });
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.renderPatients(e.target.value);
            });
        }

        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.hideSuccessModal();
            });
        }

        console.log('Event listeners configurados');
    }

    showSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
}

// Inicializar
let patientManager;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando PatientManager...');
    
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        console.log('localStorage disponible');
    } catch (e) {
        console.error('localStorage NO disponible:', e);
        alert('El almacenamiento local no está disponible. Los datos no se guardarán.');
    }
    
    patientManager = new PatientManager();
    console.log('PatientManager inicializado');
});

window.patientManager = patientManager;