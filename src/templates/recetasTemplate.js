import PDFDocument from 'pdfkit';

class RecetasTemplates {
    
    static async generarRecetaMedica(datosReceta, cve) {
        return new Promise((resolve, reject) => {
            try {
                // Crear el PDF con configuración profesional
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: {
                        top: 60,
                        bottom: 60,
                        left: 50,
                        right: 50
                    }
                });
                
                const chunks = [];
                
                // Capturar el PDF en buffer
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);
                
                // === ESTILOS Y COLORES ===
                const colors = {
                    primary: '#2C5282',     // Azul profesional
                    secondary: '#4A90E2',   // Azul claro
                    accent: '#E53E3E',      // Rojo para urgencias
                    text: '#2D3748',        // Gris oscuro
                    lightGray: '#F7FAFC',   // Gris muy claro
                    border: '#E2E8F0'       // Gris para bordes
                };

                // === FUNCIONES AUXILIARES ===
                
                // Función para dibujar header profesional
                function drawHeader() {
                    // Fondo del header
                    doc.rect(0, 0, doc.page.width, 120)
                        .fill(colors.primary);
                    
                    // Logo/Nombre de la clínica
                    doc.fillColor('white')
                        .fontSize(28)
                        .font('Helvetica-Bold')
                        .text('MEDICITAS', 50, 25, { align: 'left' });
                    
                    doc.fontSize(12)
                        .font('Helvetica')
                        .text('Centro Médico Especializado', 50, 60)
                        .text('Tel: (993) 123-4567 | www.medicitas.mx', 50, 75);
                    
                    // Línea decorativa
                    doc.rect(50, 100, doc.page.width - 100, 2)
                        .fill(colors.secondary);
                    
                    // Título del documento
                    doc.fillColor(colors.text)
                        .fontSize(20)
                        .font('Helvetica-Bold')
                        .text('RECETA MÉDICA', 0, 140, { align: 'center' });
                }

                // Función para crear secciones
                function createSection(title, content, yPosition) {
                    // Fondo de la sección
                    doc.rect(50, yPosition - 5, doc.page.width - 100, 25)
                        .fill(colors.lightGray)
                        .stroke(colors.border);
                    
                    // Título de la sección
                    doc.fillColor(colors.primary)
                        .fontSize(12)
                        .font('Helvetica-Bold')
                        .text(title, 60, yPosition + 5);
                    
                    return yPosition + 35; // Retorna la nueva posición Y
                }

                // Función para texto con formato
                function addFormattedText(label, value, x, y, options = {}) {
                    const labelWidth = options.labelWidth || 100;
                    
                    doc.fillColor(colors.text)
                        .fontSize(10)
                        .font('Helvetica-Bold')
                        .text(label + ':', x, y, { width: labelWidth });
                    
                    doc.font('Helvetica')
                        .text(value || 'N/A', x + labelWidth + 5, y, { 
                            width: options.valueWidth || 200 
                        });
                }

                // Función para agregar texto largo con salto de página automático
                function addLongText(text, currentY, sectionTitle) {
                    if (currentY > 650) {
                        doc.addPage();
                        currentY = 50;
                    }
                    
                    if (sectionTitle) {
                        currentY = createSection(sectionTitle, '', currentY);
                    }
                    
                    doc.fillColor(colors.text)
                        .fontSize(11)
                        .font('Helvetica')
                        .text(text, 60, currentY, {
                            width: doc.page.width - 120,
                            align: sectionTitle === 'PRESCRIPCIÓN MÉDICA' ? 'left' : 'justify'
                        });
                    
                    return currentY + Math.ceil(text.length / 80) * 15 + 20;
                }

                // Función para el footer profesional
                function drawFooter() {
                    const footerY = doc.page.height - 100;
                    
                    // Línea separadora
                    doc.rect(50, footerY, doc.page.width - 100, 1)
                        .fill(colors.border);
                    
                    // Firma del médico
                    doc.fillColor(colors.text)
                        .fontSize(10)
                        .font('Helvetica')
                        .text('_'.repeat(40), 60, footerY + 20)
                        .text(`Dr. ${datosReceta.nombre_medico}`, 60, footerY + 35)
                        .text(`Cédula: ${datosReceta.cedulas_profesionales || 'N/A'}`, 60, footerY + 50);
                    
                    // Información de generación
                    doc.text(`Receta generada el: ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')}`, 
                            320, footerY + 20)
                        .text(`ID: ${cve}`, 320, footerY + 35)
                        .text('Documento válido para uso médico', 320, footerY + 50);
                    
                    // Advertencia legal
                    doc.fontSize(8)
                        .fillColor('#666666')
                        .text('Esta receta es válida únicamente con la firma del médico tratante. ' +
                                'Prohibida su reproducción sin autorización.', 
                                50, footerY + 70, {
                                    width: doc.page.width - 100,
                                    align: 'center'
                                });
                }

                // === CONSTRUIR EL DOCUMENTO ===
                
                // Dibujar header
                drawHeader();
                
                let currentY = 180;
                
                // Información del médico
                currentY = createSection('INFORMACIÓN DEL MÉDICO', '', currentY);
                addFormattedText('Médico', `Dr. ${datosReceta.nombre_medico}`, 60, currentY);
                addFormattedText('Especialidad', datosReceta.especialidad || 'Medicina General', 60, currentY + 15);
                addFormattedText('Cédula Prof.', datosReceta.cedulas_profesionales || 'N/A', 320, currentY);
                addFormattedText('Teléfono', datosReceta.telefono_medico || 'N/A', 320, currentY + 15);
                currentY += 50;
                
                // Información del paciente
                currentY = createSection('DATOS DEL PACIENTE', '', currentY);
                addFormattedText('Paciente', datosReceta.nombre_paciente, 60, currentY, { labelWidth: 80 });
                addFormattedText('Fecha Nac.', 
                    datosReceta.fecha_nacimiento ? 
                    new Date(datosReceta.fecha_nacimiento).toLocaleDateString('es-MX') : 'N/A', 
                    320, currentY, { labelWidth: 80 });
                
                addFormattedText('Género', 
                    datosReceta.sexo !== null ? 
                    (datosReceta.sexo ? 'Masculino' : 'Femenino') : 'N/A', 
                    60, currentY + 15, { labelWidth: 80 });
                
                addFormattedText('Teléfono', datosReceta.telefonos || 'N/A', 320, currentY + 15, { labelWidth: 80 });
                
                if (datosReceta.email) {
                    addFormattedText('Email', datosReceta.email, 60, currentY + 30, { labelWidth: 80, valueWidth: 300 });
                    currentY += 15;
                }
                currentY += 50;
                
                // Información de la consulta
                currentY = createSection('INFORMACIÓN DE LA CONSULTA', '', currentY);
                addFormattedText('Fecha Consulta', 
                    datosReceta.fecha_hora_cita ? 
                    new Date(datosReceta.fecha_hora_cita).toLocaleDateString('es-MX') : 'N/A', 
                    60, currentY, { labelWidth: 90 });
                
                addFormattedText('Consultorio', 
                    `${datosReceta.nombre_consultorio} #${datosReceta.numero_consultorio}`, 
                    320, currentY, { labelWidth: 80 });
                
                addFormattedText('Sucursal', 
                    `${datosReceta.nombre_sucursal}, ${datosReceta.ciudad}`, 
                    60, currentY + 15, { labelWidth: 90, valueWidth: 200 });
                
                addFormattedText('Receta #', cve, 320, currentY + 15, { labelWidth: 80 });
                currentY += 50;
                
                // Diagnóstico
                if (datosReceta.diagnostico) {
                    currentY = addLongText(datosReceta.diagnostico, currentY, 'DIAGNÓSTICO');
                }
                
                // Medicamentos
                if (datosReceta.medicamentos) {
                    currentY = addLongText(datosReceta.medicamentos, currentY, 'PRESCRIPCIÓN MÉDICA');
                }
                
                // Indicaciones generales
                if (datosReceta.indicaciones_generales) {
                    currentY = addLongText(datosReceta.indicaciones_generales, currentY, 'INDICACIONES GENERALES');
                }
                
                // Instrucciones específicas
                if (datosReceta.instrucciones_especificas) {
                    currentY = addLongText(datosReceta.instrucciones_especificas, currentY, 'INSTRUCCIONES ESPECÍFICAS');
                }
                
                // Observaciones
                if (datosReceta.observaciones) {
                    currentY = addLongText(datosReceta.observaciones, currentY, 'OBSERVACIONES');
                }
                
                // Próximo control
                if (datosReceta.proximo_control) {
                    if (currentY > 700) {
                        doc.addPage();
                        currentY = 50;
                    }
                    
                    doc.fillColor(colors.accent)
                        .fontSize(12)
                        .font('Helvetica-Bold')
                        .text(`PRÓXIMO CONTROL: ${new Date(datosReceta.proximo_control).toLocaleDateString('es-MX')}`, 
                                60, currentY, { align: 'center' });
                }
                
                // Dibujar footer
                drawFooter();
                
                // Finalizar el PDF
                doc.end();
                
            } catch (error) {
                reject(error);
            }
        });
    }

    // Método para generar otros tipos de documentos médicos en el futuro
    static async generarCertificadoMedico(datosReceta, cve) {
        // Aquí podrías implementar otros templates
        // Por ejemplo: certificados médicos, órdenes de laboratorio, etc.
        return this.generarRecetaMedica(datosReceta, cve);
    }
}

export default RecetasTemplates;