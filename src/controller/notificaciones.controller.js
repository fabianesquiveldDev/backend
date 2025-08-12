import { NotificacionesModel } from '../models/notificaciones.model.js';
import { sendPushNotification, obtenerPlayerIdsPorUsuario,sendPushNotificationWeb } from '../services/onesignalService.js'; 

export class NotificacionesController {
    
    // 📤 ENVIAR CUALQUIERA DE LAS 14 NOTIFICACIONES
    static async enviarNotificacion(req, res) {
        try {
            const { tipo, cve_usuarios, variables } = req.body;

            // Validación básica
            if (!tipo || !cve_usuarios) {
                return res.status(400).json({ error: 'Faltan datos: tipo y cve_usuarios requeridos' });
            }

            // 1. Obtener template de la BD
            const tipoNotificacion = await NotificacionesModel.obtenerTipoPorNombre(tipo);
            if (!tipoNotificacion) {
                return res.status(404).json({ error: 'Tipo de notificación no encontrado' });
            }

            // 2. Procesar templates (reemplazar {fecha}, {doctor}, etc.)
            const titulo = NotificacionesController.procesarTemplate(tipoNotificacion.titulo_template, variables);
            const mensaje = NotificacionesController.procesarTemplate(tipoNotificacion.mensaje_template, variables);

            // 3. Obtener player_ids del usuario
            const dispositivos = await obtenerPlayerIdsPorUsuario(cve_usuarios);
            if (!dispositivos || dispositivos.length === 0) {
                return res.status(404).json({ error: 'Usuario sin dispositivos registrados' });
            }
            
            const playerIds = dispositivos.map(d => d.player_id);

            // 4. Enviar con OneSignal
            const resultadoOneSignal = await sendPushNotification({
                title: titulo,
                message: mensaje,
                playerIds: playerIds
            });

            // 5. Guardar en historial
            const notificacionGuardada = await NotificacionesModel.crearNotificacionEnviada({
                cve_usuarios,
                cve_tipos_notificaciones: tipoNotificacion.cve_tipos_notificaciones,
                titulo_enviado: titulo,
                mensaje_enviado: mensaje,
                player_ids_usados: playerIds,
                estado: 'enviada',
                onesignal_id: resultadoOneSignal.id,
                metadata: variables || {}
            });

            res.json({
                success: true,
                mensaje: 'Notificación enviada correctamente',
                data: {
                    notificacion_id: notificacionGuardada.cve_notificaciones_enviadas,
                    onesignal_id: resultadoOneSignal.id,
                    dispositivos_alcanzados: playerIds.length
                }
            });

        } catch (error) {
            console.error('❌ Error enviando notificación:', error);
            
            // Guardar error en historial si tenemos los datos básicos
            if (req.body.cve_usuarios && req.body.tipo) {
                try {
                    const tipoNotificacion = await NotificacionesModel.obtenerTipoPorNombre(req.body.tipo);
                    if (tipoNotificacion) {
                        await NotificacionesModel.crearNotificacionEnviada({
                            cve_usuarios: req.body.cve_usuarios,
                            cve_tipos_notificaciones: tipoNotificacion.cve_tipos_notificaciones,
                            titulo_enviado: 'Error al procesar',
                            mensaje_enviado: 'Error al procesar notificación',
                            estado: 'fallida',
                            codigo_error: error.message
                        });
                    }
                } catch (saveError) {
                    console.error('❌ Error guardando fallo:', saveError);
                }
            }

            res.status(500).json({ 
                error: 'Error interno del servidor',
                message: error.message 
            });
        }
    }

