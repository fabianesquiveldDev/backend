/**
 * Plantillas de correo electrónico para Perfil Médico
 */

const generarPlantillaPerfilMedico = (datos) => {
    const { datosPerfilMedico, cve } = datos;
    
    // Calcular edad
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

    const edad = calcularEdad(datosPerfilMedico.fecha_nacimiento);
    const fechaFormateada = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return {
        asunto: `📋 Perfil Médico Completo - ${datosPerfilMedico.nombre_paciente}`,
        
        textoPlano: `
PERFIL MÉDICO COMPLETO
====================================

Estimado/a ${datosPerfilMedico.nombre_paciente},

Adjunto encontrará su perfil médico completo actualizado con fecha ${fechaFormateada}.

INFORMACIÓN BÁSICA:
- Paciente: ${datosPerfilMedico.nombre_paciente}
- Edad: ${edad} años
- Tipo de sangre: ${datosPerfilMedico.tipo_sangre || 'No especificado'}
- Contacto de emergencia: ${datosPerfilMedico.contacto_emergencia || 'No registrado'}

Este documento contiene información médica confidencial y debe ser tratado con la máxima seguridad.

En caso de emergencia, presente este documento al personal médico.

Atentamente,
Sistema de Gestión Médica
        `,

        html: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Perfil Médico</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; color: #333;">
    
    <!-- Container principal -->
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3d72 100%); padding: 30px 20px; text-align: center;">
            <div style="background-color: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px; color: white;">📋</span>
            </div>
            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 300;">Perfil Médico Completo</h1>
            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">${fechaFormateada}</p>
        </div>
        
        <!-- Contenido -->
        <div style="padding: 40px 30px;">
            
            <!-- Saludo -->
            <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="color: #2c5aa0; margin: 0 0 10px 0; font-size: 24px;">Estimado/a ${datosPerfilMedico.nombre_paciente}</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
                    Adjunto encontrará su perfil médico completo actualizado. Este documento contiene toda su información médica relevante.
                </p>
            </div>
            
            <!-- Información básica en tarjetas -->
            <div style="margin: 30px 0;">
                <h3 style="color: #2c5aa0; font-size: 18px; margin: 0 0 20px 0; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">
                    📊 Información Básica
                </h3>
                
                <div style="display: table; width: 100%; border-collapse: collapse;">
                    
                    <!-- Fila 1 -->
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 12px 15px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef; width: 40%; font-weight: 600; color: #495057;">
                            👤 Paciente:
                        </div>
                        <div style="display: table-cell; padding: 12px 15px; border-bottom: 1px solid #e9ecef; color: #333;">
                            ${datosPerfilMedico.nombre_paciente}
                        </div>
                    </div>
                    
                    <!-- Fila 2 -->
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 12px 15px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef; width: 40%; font-weight: 600; color: #495057;">
                            🎂 Edad:
                        </div>
                        <div style="display: table-cell; padding: 12px 15px; border-bottom: 1px solid #e9ecef; color: #333;">
                            ${edad} años
                        </div>
                    </div>
                    
                    <!-- Fila 3 -->
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 12px 15px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef; width: 40%; font-weight: 600; color: #495057;">
                            🩸 Tipo de sangre:
                        </div>
                        <div style="display: table-cell; padding: 12px 15px; border-bottom: 1px solid #e9ecef; color: #333;">
                            ${datosPerfilMedico.tipo_sangre || 'No especificado'}
                        </div>
                    </div>
                    
                    <!-- Fila 4 -->
                    <div style="display: table-row;">
                        <div style="display: table-cell; padding: 12px 15px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef; width: 40%; font-weight: 600; color: #495057;">
                            📱 Contacto emergencia:
                        </div>
                        <div style="display: table-cell; padding: 12px 15px; border-bottom: 1px solid #e9ecef; color: #333;">
                            ${datosPerfilMedico.contacto_emergencia || 'No registrado'}
                            ${datosPerfilMedico.telefono_emergencia ? `<br><small style="color: #666;">${datosPerfilMedico.telefono_emergencia}</small>` : ''}
                        </div>
                    </div>
                    
                </div>
            </div>
            
            <!-- Alertas importantes -->
            ${datosPerfilMedico.condiciones_criticas ? `
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 20px; margin-right: 10px;">⚠️</span>
                    <h4 style="margin: 0; color: #856404; font-size: 16px;">Condiciones Críticas</h4>
                </div>
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                    ${datosPerfilMedico.condiciones_criticas}
                </p>
            </div>
            ` : ''}
            
            ${datosPerfilMedico.alergias_medicamentos || datosPerfilMedico.alergias_alimentos || datosPerfilMedico.alergias_otras ? `
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 20px; margin-right: 10px;">🚨</span>
                    <h4 style="margin: 0; color: #721c24; font-size: 16px;">Alergias Registradas</h4>
                </div>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #721c24; font-size: 14px; line-height: 1.5;">
                    ${datosPerfilMedico.alergias_medicamentos ? `<li><strong>Medicamentos:</strong> ${datosPerfilMedico.alergias_medicamentos}</li>` : ''}
                    ${datosPerfilMedico.alergias_alimentos ? `<li><strong>Alimentos:</strong> ${datosPerfilMedico.alergias_alimentos}</li>` : ''}
                    ${datosPerfilMedico.alergias_otras ? `<li><strong>Otras:</strong> ${datosPerfilMedico.alergias_otras}</li>` : ''}
                </ul>
            </div>
            ` : ''}
            
            <!-- Instrucciones -->
            <div style="background-color: #e3f2fd; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px;">📌 Instrucciones Importantes</h3>
                <ul style="margin: 0; padding-left: 20px; color: #1565c0; font-size: 14px; line-height: 1.6;">
                    <li>Mantenga este documento en lugar seguro</li>
                    <li>En caso de emergencia, presente este perfil al personal médico</li>
                    <li>La información médica es confidencial y debe tratarse con máxima seguridad</li>
                    <li>Actualice su perfil regularmente con su médico de cabecera</li>
                </ul>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
                <div style="background-color: #28a745; color: white; padding: 15px 30px; border-radius: 25px; display: inline-block; font-weight: 600; font-size: 16px;">
                    ✅ Perfil médico actualizado y completo
                </div>
            </div>
            
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                <strong>Sistema de Gestión Médica</strong>
            </p>
            <p style="margin: 0; color: #999; font-size: 12px;">
                Este correo contiene información médica confidencial. Si lo recibió por error, elimínelo inmediatamente.
            </p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                <p style="margin: 0; color: #999; font-size: 11px;">
                    Generado automáticamente el ${fechaFormateada} • ID: ${cve}
                </p>
            </div>
        </div>
        
    </div>
    
</body>
</html>
        `
    };
};

export default generarPlantillaPerfilMedico;