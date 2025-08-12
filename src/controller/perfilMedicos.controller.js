import { MedicosPerfilModel } from '../models/medicosPerfil.model.js';
import { validarPartialPerfilMedico } from '../schemas/medicosPerfil.schemas.js';
import  PerfilMedicoTemplates  from '../templates/pdfPerfilmedico.js';
import  generarPlantillaPerfilMedico from '../templates/emailPerfiMedicoTemplates.js';
import { enviarCorreo } from '../services/ResendServices.js';
import { NotificacionesController } from './notificaciones.controller.js';
import { CitasModel } from '../models/citas.model.js';





export class MedicosPerfilController {
    static async crear(req, res) {
        try {
            // Validación de datos
            const result = validarPartialPerfilMedico(req.body);
            
            if (!result.success) {
                return res.status(400).json({ 
                    error: 'Datos inválidos',
                    details: JSON.parse(result.error.message) 
                });
            }

            // Creación en la base de datos
            const nuevoPerfil = await MedicosPerfilModel.crear({ input: result.data });
            
            return res.status(201).json({
                success: true,
                data: nuevoPerfil
            });

        } catch (error) {
            console.error('Error en MedicosPerfilController.crear:', error);
            
            // Manejo específico para errores de duplicados
            if (error.code === '23505') { // Código de violación de única restricción en PostgreSQL
                return res.status(409).json({
                    error: 'Registro duplicado',
                    message: 'El perfil médico ya existe en el sistema'
                });
            }

            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }

    static async getOne(req, res) {
        try {
            console.log('req.params:', req.params); 
            const { cve } = req.params;
            console.log('CVE extraído:', cve); 
            
            if (!cve || isNaN(Number(cve))) {
                console.log('CVE inválido:', cve); 
                return res.status(400).json({
                    error: 'ID inválido',
                    message: 'El identificador debe ser un número válido'
                });
            }

            console.log('Llamando a MedicosPerfilModel.getOne con:', { cve }); 
            const perfil = await MedicosPerfilModel.getOne({ cve });
            console.log('Resultado del modelo:', perfil); 
            
            if (!perfil) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'perfil no encontrado' 
                });
            }

            return res.json({
                success: true,
                data: perfil
            });

        } catch (error) {
            console.error('Error completo en MedicosPerfilController.getOne:', error);
            console.error('Stack trace:', error.stack); // Más detalles del error
            
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
    }

    
    }