    // 📋 OBTENER LOS 14 TIPOS DE NOTIFICACIONES
    static async obtenerTiposNotificaciones(req, res) {
        try {
            const tipos = await NotificacionesModel.obtenerTodosLosTipos();
            
            res.json({
                success: true,
                data: tipos
            });

        } catch (error) {
            console.error('❌ Error obteniendo tipos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // 📊 OBTENER HISTORIAL DE UN USUARIO
    static async obtenerHistorialUsuario(req, res) {
        try {
            const { cve_usuarios } = req.params;
            const { limite = 20, pagina = 1 } = req.query;

            if (!cve_usuarios) {
                return res.status(400).json({ error: 'cve_usuarios requerido' });
            }

            const historial = await NotificacionesModel.obtenerHistorialUsuario(
                cve_usuarios, 
                parseInt(limite), 
                parseInt(pagina)
            );

            res.json({
                success: true,
                data: historial
            });

        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // 🔧 FUNCIÓN AUXILIAR - Procesar templates
    static procesarTemplate(template, variables = {}) {
        if (!template || !variables) return template;

        let resultado = template;
        
        // Reemplazar todas las variables {variable}
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{${key}}`, 'g');
            resultado = resultado.replace(regex, variables[key] || '');
        });

        return resultado;
    }

    // ⚙️ CONFIGURACIÓN DE USUARIO (Opcional - para después)
    static async obtenerConfiguracionUsuario(req, res) {
        try {
            const { cve_usuarios } = req.params;

            const configuracion = await NotificacionesModel.obtenerConfiguracionUsuario(cve_usuarios);
            
            res.json({
                success: true,
                data: configuracion
            });

        } catch (error) {
            console.error('❌ Error obteniendo configuración:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    static async actualizarConfiguracionUsuario(req, res) {
        try {
            const { cve_usuarios } = req.params;
            const { configuraciones } = req.body; // Array de {cve_tipos_notificaciones, activa}

            await NotificacionesModel.actualizarConfiguracionUsuario(cve_usuarios, configuraciones);
            
            res.json({
                success: true,
                mensaje: 'Configuración actualizada correctamente'
            });

        } catch (error) {
            console.error('❌ Error actualizando configuración:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // Enviar notificación personalizada (mensaje libre) a un paciente específico
// Enviar notificación personalizada (mensaje libre) a un paciente específico
// Enviar notificación personalizada (mensaje libre) a un paciente específico
static async enviarNotificacionPersonalizada(req, res) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🚀 [${requestId}] Iniciando envío de notificación personalizada`);
    
    try {
        const { cve_pacientes, mensaje, titulo = 'Notificación Personalizada' } = req.body;
        
        console.log(`📋 [${requestId}] Datos recibidos:`, {
            cve_pacientes,
            titulo,
            mensaje_length: mensaje?.length || 0,
            timestamp: new Date().toISOString()
        });

        // Validación de parámetros
        if (!cve_pacientes || !mensaje) {
            console.warn(`⚠️ [${requestId}] Validación fallida - Parámetros faltantes:`, {
                cve_pacientes_presente: !!cve_pacientes,
                mensaje_presente: !!mensaje
            });
            return res.status(400).json({ error: 'cve_pacientes y mensaje son requeridos' });
        }

        console.log(`🔍 [${requestId}] Buscando dispositivos para paciente: ${cve_pacientes}`);
        
        // Obtener los dispositivos del paciente
        const startTime = Date.now();
        const dispositivos = await NotificacionesModel.obtenerPlayerIdsPorUsuario(cve_pacientes);
        const queryTime = Date.now() - startTime;
        
        console.log(`📱 [${requestId}] Consulta de dispositivos completada en ${queryTime}ms:`, {
            dispositivos_encontrados: dispositivos?.length || 0,
            dispositivos: dispositivos?.map(d => ({ 
                cve_usuarios: d.cve_usuarios,
                player_id: d.player_id?.substring(0, 10) + '...', 
                plataforma: d.plataforma
            })) || []
        });

        if (!dispositivos || dispositivos.length === 0) {
            console.warn(`📵 [${requestId}] Sin dispositivos registrados para paciente ${cve_pacientes}`);
            return res.status(404).json({ error: 'Paciente sin dispositivos registrados' });
        }

        const playerIds = dispositivos.map(d => d.player_id);
        console.log(`🎯 [${requestId}] Player IDs preparados:`, {
            total_player_ids: playerIds.length,
            player_ids_preview: playerIds.map(id => id?.substring(0, 10) + '...')
        });

        // Preparar datos para OneSignal
        const notificationData = {
            title: titulo,
            message: mensaje,
            playerIds: playerIds
        };

        console.log(`📤 [${requestId}] Enviando notificación a OneSignal:`, {
            titulo,
            mensaje_preview: mensaje.substring(0, 50) + (mensaje.length > 50 ? '...' : ''),
            destinatarios: playerIds.length
        });

        // Enviar la notificación con el mensaje personalizado
        const oneSignalStartTime = Date.now();
        const resultadoOneSignal = await sendPushNotification(notificationData);
        const oneSignalTime = Date.now() - oneSignalStartTime;

        console.log(`✅ [${requestId}] Respuesta de OneSignal recibida en ${oneSignalTime}ms:`, {
            onesignal_id: resultadoOneSignal?.id,
            recipients: resultadoOneSignal?.recipients || 0,
            external_id_count: resultadoOneSignal?.external_id_count || 0,
            status: resultadoOneSignal ? 'success' : 'unknown'
        });

        // Preparar datos para historial
        const historialData = {
            cve_usuarios: cve_pacientes,
            cve_tipos_notificaciones: 6,  // ID del tipo "personalizada" (ajusta según tu BD)
            titulo_enviado: titulo,
            mensaje_enviado: mensaje,
            player_ids_usados: playerIds,
            estado: 'enviada',
            onesignal_id: resultadoOneSignal?.id || null,
            metadata: {
                request_id: requestId,
                timestamp: new Date().toISOString(),
                dispositivos_alcanzados: playerIds.length,
                tiempo_onesignal: oneSignalTime
            }
        };

        console.log(`💾 [${requestId}] Guardando en historial:`, {
            cve_usuarios: cve_pacientes,
            titulo: titulo,
            onesignal_id: resultadoOneSignal?.id,
            dispositivos: playerIds.length
        });

        // Guardar en historial
        const historialStartTime = Date.now();
        const historialResult = await NotificacionesModel.crearNotificacionEnviada(historialData);
        const historialTime = Date.now() - historialStartTime;

        console.log(`📝 [${requestId}] Historial guardado en ${historialTime}ms:`, {
            historial_id: historialResult?.id || 'unknown',
            status: 'success'
        });

        const responseData = {
            success: true,
            mensaje: 'Notificación personalizada enviada correctamente',
            data: {
                request_id: requestId,
                dispositivos_alcanzados: playerIds.length,
                onesignal_id: resultadoOneSignal?.id,
                recipients: resultadoOneSignal?.recipients || 0,
                timing: {
                    consulta_dispositivos: queryTime,
                    envio_onesignal: oneSignalTime,
                    guardado_historial: historialTime,
                    total: Date.now() - (parseInt(requestId.split('_')[1]))
                }
            }
        };

        console.log(`🎉 [${requestId}] Proceso completado exitosamente:`, responseData.data);
        res.json(responseData);

    } catch (error) {
        console.error(`❌ [${requestId}] Error en envío de notificación personalizada:`, {
            error_name: error.name,
            error_message: error.message,
            error_stack: error.stack,
            timestamp: new Date().toISOString(),
            request_body: req.body
        });

        // Log adicional si hay información específica del error
        if (error.response) {
            console.error(`📡 [${requestId}] Detalles de respuesta de error:`, {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }

        if (error.code) {
            console.error(`🔢 [${requestId}] Código de error específico:`, error.code);
        }

        res.status(500).json({ 
            error: 'Error interno del servidor', 
            message: error.message,
            request_id: requestId
        });
    }
}

// 🌐 ENVIAR NOTIFICACIÓN ESPECÍFICA PARA WEB
// 🌐 ENVIAR NOTIFICACIÓN ESPECÍFICA PARA WEB
static async enviarNotificacionWeb(req, res) {
    const requestId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🌐 [${requestId}] Iniciando envío de notificación WEB`);
    
    try {
        const { playerIds, titulo, mensaje, url = null } = req.body;
        
        console.log(`📋 [${requestId}] Datos recibidos:`, {
            playerIds_count: Array.isArray(playerIds) ? playerIds.length : 0,
            titulo,
            mensaje_length: mensaje?.length || 0,
            url,
            timestamp: new Date().toISOString()
        });

        // Validación
        if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0 || !titulo || !mensaje) {
            console.warn(`⚠️ [${requestId}] Validación fallida - Parámetros faltantes`);
            return res.status(400).json({ 
                error: 'playerIds (array), titulo y mensaje son requeridos' 
            });
        }

        console.log(`🎯 [${requestId}] Player IDs directos recibidos: ${playerIds.length}`);

        // Enviar notificación WEB
        console.log(`📤 [${requestId}] Enviando notificación WEB a OneSignal`);
        
        const oneSignalStartTime = Date.now();
        const resultadoOneSignal = await sendPushNotificationWeb(titulo, mensaje, playerIds, url);
        const oneSignalTime = Date.now() - oneSignalStartTime;

        console.log(`✅ [${requestId}] OneSignal completado en ${oneSignalTime}ms:`, {
            onesignal_id: resultadoOneSignal?.id,
            recipients: resultadoOneSignal?.recipients || 0
        });

        // Guardar en historial (opcional - si quieres trackear)
        const historialData = {
            cve_usuarios: null, // No tenemos cve_usuarios directo
            cve_tipos_notificaciones: 15, // Tipo específico para notificaciones web
            titulo_enviado: titulo,
            mensaje_enviado: mensaje,
            player_ids_usados: playerIds,
            estado: 'enviada',
            onesignal_id: resultadoOneSignal?.id || null,
            metadata: {
                request_id: requestId,
                tipo: 'web_direct',
                url: url,
                timestamp: new Date().toISOString(),
                dispositivos_alcanzados: playerIds.length,
                tiempo_onesignal: oneSignalTime
            }
        };

        // 💾 HISTORIAL DESHABILITADO PARA NOTIFICACIONES WEB DIRECTAS
        // console.log(`💾 [${requestId}] Guardando en historial`);
        // const historialStartTime = Date.now();
        // const historialResult = await NotificacionesModel.crearNotificacionEnviada(historialData);
        // const historialTime = Date.now() - historialStartTime;
        // console.log(`📝 [${requestId}] Historial guardado en ${historialTime}ms`);
        
        console.log(`📝 [${requestId}] Historial omitido para notificación web directa`);
        const historialTime = 0;

        const responseData = {
            success: true,
            mensaje: 'Notificación WEB enviada correctamente',
            data: {
                request_id: requestId,
                dispositivos_alcanzados: playerIds.length,
                onesignal_id: resultadoOneSignal?.id,
                recipients: resultadoOneSignal?.recipients || 0,
                url_enviada: url,
                timing: {
                    envio_onesignal: oneSignalTime,
                    // guardado_historial: historialTime, // Omitido para web directo
                    total: Date.now() - parseInt(requestId.split('_')[1])
                }
            }
        };

        console.log(`🎉 [${requestId}] Proceso WEB completado exitosamente`);
        res.json(responseData);

    } catch (error) {
        console.error(`❌ [${requestId}] Error en notificación WEB:`, {
            error_message: error.message,
            timestamp: new Date().toISOString(),
            request_body: req.body
        });

        res.status(500).json({ 
            error: 'Error interno del servidor', 
            message: error.message,
            request_id: requestId
        });
    }
}

}