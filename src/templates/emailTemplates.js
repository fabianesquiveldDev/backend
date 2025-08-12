// 📁 templates/emailTemplates.js

/**
 * Plantillas de correo para el sistema de citas médicas
 */

const plantillas = {
    /**
     * Plantilla de confirmación de cita para pacientes
     */
    confirmacionPaciente: ({ paciente, disponibilidad, fechaFormateada }) => ({
        asunto: 'Confirmación de cita médica - Clínica',
        textoPlano: `Estimado/a ${paciente.nombrecompletopaciente}, su cita médica ha sido confirmada para el ${fechaFormateada}.`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #2c5aa0; margin: 0;">Confirmación de Cita Médica</h2>
            </div>
            
            <p style="font-size: 16px; color: #333;">Estimado/a <strong>${paciente.nombrecompletopaciente}</strong>,</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Nos complace confirmar que su cita médica ha sido programada exitosamente.
            </p>
            
            <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2c5aa0;">
                <h3 style="color: #2c5aa0; margin-top: 0;">Detalles de su cita:</h3>
                
                <p style="margin: 8px 0; font-size: 15px;"><strong>Médico:</strong> Dr. ${disponibilidad.nombrecompletomedico}</p>
                <p style="margin: 8px 0; font-size: 15px;"><strong>Fecha y hora:</strong> ${fechaFormateada}</p>
                <p style="margin: 8px 0; font-size: 15px;"><strong>Motivo:</strong> ${disponibilidad.motivocita || 'Consulta médica general'}</p>
                <p style="margin: 8px 0; font-size: 15px;"><strong>Ubicación:</strong> ${disponibilidad.nombresucursal}</p>
                <p style="margin: 8px 0; font-size: 15px; margin-left: 20px;">• Piso: ${disponibilidad.nombrepiso}</p>
                <p style="margin: 8px 0; font-size: 15px; margin-left: 20px;">• ${disponibilidad.nombreconsultorio} #${disponibilidad.numeroconsultorio}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>Recordatorio:</strong> Le sugerimos llegar 15 minutos antes de su cita. Si necesita cancelar o reprogramar, por favor contáctenos con al menos 24 horas de anticipación.
                </p>
            </div>
            
            <p style="font-size: 16px; color: #333; margin-top: 25px;">
                Gracias por confiar en nuestros servicios médicos.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="font-size: 14px; color: #666; margin: 0;">
                Este es un mensaje automático, por favor no responder a este correo.
                </p>
            </div>
            </div>
        </div>
        `
    }),

    /**
     * Plantilla de notificación para médicos
     */
    notificacionMedico: ({ paciente, disponibilidad, fechaFormateada }) => ({
        asunto: 'Nueva cita programada - Notificación médico',
        textoPlano: `Dr. ${disponibilidad.nombrecompletomedico}, tiene una nueva cita programada con el paciente ${paciente.nombrecompletopaciente} el ${fechaFormateada}.`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #28a745; margin: 0;">Nueva Cita Programada</h2>
            </div>
            
            <p style="font-size: 16px; color: #333;">Estimado Dr. <strong>${disponibilidad.nombrecompletomedico}</strong>,</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Se ha programado una nueva cita médica en su agenda.
            </p>
            
            <div style="background-color: #f8fff9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3 style="color: #28a745; margin-top: 0;">Información de la cita:</h3>
                
                <p style="margin: 8px 0; font-size: 15px;"><strong>Paciente:</strong> ${paciente.nombrecompletopaciente}</p>
                <p style="margin: 8px 0; font-size: 15px;"><strong>Fecha y hora:</strong> ${fechaFormateada}</p>
                <p style="margin: 8px 0; font-size: 15px;"><strong>Motivo de consulta:</strong> ${disponibilidad.motivocita || 'Consulta médica general'}</p>
                <p style="margin: 8px 0; font-size: 15px;"><strong>Ubicación:</strong> ${disponibilidad.nombresucursal}</p>
                <p style="margin: 8px 0; font-size: 15px; margin-left: 20px;">• Piso: ${disponibilidad.nombrepiso}</p>
                <p style="margin: 8px 0; font-size: 15px; margin-left: 20px;">• ${disponibilidad.nombreconsultorio} #${disponibilidad.numeroconsultorio}</p>
            </div>
            
            <p style="font-size: 16px; color: #333; margin-top: 25px;">
                La cita ha sido confirmada y se ha enviado una notificación al paciente.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="font-size: 14px; color: #666; margin: 0;">
                Sistema de gestión de citas médicas
                </p>
            </div>
            </div>
        </div>
        `
    }),

    /**
     * Plantilla de receta médica para pacientes
     */
    recetaMedica: ({ datosReceta, cve, fechaFormateada }) => ({
        asunto: `Receta Médica - Dr. ${datosReceta.nombre_medico}`,
        textoPlano: `Estimado/a ${datosReceta.nombre_paciente},\n\nAdjunto encontrará su receta médica del Dr. ${datosReceta.nombre_medico}.\n\nSaludos cordiales,\nMediCitas`,
        html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
            <div style="background-color: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
                <div style="background: #2C5282; color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: bold;">MEDICITAS</h1>
                    <p style="margin: 8px 0 0 0; font-size: 16px;">Receta Médica</p>
                </div>
                
                <div style="padding: 30px;">
                    <h2 style="color: #2C5282; margin-top: 0; font-size: 20px;">Estimado/a ${datosReceta.nombre_paciente}</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6; margin: 20px 0;">
                        Adjunto encontrará su receta médica del <strong>Dr. ${datosReceta.nombre_medico}</strong>.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.6; margin: 20px 0;">
                        Si tiene alguna duda sobre el tratamiento, no dude en contactarnos.
                    </p>
                    
                    <div style="background: #f8f9ff; padding: 20px; border-left: 4px solid #4A90E2; margin: 25px 0; border-radius: 0 8px 8px 0;">
                        <p style="margin-top: 0; font-weight: bold; color: #2C5282; font-size: 16px;">Información de la consulta:</p>
                        <p style="margin: 10px 0; font-size: 15px; line-height: 1.8;">
                            📋 <strong>Receta #:</strong> ${cve}<br>
                            📅 <strong>Fecha:</strong> ${fechaFormateada}
                        </p>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
                        <p style="margin: 0; font-size: 14px; color: #856404;">
                            <strong>Importante:</strong> Siga las indicaciones médicas al pie de la letra. Conserve esta receta para futuras consultas.
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; margin-top: 30px; margin-bottom: 5px;">
                        Saludos cordiales,<br>
                        <strong>Centro Médico MediCitas</strong>
                    </p>
                </div>
                
                <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-top: 1px solid #eee;">
                    <p style="font-size: 14px; color: #666; margin: 0;">
                        Este es un mensaje automático, por favor no responder a este correo.
                    </p>
                </div>
            </div>
        </div>
        `
    })
};

/**
 * Función para formatear fecha en español
 */
const formatearFechaEspanol = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const opciones = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return fecha.toLocaleDateString('es-MX', opciones);
};

/**
 * Función principal para generar plantillas de correo
 */
const generarPlantillaCorreo = (tipoPlantilla, datos) => {
    let datosPlantilla;

    // Manejar diferentes tipos de plantillas
    if (tipoPlantilla === 'recetaMedica') {
        const { datosReceta, cve } = datos;
        const fechaFormateada = datosReceta.fecha_hora_cita 
            ? formatearFechaEspanol(datosReceta.fecha_hora_cita)
            : 'N/A';
        
        datosPlantilla = {
            datosReceta,
            cve,
            fechaFormateada
        };
    } else {
        // Para plantillas de citas (confirmacionPaciente, notificacionMedico)
        const { paciente, disponibilidad } = datos;
        const fechaFormateada = formatearFechaEspanol(disponibilidad.fecha_hora_inicio);
        
        datosPlantilla = {
            paciente,
            disponibilidad,
            fechaFormateada
        };
    }

    if (!plantillas[tipoPlantilla]) {
        throw new Error(`Plantilla '${tipoPlantilla}' no encontrada`);
    }

    return plantillas[tipoPlantilla](datosPlantilla);
};

// 🚀 Exportaciones ESM
export {
    generarPlantillaCorreo,
    formatearFechaEspanol,
    plantillas
};

// Exportación por defecto
export default generarPlantillaCorreo;