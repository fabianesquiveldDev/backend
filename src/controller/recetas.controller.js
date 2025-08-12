        import { RecetasModel } from "../models/recetas.model.js";
        import PDFDocument from 'pdfkit';
        import { enviarCorreo } from '../services/ResendServices.js';
        import generarPlantillaCorreo from '../templates/emailTemplates.js';
        import RecetasTemplates from '../templates/recetasTemplate.js';

        export class RecetasController {
            
            // Crear nueva receta
            static async crear(req, res) {
                try {
                    const receta = await RecetasModel.crear({ input: req.body });
                    res.status(201).json(receta);
                } catch (error) {
                    console.error("Error en el controlador al crear receta:", error);
                    const errorMessage = error && typeof error === 'object' && 'message' in error
                                    ? error.message
                                    : "Error interno del servidor al crear receta.";
                    res.status(500).json({ message: errorMessage });
                }
            }

            // Obtener todas las recetas
            static async getAll(req, res) {
                try {
                    const recetas = await RecetasModel.getAll();
                    res.json(recetas);
                } catch (error) {
                    console.error("Error en el controlador al obtener recetas:", error);
                    const errorMessage = error && typeof error === 'object' && 'message' in error
                                    ? error.message
                                    : "Error interno del servidor al obtener recetas.";
                    res.status(500).json({ message: errorMessage });
                }
            }

            // Obtener receta por ID
            static async getOne(req, res) {
                try {
                    const { cve } = req.params;
                    const receta = await RecetasModel.getOne(cve);
                    
                    if (!receta) {
                        return res.status(404).json({ message: "Receta no encontrada" });
                    }
                    
                    res.json(receta);
                } catch (error) {
                    console.error("Error en el controlador al obtener receta:", error);
                    const errorMessage = error && typeof error === 'object' && 'message' in error
                                    ? error.message
                                    : "Error interno del servidor al obtener receta.";
                    res.status(500).json({ message: errorMessage });
                }
            }

            // Actualizar receta
            static async update(req, res) {
                try {
                    const { cve } = req.params;
                    const receta = await RecetasModel.update(cve, req.body);
                    
                    if (!receta) {
                        return res.status(404).json({ message: "Receta no encontrada" });
                    }
                    
                    res.json(receta);
                } catch (error) {
                    console.error("Error en el controlador al actualizar receta:", error);
                    const errorMessage = error && typeof error === 'object' && 'message' in error
                                    ? error.message
                                    : "Error interno del servidor al actualizar receta.";
                    res.status(500).json({ message: errorMessage });
                }
            }

            // Obtener recetas por cita
            static async getByCita(req, res) {
                try {
                    const { cveCita } = req.params;
                    const recetas = await RecetasModel.getByCita(cveCita);
                    res.json(recetas);
                } catch (error) {
                    console.error("Error en el controlador al obtener recetas por cita:", error);
                    const errorMessage = error && typeof error === 'object' && 'message' in error
                                    ? error.message
                                    : "Error interno del servidor al obtener recetas por cita.";
                    res.status(500).json({ message: errorMessage });
                }
            }

            // Obtener recetas por paciente
            static async getByPaciente(req, res) {
                try {
                    const { cvePaciente } = req.params;
                    const recetas = await RecetasModel.getByPaciente(cvePaciente);
                    res.json(recetas);
                } catch (error) {
                    console.error("Error en el controlador al obtener recetas por paciente:", error);
                    const errorMessage = error && typeof error === 'object' && 'message' in error
                                    ? error.message
                                    : "Error interno del servidor al obtener recetas por paciente.";
                    res.status(500).json({ message: errorMessage });
                }
            }

            // Obtener recetas por médico
            static async getByMedico(req, res) {
                try {
                    const { cveMedico } = req.params;
                    const recetas = await RecetasModel.getByMedico(cveMedico);
                    res.json(recetas);
                } catch (error) {
                    console.error("Error en el controlador al obtener recetas por médico:", error);
                    const errorMessage = error && typeof error === 'object' && 'message' in error
                                    ? error.message
                                    : "Error interno del servidor al obtener recetas por médico.";
                    res.status(500).json({ message: errorMessage });
                }
            }

    

static async generarPDF(req, res) {
        try {
            const { cve } = req.params;
            
            // Obtener datos completos de la receta
            const datosReceta = await RecetasModel.getDatosCompletos(cve);
            
            if (!datosReceta) {
                return res.status(404).json({ message: "Receta no encontrada" });
            }

            // 📄 GENERAR PDF USANDO EL TEMPLATE
            console.log('📄 Generando PDF de receta médica...');
            const pdfBuffer = await RecetasTemplates.generarRecetaMedica(datosReceta, cve);

            // 📧 ENVIAR PDF POR CORREO AUTOMÁTICAMENTE (si el paciente tiene email)
            if (datosReceta.email) {
                try {
                    console.log(`📧 Enviando receta automáticamente a: ${datosReceta.email}`);
                    
                    await enviarCorreo({
                        para: datosReceta.email,
                        asunto: `Receta Médica - Dr. ${datosReceta.nombre_medico}`,
                        textoPlano: `Estimado/a ${datosReceta.nombre_paciente},\n\nAdjunto encontrará su receta médica del Dr. ${datosReceta.nombre_medico}.\n\nSaludos cordiales,\nMediCitas`,
                        html: RecetasController.generarEmailHTML(datosReceta, cve),
                        attachments: [
                            {
                                filename: `Receta_${datosReceta.nombre_paciente.replace(/\s+/g, '_')}_${cve}.pdf`,
                                content: pdfBuffer,
                                type: 'application/pdf'
                            }
                        ]
                    });

                    console.log('✅ Receta enviada automáticamente por correo');
                    
                } catch (emailError) {
                    console.error('❌ Error enviando correo automático:', emailError.message);
                    // No detener el proceso, continuar con la descarga
                }
            } else {
                console.log('⚠️ No se envió correo: paciente sin email registrado');
            }

            // 📥 CONFIGURAR DESCARGA DEL PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=receta_medicitas_${cve}.pdf`);
            
            // Enviar el PDF como descarga
            res.end(pdfBuffer);
            
        } catch (error) {
            console.error("Error en el controlador al generar PDF:", error);
            const errorMessage = error && typeof error === 'object' && 'message' in error
                                ? error.message
                                : "Error interno del servidor al generar PDF.";
            res.status(500).json({ message: errorMessage });
        }
    }

    // Método auxiliar para generar el HTML del email
   static async generarPDF(req, res) {
    try {
        const { cve } = req.params;
        
        // Obtener datos completos de la receta
        const datosReceta = await RecetasModel.getDatosCompletos(cve);
        
        if (!datosReceta) {
            return res.status(404).json({ message: "Receta no encontrada" });
        }

        // 📄 GENERAR PDF USANDO EL TEMPLATE
        console.log('📄 Generando PDF de receta médica...');
        const pdfBuffer = await RecetasTemplates.generarRecetaMedica(datosReceta, cve);

        // 📧 ENVIAR PDF POR CORREO AUTOMÁTICAMENTE (si el paciente tiene email)
        if (datosReceta.email) {
            try {
                console.log(`📧 Enviando receta automáticamente a: ${datosReceta.email}`);
                
                // 🔥 USAR LA PLANTILLA DE EMAIL DESDE emailTemplates.js
                const plantillaEmail = generarPlantillaCorreo('recetaMedica', {
                    datosReceta,
                    cve
                });
                
                await enviarCorreo({
                    para: datosReceta.email,
                    asunto: plantillaEmail.asunto,
                    textoPlano: plantillaEmail.textoPlano,
                    html: plantillaEmail.html,
                    attachments: [
                        {
                            filename: `Receta_${datosReceta.nombre_paciente.replace(/\s+/g, '_')}_${cve}.pdf`,
                            content: pdfBuffer,
                            type: 'application/pdf'
                        }
                    ]
                });

                console.log('✅ Receta enviada automáticamente por correo');
                
            } catch (emailError) {
                console.error('❌ Error enviando correo automático:', emailError.message);
                // No detener el proceso, continuar con la descarga
            }
        } else {
            console.log('⚠️ No se envió correo: paciente sin email registrado');
        }

        // 📥 CONFIGURAR DESCARGA DEL PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receta_medicitas_${cve}.pdf`);
        
        // Enviar el PDF como descarga
        res.end(pdfBuffer);
        
    } catch (error) {
        console.error("Error en el controlador al generar PDF:", error);
        const errorMessage = error && typeof error === 'object' && 'message' in error
                            ? error.message
                            : "Error interno del servidor al generar PDF.";
        res.status(500).json({ message: errorMessage });
    }
}
        }