static async update(req, res) {
    try {
        console.log('req.params:', req.params); 
        console.log('req.body:', req.body); 
        
        const result = validarPartialPerfilMedico(req.body);

        if (!result.success) {
            return res.status(400).json({ 
                error: 'Datos de validación incorrectos, no paso',
                details: result.error.errors 
            });
        }

        const { cve } = req.params;
        
        if (!cve || isNaN(Number(cve))) {
            return res.status(400).json({
                error: 'CVE inválido',
                message: 'El CVE debe ser un número válido'
            });
        }

        // Actualizamos el perfil médico
        const updatedMedicosPerfil = await MedicosPerfilModel.update({ 
            cve: Number(cve),
            input: result.data 
        });

        if (!updatedMedicosPerfil) {
            return res.status(404).json({ 
                error: 'perfil no encontrado',
                message: `No existe un perfil médico con CVE: ${cve}`
            });
        }

        // Obtener cvePaciente que nos devuelve updatedMedicosPerfil (ajusta si tu modelo devuelve otro nombre)
        const cvePaciente = updatedMedicosPerfil.cve_pacientes || req.body.cve_pacientes;

        if (cvePaciente) {
            try {
                // Obtener player_id del paciente
                const playerId = await MedicosPerfilModel.obtenerPlayerIdPorUsuario(cvePaciente);

                if (!playerId) {
                    console.log('⚠️ No se encontró player_id para enviar notificación');
                } else {
                    // Preparar la notificación usando playerId
                    const reqNotificacion = {
                        body: {
                            tipo: 'perfil_medico_actualizado',
                            cve_usuarios: cvePaciente,
                            variables: {
                                mensaje: 'Su perfil médico ha sido actualizado. Revise los cambios'
                            }
                        }
                    };
                    const resNotificacion = {
                        status: () => ({ json: (data) => data }),
                        json: (data) => data
                    };
                    await NotificacionesController.enviarNotificacion(reqNotificacion, resNotificacion);
                    console.log('✅ Notificación de perfil médico actualizada enviada al paciente');
                }
            } catch (notifError) {
                console.error('❌ Error enviando notificación de perfil actualizado:', notifError);
            }
        } else {
            console.log('⚠️ No se encontró clave de paciente para enviar notificación');
        }

        return res.json({
            success: true,
            message: 'perfil médico actualizado correctamente',
            data: updatedMedicosPerfil
        });

    } catch (error) {
        console.error('Error en perfilMedicosController.update:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
}


    
    static async getAll(req, res) { 
                        try {
                            const perfiles = await MedicosPerfilModel.getAll();
                            res.json(perfiles);
                        } catch (error) {
                            console.error("Error en el controlador al obtener perfil médico:", error);
                            const errorMessage = error && typeof error === 'object' && 'message' in error
                                            ? error.message
                                            : "Error interno del servidor al obtener perfil médico.";
                            res.status(500).json({ message: errorMessage });
                        }
    }


        // Método auxiliar para generar el HTML del email
    static async generarPDF(req, res) {
    try {
        const { cve } = req.params;
       
        // Obtener datos completos del perfil médico
        const datosPerfilMedico = await MedicosPerfilModel.getDatosCompletos(cve);
       
        if (!datosPerfilMedico) {
            return res.status(404).json({ 
                success: false,
                message: "Perfil médico del paciente no encontrado" 
            });
        }

        // Validar que el paciente tenga email
        if (!datosPerfilMedico.email) {
            return res.status(400).json({ 
                success: false,
                message: "No se puede enviar el perfil médico: el paciente no tiene email registrado" 
            });
        }

        // 📄 GENERAR PDF USANDO EL TEMPLATE
        console.log('📄 Generando PDF de perfil médico...');
        const pdfBuffer = await PerfilMedicoTemplates.generarPerfilMedico(datosPerfilMedico, cve);

        // 📧 ENVIAR PDF POR CORREO
        try {
            console.log(`📧 Enviando perfil médico a: ${datosPerfilMedico.email}`);
            
            // 🔥 USAR LA PLANTILLA DE EMAIL DESDE emailPerfiMedicoTemplates.js
            const plantillaEmail = generarPlantillaPerfilMedico({
                datosPerfilMedico,
                cve
            });
           
            await enviarCorreo({
                para: datosPerfilMedico.email,
                asunto: plantillaEmail.asunto,
                textoPlano: plantillaEmail.textoPlano,
                html: plantillaEmail.html,
                attachments: [
                    {
                        filename: `Perfil_Medico_${datosPerfilMedico.nombre_paciente.replace(/\s+/g, '_')}_${cve}.pdf`,
                        content: pdfBuffer,
                        type: 'application/pdf'
                    }
                ]
            });

            console.log('✅ Perfil médico enviado exitosamente por correo');
           
            // Respuesta exitosa (sin descarga)
            return res.status(200).json({
                success: true,
                message: `Perfil médico enviado exitosamente a ${datosPerfilMedico.email}`,
                paciente: datosPerfilMedico.nombre_paciente,
                email: datosPerfilMedico.email
            });
           
        } catch (emailError) {
            console.error('❌ Error enviando perfil médico por correo:', emailError.message);
            return res.status(500).json({
                success: false,
                message: "Error al enviar el perfil médico por correo",
                error: emailError.message
            });
        }
       
    } catch (error) {
        console.error("Error en el controlador al generar perfil médico:", error);
        const errorMessage = error && typeof error === 'object' && 'message' in error
                            ? error.message
                            : "Error interno del servidor al generar perfil médico.";
        
        res.status(500).json({ 
            success: false,
            message: errorMessage 
        });
    }
}

}