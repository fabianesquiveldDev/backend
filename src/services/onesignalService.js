import { config } from "dotenv";
config();

import axios from 'axios';
// ✅ CORREGIDO: Import consistente de DB
import { db } from '../config/db.js';
const { pool } = db;

const ONE_SIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

// ✅ FUNCIÓN PRINCIPAL - Enviar notificaciones push (MEJORADA para Electron)
export async function sendPushNotification({ title, message, playerIds, data = null }) {
    try {
        const payload = {
            app_id: ONESIGNAL_APP_ID,
            include_player_ids: playerIds, // array de player IDs
            headings: { en: title },
            contents: { en: message },
            // ✅ NUEVO: Configuración específica para Electron
            web_push_topic: ONESIGNAL_APP_ID,
            // ✅ NUEVO: Data personalizada (opcional)
            ...(data && { data }),
            // ✅ NUEVO: Configuración de sonido y badge
            chrome_web_badge: '/assets/badge-icon.png',
            chrome_web_icon: '/assets/notification-icon.png',
            // ✅ NUEVO: TTL (tiempo de vida de la notificación)
            ttl: 86400, // 24 horas
        };

        console.log('🚀 Enviando notificación a player_ids:', playerIds);
        
        const response = await axios.post(ONE_SIGNAL_API_URL, payload, {
            headers: {
                Authorization: `Basic ${ONESIGNAL_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('✅ Notificación enviada exitosamente:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ Error al enviar notificación:', error.response?.data || error.message);
        throw error;
    }
}

// ✅ NUEVA FUNCIÓN - Registrar dispositivo Electron específicamente
export async function registrarDispositivoElectron(cve_usuarios, playerId) {
    const client = await pool.connect();
    
    try {
        // Verificar si ya existe este player_id para este usuario
        const existing = await client.query(
            `SELECT cve_dispositivos_usuarios FROM dispositivos_usuarios 
            WHERE cve_usuarios = $1 AND player_id = $2`,
            [cve_usuarios, playerId]
        );

        if (existing.rows.length > 0) {
            // Actualizar fecha de último uso
            await client.query(
                `UPDATE dispositivos_usuarios 
                SET fecha_registro = CURRENT_TIMESTAMP,
                    plataforma = 'electron'
                WHERE cve_usuarios = $1 AND player_id = $2`,
                [cve_usuarios, playerId]
            );
            console.log('📱 Dispositivo Electron actualizado para usuario:', cve_usuarios);
        } else {
            // Registrar nuevo dispositivo
            await client.query(
                `INSERT INTO dispositivos_usuarios (cve_usuarios, player_id, plataforma, fecha_registro)
                VALUES ($1, $2, 'electron', CURRENT_TIMESTAMP)`,
                [cve_usuarios, playerId]
            );
            console.log('✅ Nuevo dispositivo Electron registrado para usuario:', cve_usuarios);
        }
        
        return { success: true, playerId };
        
    } catch (error) {
        console.error('❌ Error registrando dispositivo Electron:', error);
        throw error;
    } finally {
        client.release();
    }
}

// ✅ FUNCIÓN EXISTENTE - Obtener todos los player_ids de un usuario
export async function obtenerPlayerIdsPorUsuario(cve_usuarios) {
    const client = await pool.connect();
    
    try {
        const result = await client.query(
            `SELECT player_id, plataforma, fecha_registro 
            FROM dispositivos_usuarios 
            WHERE cve_usuarios = $1 AND player_id IS NOT NULL 
            ORDER BY fecha_registro DESC`,
            [cve_usuarios]
        );
        
        return result.rows;
        
    } catch (error) {
        console.error('❌ Error obteniendo player_ids del usuario:', error);
        throw error;
    } finally {
        client.release();
    }
}

// ✅ FUNCIÓN EXISTENTE - Obtener player_ids de múltiples usuarios
export async function obtenerPlayerIdsPorUsuarios(arrayUsuarios) {
    const client = await pool.connect();
    
    try {
        const result = await client.query(
            `SELECT DISTINCT player_id 
            FROM dispositivos_usuarios 
            WHERE cve_usuarios = ANY($1) AND player_id IS NOT NULL`,
            [arrayUsuarios]
        );
        
        return result.rows.map(row => row.player_id);
        
    } catch (error) {
        console.error('❌ Error obteniendo player_ids de usuarios:', error);
        throw error;
    } finally {
        client.release();
    }
}

// ✅ NUEVA FUNCIÓN - Notificación específica para Electron con datos personalizados
export async function sendElectronNotification({ 
    cve_usuarios, 
    title, 
    message, 
    actionData = null,
    priority = 'normal' 
}) {
    try {
        // Obtener player_ids del usuario
        const devices = await obtenerPlayerIdsPorUsuario(cve_usuarios);
        const playerIds = devices.map(device => device.player_id);
        
        if (playerIds.length === 0) {
            console.log('⚠️ No hay dispositivos registrados para usuario:', cve_usuarios);
            return { success: false, message: 'No hay dispositivos registrados' };
        }

        // Enviar notificación con datos personalizados
        const result = await sendPushNotification({
            title,
            message,
            playerIds,
            data: {
                userId: cve_usuarios,
                priority,
                timestamp: Date.now(),
                ...actionData
            }
        });

        return { success: true, result, devicesNotified: playerIds.length };
        
    } catch (error) {
        console.error('❌ Error enviando notificación Electron:', error);
        throw error;
    }
}

// ✅ FUNCIÓN EXISTENTE - Limpiar dispositivos inactivos (MEJORADA)
export async function limpiarDispositivosInactivos(diasInactividad = 30) {
    const client = await pool.connect();
    
    try {
        const result = await client.query(
            `DELETE FROM dispositivos_usuarios 
            WHERE fecha_registro < CURRENT_DATE - INTERVAL '${diasInactividad} days'`
        );
        
        console.log(`🧹 Se eliminaron ${result.rowCount} dispositivos inactivos`);
        return { eliminados: result.rowCount };
        
    } catch (error) {
        console.error('❌ Error limpiando dispositivos inactivos:', error);
        throw error;
    } finally {
        client.release();
    }
}

// ✅ NUEVA FUNCIÓN - Obtener estadísticas de dispositivos
export async function obtenerEstadisticasDispositivos() {
    const client = await pool.connect();
    
    try {
        const result = await client.query(
            `SELECT 
                plataforma,
                COUNT(*) as total,
                COUNT(CASE WHEN fecha_registro > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as activos_7_dias,
                COUNT(CASE WHEN fecha_registro > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as activos_30_dias
            FROM dispositivos_usuarios 
            WHERE player_id IS NOT NULL
            GROUP BY plataforma
            ORDER BY total DESC`
        );
        
        return result.rows;
        
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        throw error;
    } finally {
        client.release();
    }
}


// ✅ FUNCIÓN SIMPLE PARA WEB - Notificaciones Push Web
export async function sendPushNotificationWeb(title, message, playerIds, url = null) {
    try {
        const payload = {
            app_id: ONESIGNAL_APP_ID,
            include_player_ids: playerIds,
            headings: { en: title },
            contents: { en: message },
            web_url: url,
            chrome_web_icon: '/assets/icon-192x192.png',
            chrome_web_badge: '/assets/badge-72x72.png',
            ttl: 86400
        };

        const response = await axios.post(ONE_SIGNAL_API_URL, payload, {
            headers: {
                Authorization: `Basic ${ONESIGNAL_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('✅ Notificación WEB enviada:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ Error enviando notificación WEB:', error.response?.data || error.message);
        throw error;
    }
}