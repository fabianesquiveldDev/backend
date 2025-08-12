    import PDFDocument from 'pdfkit';

    /**
     * Genera el PDF del Perfil Médico Completo
     */
    export const generarPerfilMedico = async (datosPerfilMedico, cve) => {
        return new Promise((resolve, reject) => {
            try {
                // Crear nuevo documento PDF
                const doc = new PDFDocument({ 
                    margin: 50,
                    size: 'A4',
                    info: {
                        Title: `Perfil Médico - ${datosPerfilMedico.nombre_paciente}`,
                        Author: 'Sistema de Gestión Médica',
                        Subject: 'Perfil Médico Completo',
                        Keywords: 'perfil médico, salud, paciente'
                    }
                });

                // Buffer para almacenar el PDF
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer);
                });

                // Función para calcular edad
                const calcularEdad = (fechaNacimiento) => {
                    if (!fechaNacimiento) return 'No especificada';
                    const hoy = new Date();
                    const nacimiento = new Date(fechaNacimiento);
                    let edad = hoy.getFullYear() - nacimiento.getFullYear();
                    const mes = hoy.getMonth() - nacimiento.getMonth();
                    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                        edad--;
                    }
                    return edad;
                };

                // Función para formatear fecha
                const formatearFecha = (fecha) => {
                    if (!fecha) return 'No especificada';
                    return new Date(fecha).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                };

                // Función para calcular IMC si no está calculado
                const calcularIMC = (peso, altura) => {
                    if (!peso || !altura) return 'No calculado';
                    const alturaM = altura / 100;
                    const imc = peso / (alturaM * alturaM);
                    return imc.toFixed(1);
                };

                // Función para verificar si necesitamos nueva página
                const verificarEspacio = (espacioNecesario) => {
                    if (yActual + espacioNecesario > 750) {
                        doc.addPage();
                        yActual = 50;
                        return true;
                    }
                    return false;
                };

                // Variables de diseño
                const margenIzquierdo = 50;
                const margenDerecho = 550;
                const colorPrimario = '#2c5aa0';
                const colorSecundario = '#666666';
                const colorTexto = '#333333';
                const colorPeligro = '#d73527';
                const colorExito = '#28a745';
                let yActual = 50;

                // ===== HEADER =====
                // Fondo del header
                doc.rect(0, 0, 612, 120)
                .fill(colorPrimario);

                // Título principal
                doc.fillColor('white')
                .fontSize(24)
                .font('Helvetica-Bold')
                .text('PERFIL MÉDICO COMPLETO', margenIzquierdo, 30);

                // Información del paciente en el header
                doc.fillColor('white')
                .fontSize(14)
                .font('Helvetica')
                .text(`Paciente: ${datosPerfilMedico.nombre_paciente}`, margenIzquierdo, 60)
                .text(`ID: ${cve}`, margenIzquierdo, 80)
                .text(`Generado: ${formatearFecha(new Date())}`, 400, 60)
                .text(`Edad: ${calcularEdad(datosPerfilMedico.fecha_nacimiento)} años`, 400, 80);

                yActual = 150;

                // ===== INFORMACIÓN BÁSICA =====
                doc.fillColor(colorPrimario)
                .fontSize(16)
                .font('Helvetica-Bold')
                .text('INFORMACIÓN BÁSICA', margenIzquierdo, yActual);
                
                yActual += 30;

                // Crear tabla de información básica
                const datosBasicos = [
                    ['Nombre completo:', datosPerfilMedico.nombre_paciente || 'No especificado'],
                    ['Sexo:', datosPerfilMedico.sexo || 'No especificado'],
                    ['Fecha de nacimiento:', formatearFecha(datosPerfilMedico.fecha_nacimiento)],
                    ['Tipo de sangre:', datosPerfilMedico.tipo_sangre || 'No especificado'],
                    ['Email:', datosPerfilMedico.email || 'No especificado'],
                    ['Teléfono:', datosPerfilMedico.telefono || 'No especificado']
                ];

                datosBasicos.forEach(([etiqueta, valor], index) => {
                    // Alternar color de fondo
                    if (index % 2 === 0) {
                        doc.rect(margenIzquierdo - 10, yActual - 5, margenDerecho - margenIzquierdo + 20, 25)
                        .fill('#f8f9fa')
                        .stroke();
                    }

                    doc.fillColor(colorTexto)
                    .fontSize(11)
                    .font('Helvetica-Bold')
                    .text(etiqueta, margenIzquierdo, yActual, { width: 150 });
                    
                    doc.fillColor(colorTexto)
                    .fontSize(11)
                    .font('Helvetica')
                    .text(valor, margenIzquierdo + 160, yActual, { width: 300 });
                    
                    yActual += 25;
                });

                yActual += 20;

                // ===== MEDIDAS FÍSICAS =====
                verificarEspacio(200);
                
                doc.fillColor(colorPrimario)
                .fontSize(16)
                .font('Helvetica-Bold')
                .text('MEDIDAS FÍSICAS Y SIGNOS VITALES', margenIzquierdo, yActual);
                
                yActual += 30;

                const imcCalculado = datosPerfilMedico.imc || calcularIMC(datosPerfilMedico.peso, datosPerfilMedico.altura);

                const datosFisicos = [
                    ['Peso:', datosPerfilMedico.peso ? `${datosPerfilMedico.peso} kg` : 'No especificado'],
                    ['Altura:', datosPerfilMedico.altura ? `${datosPerfilMedico.altura} cm` : 'No especificado'],
                    ['IMC:', imcCalculado],
                    ['Presión arterial:', datosPerfilMedico.presion_arterial_sistolica && datosPerfilMedico.presion_arterial_diastolica 
                        ? `${datosPerfilMedico.presion_arterial_sistolica}/${datosPerfilMedico.presion_arterial_diastolica} mmHg` 
                        : 'No especificada']
                ];

                datosFisicos.forEach(([etiqueta, valor], index) => {
                    if (index % 2 === 0) {
                        doc.rect(margenIzquierdo - 10, yActual - 5, margenDerecho - margenIzquierdo + 20, 25)
                        .fill('#f8f9fa')
                        .stroke();
                    }

                    doc.fillColor(colorTexto)
                    .fontSize(11)
                    .font('Helvetica-Bold')
                    .text(etiqueta, margenIzquierdo, yActual, { width: 150 });
                    
                    doc.fillColor(colorTexto)
                    .fontSize(11)
                    .font('Helvetica')
                    .text(valor, margenIzquierdo + 160, yActual, { width: 300 });
                    
                    yActual += 25;
                });

                yActual += 20;

                // ===== ALERGIAS =====
                verificarEspacio(150);
                
                doc.fillColor(colorPeligro)
                .fontSize(16)
                .font('Helvetica-Bold')
                .text('ALERGIAS', margenIzquierdo, yActual);
                
                yActual += 30;

                const alergias = [
                    ['Medicamentos:', datosPerfilMedico.alergias_medicamentos],
                    ['Alimentos:', datosPerfilMedico.alergias_alimentos],
                    ['Otras alergias:', datosPerfilMedico.alergias_otras]
                ];

                let hayAlergias = false;
                alergias.forEach(([etiqueta, valor]) => {
                    if (valor && valor.trim() !== '') {
                        hayAlergias = true;
                        doc.fillColor(colorPeligro)
                        .fontSize(11)
                        .font('Helvetica-Bold')
                        .text(etiqueta, margenIzquierdo, yActual, { width: 150 });
                        
                        doc.fillColor(colorTexto)
                        .fontSize(11)
                        .font('Helvetica')
                        .text(valor, margenIzquierdo + 160, yActual, { width: 300 });
                        
                        yActual += 25;
                    }
                });

                if (!hayAlergias) {
                    doc.fillColor(colorExito)
                    .fontSize(11)
                    .font('Helvetica-Bold')
                    .text(' Sin alergias registradas', margenIzquierdo, yActual);
                    yActual += 25;
                }

                yActual += 20;

                // ===== CONDICIONES MÉDICAS =====
                verificarEspacio(200);
                
                doc.fillColor(colorPrimario)
                .fontSize(16)
                .font('Helvetica-Bold')
                .text('CONDICIONES MÉDICAS', margenIzquierdo, yActual);
                
                yActual += 30;

                const condicionesMedicas = [
                    ['Enfermedades crónicas:', datosPerfilMedico.enfermedades_cronicas],
                    ['Condiciones especiales:', datosPerfilMedico.condiciones_especiales],
                    ['Condiciones críticas:', datosPerfilMedico.condiciones_criticas],
                    ['Medicamentos actuales:', datosPerfilMedico.medicamentos_actuales]
                ];

                condicionesMedicas.forEach(([etiqueta, valor]) => {
                    // Color especial para condiciones críticas
                    const esCritico = etiqueta.includes('críticas');
                    const colorEtiqueta = esCritico ? colorPeligro : colorTexto;

                    doc.fillColor(colorEtiqueta)
                    .fontSize(11)
                    .font('Helvetica-Bold')
                    .text(etiqueta, margenIzquierdo, yActual, { width: 150 });
                    
                    if (valor && valor.trim() !== '') {
                        doc.fillColor(colorTexto)
                        .fontSize(11)
                        .font('Helvetica')
                        .text(valor, margenIzquierdo + 160, yActual, { width: 300 });
                    } else {
                        doc.fillColor(colorSecundario)
                        .fontSize(11)
                        .font('Helvetica-Oblique')
                        .text('No especificado', margenIzquierdo + 160, yActual, { width: 300 });
                    }
                    
                    yActual += 30;
                });

                yActual += 10;

                // ===== HISTORIAL MÉDICO =====
                verificarEspacio(250);
                
                doc.fillColor(colorPrimario)
                .fontSize(16)
                .font('Helvetica-Bold')
                .text('HISTORIAL MÉDICO', margenIzquierdo, yActual);
                
                yActual += 30;

                const historialMedico = [
                    ['Cirugías previas:', datosPerfilMedico.cirugias_previas],
                    ['Hospitalizaciones recientes:', datosPerfilMedico.hospitalizaciones_recientes],
                    ['Antecedentes familiares:', datosPerfilMedico.antecedentes_familiares],
                    ['Motivo consulta frecuente:', datosPerfilMedico.motivo_consulta_frecuente],
                    ['Especialista habitual:', datosPerfilMedico.especialista_habitual]
                ];

                historialMedico.forEach(([etiqueta, valor]) => {
                    doc.fillColor(colorTexto)
                    .fontSize(11)
                    .font('Helvetica-Bold')
                    .text(etiqueta, margenIzquierdo, yActual, { width: 150 });
                    
                    if (valor && valor.trim() !== '') {
                        doc.fillColor(colorTexto)
                        .fontSize(11)
                        .font('Helvetica')
                        .text(valor, margenIzquierdo + 160, yActual, { width: 300 });
                    } else {
                        doc.fillColor(colorSecundario)
                        .fontSize(11)
                        .font('Helvetica-Oblique')
                        .text('No especificado', margenIzquierdo + 160, yActual, { width: 300 });
                    }
                    
                    yActual += 30;
                });

                yActual += 10;

                // ===== CONTACTO DE EMERGENCIA =====
                verificarEspacio(100);
                
                doc.fillColor(colorPeligro)
                .fontSize(16)
                .font('Helvetica-Bold')
                .text('CONTACTO DE EMERGENCIA', margenIzquierdo, yActual);
                
                yActual += 30;

                const contactosEmergencia = [
                    ['Contacto:', datosPerfilMedico.contacto_emergencia],
                    ['Teléfono:', datosPerfilMedico.telefono_emergencia]
                ];

                contactosEmergencia.forEach(([etiqueta, valor]) => {
                    doc.fillColor(colorPeligro)
                    .fontSize(11)
                    .font('Helvetica-Bold')
                    .text(etiqueta, margenIzquierdo, yActual, { width: 150 });
                    
                    if (valor && valor.trim() !== '') {
                        doc.fillColor(colorTexto)
                        .fontSize(11)
                        .font('Helvetica-Bold')
                        .text(valor, margenIzquierdo + 160, yActual, { width: 300 });
                    } else {
                        doc.fillColor(colorSecundario)
                        .fontSize(11)
                        .font('Helvetica-Oblique')
                        .text('No registrado', margenIzquierdo + 160, yActual, { width: 300 });
                    }
                    
                    yActual += 25;
                });

                yActual += 20;

                // ===== OBSERVACIONES Y NOTAS =====
                verificarEspacio(200);
                
                doc.fillColor(colorPrimario)
                .fontSize(16)
                .font('Helvetica-Bold')
                .text('OBSERVACIONES Y NOTAS', margenIzquierdo, yActual);
                
                yActual += 30;

                const observaciones = [
                    ['Restricciones especiales:', datosPerfilMedico.restricciones_especiales],
                    ['Preferencias de horario:', datosPerfilMedico.preferencias_horario],
                    ['Notas especiales:', datosPerfilMedico.notas_especiales],
                    ['Observaciones del personal médico:', datosPerfilMedico.observaciones_personal_medico]
                ];

                observaciones.forEach(([etiqueta, valor]) => {
                    verificarEspacio(60);
                    
                    doc.fillColor(colorTexto)
                    .fontSize(11)
                    .font('Helvetica-Bold')
                    .text(etiqueta, margenIzquierdo, yActual, { width: 500 });
                    
                    yActual += 20;

                    if (valor && valor.trim() !== '') {
                        doc.fillColor(colorTexto)
                        .fontSize(10)
                        .font('Helvetica')
                        .text(valor, margenIzquierdo + 20, yActual, { width: 480, align: 'justify' });
                        yActual += Math.ceil(valor.length / 80) * 15 + 10;
                    } else {
                        doc.fillColor(colorSecundario)
                        .fontSize(10)
                        .font('Helvetica-Oblique')
                        .text('No especificado', margenIzquierdo + 20, yActual, { width: 480 });
                        yActual += 25;
                    }
                });

                // ===== FOOTER =====
                verificarEspacio(100);
                yActual += 20;

                // Línea separadora
                doc.moveTo(margenIzquierdo, yActual)
                .lineTo(margenDerecho, yActual)
                .strokeColor(colorPrimario)
                .lineWidth(2)
                .stroke();

                yActual += 15;

                // Información del sistema y fecha de actualización
                doc.fillColor(colorSecundario)
                .fontSize(9)
                .font('Helvetica')
                .text('Documento generado por Sistema de Gestión MediCitas', margenIzquierdo, yActual)
                .text(`Última actualización del perfil: ${formatearFecha(datosPerfilMedico.fecha_ultima_actualizacion)}`, margenIzquierdo, yActual + 12)
                .text(`Fecha de generación: ${formatearFecha(new Date())}`, margenIzquierdo, yActual + 24);

                // Advertencia médica
                yActual += 50;
                doc.fillColor(colorPeligro)
                .fontSize(8)
                .font('Helvetica-Bold')
                .text('IMPORTANTE: Esta información es confidencial y de uso exclusivo del personal médico autorizado.', 
                        margenIzquierdo, yActual, { width: 500, align: 'center' });

                // Finalizar documento
                doc.end();

            } catch (error) {
                console.error('Error generando PDF:', error);
                reject(error);
            }
        });
    };

    export default {
        generarPerfilMedico
    };