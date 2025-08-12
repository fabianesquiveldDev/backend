import { db } from '../config/db.js';
const { pool } = db;

export class NotificacionesModel {
    
    // 📋 OBTENER TIPO DE NOTIFICACIÓN POR NOMBRE
    static async obtenerTipoPorNombre(nombre) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                `SELECT * FROM tipos_notificaciones 
                WHERE nombre = $1 AND activa = true`,
                [nombre]
            );
            
            return result.rows[0] || null;
            
        } catch (error) {
            console.error('❌ Error obteniendo tipo por nombre:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // 📋 OBTENER TODOS LOS TIPOS DE NOTIFICACIONES (Los 14)
    static async obtenerTodosLosTipos() {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                `SELECT cve_tipos_notificaciones, nombre, titulo_template, 
                        mensaje_template, categoria, descripcion, activa 
                FROM tipos_notificaciones 
                ORDER BY categoria, nombre`
            );
            
            return result.rows;
            
        } catch (error) {
            console.error('❌ Error obteniendo todos los tipos:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // 💾 CREAR NOTIFICACIÓN ENVIADA (Historial)
    static async crearNotificacionEnviada(datos) {
        const client = await pool.connect();
        
        try {
            const {
                cve_usuarios,
                cve_tipos_notificaciones,
                titulo_enviado,
                mensaje_enviado,
                player_ids_usados = [],
                estado = 'pendiente',
                onesignal_id = null,
                codigo_error = null,
                metadata = {}
            } = datos;

            const result = await client.query(
                `INSERT INTO notificaciones_enviadas 
                (cve_usuarios, cve_tipos_notificaciones, titulo_enviado, mensaje_enviado, 
                 player_ids_usados, estado, onesignal_id, codigo_error, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`,
                [
                    cve_usuarios,
                    cve_tipos_notificaciones, 
                    titulo_enviado,
                    mensaje_enviado,
                    JSON.stringify(player_ids_usados),
                    estado,
                    onesignal_id,
                    codigo_error,
                    JSON.stringify(metadata)
                ]
            );
            
            return result.rows[0];
            
        } catch (error) {
            console.error('❌ Error creando notificación enviada:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // 📊 OBTENER HISTORIAL DE UN USUARIO
    static async obtenerHistorialUsuario(cve_usuarios, limite = 20, pagina = 1) {
        const client = await pool.connect();
        
        try {
            const offset = (pagina - 1) * limite;
            
            const result = await client.query(
                `SELECT 
                    ne.cve_notificaciones_enviadas,
                    ne.titulo_enviado,
                    ne.mensaje_enviado,
                    ne.estado,
                    ne.fecha_envio,
                    ne.metadata,
                    tn.nombre as tipo_nombre,
                    tn.categoria
                FROM notificaciones_enviadas ne
                JOIN tipos_notificaciones tn ON ne.cve_tipos_notificaciones = tn.cve_tipos_notificaciones
                WHERE ne.cve_usuarios = $1
                ORDER BY ne.fecha_envio DESC
                LIMIT $2 OFFSET $3`,
                [cve_usuarios, limite, offset]
            );
            
            return result.rows;
            
        } catch (error) {
            console.error('❌ Error obteniendo historial usuario:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // 🔄 ACTUALIZAR ESTADO DE NOTIFICACIÓN
    static async actualizarEstadoNotificacion(cve_notificaciones_enviadas, estado, codigo_error = null) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                `UPDATE notificaciones_enviadas 
                SET estado = $1, codigo_error = $2
                WHERE cve_notificaciones_enviadas = $3
                RETURNING *`,
                [estado, codigo_error, cve_notificaciones_enviadas]
            );
            
            return result.rows[0];
            
        } catch (error) {
            console.error('❌ Error actualizando estado notificación:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // ⚙️ OBTENER CONFIGURACIÓN DE NOTIFICACIONES DE UN USUARIO
    static async obtenerConfiguracionUsuario(cve_usuarios) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                `SELECT 
                    tn.cve_tipos_notificaciones,
                    tn.nombre,
                    tn.titulo_template,
                    tn.categoria,
                    tn.descripcion,
                    COALESCE(cnu.activa, true) as activa
                FROM tipos_notificaciones tn
                LEFT JOIN configuracion_notificaciones_usuario cnu 
                    ON tn.cve_tipos_notificaciones = cnu.cve_tipos_notificaciones 
                    AND cnu.cve_usuarios = $1
                WHERE tn.activa = true
                ORDER BY tn.categoria, tn.nombre`,
                [cve_usuarios]
            );
            
            return result.rows;
            
        } catch (error) {
            console.error('❌ Error obteniendo configuración usuario:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // ⚙️ ACTUALIZAR CONFIGURACIÓN DE NOTIFICACIONES DE UN USUARIO
    static async actualizarConfiguracionUsuario(cve_usuarios, configuraciones) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Eliminar configuraciones existentes del usuario
            await client.query(
                `DELETE FROM configuracion_notificaciones_usuario 
                WHERE cve_usuarios = $1`,
                [cve_usuarios]
            );

            // Insertar nuevas configuraciones
            for (const config of configuraciones) {
                await client.query(
                    `INSERT INTO configuracion_notificaciones_usuario 
                    (cve_usuarios, cve_tipos_notificaciones, activa)
                    VALUES ($1, $2, $3)`,
                    [cve_usuarios, config.cve_tipos_notificaciones, config.activa]
                );
            }

            await client.query('COMMIT');
            return { success: true };
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error actualizando configuración usuario:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // 📈 OBTENER ESTADÍSTICAS BÁSICAS
    static async obtenerEstadisticas() {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                `SELECT 
                    COUNT(*) as total_enviadas,
                    COUNT(CASE WHEN estado = 'enviada' THEN 1 END) as exitosas,
                    COUNT(CASE WHEN estado = 'fallida' THEN 1 END) as fallidas,
                    COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes
                FROM notificaciones_enviadas 
                WHERE DATE(fecha_envio) = CURRENT_DATE`
            );
            
            return result.rows[0];
            
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // 🔍 OBTENER TIPOS POR CATEGORÍA
    static async obtenerTiposPorCategoria(categoria) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                `SELECT * FROM tipos_notificaciones 
                WHERE categoria = $1 AND activa = true
                ORDER BY nombre`,
                [categoria]
            );
            
            return result.rows;
            
        } catch (error) {
            console.error('❌ Error obteniendo tipos por categoría:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // ✅ VERIFICAR SI USUARIO ACEPTA TIPO DE NOTIFICACIÓN
    static async usuarioAceptaNotificacion(cve_usuarios, cve_tipos_notificaciones) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                `SELECT COALESCE(cnu.activa, true) as acepta
                FROM tipos_notificaciones tn
                LEFT JOIN configuracion_notificaciones_usuario cnu 
                    ON tn.cve_tipos_notificaciones = cnu.cve_tipos_notificaciones 
                    AND cnu.cve_usuarios = $1
                WHERE tn.cve_tipos_notificaciones = $2`,
                [cve_usuarios, cve_tipos_notificaciones]
            );
            
            return result.rows[0]?.acepta || true;
            
        } catch (error) {
            console.error('❌ Error verificando aceptación usuario:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // En tu modelo, por ejemplo pacientes.model.js o donde manejes pacientes
static async obtenerPlayerIdsPorUsuario(cve_usuarios) {
    const query = `
        SELECT cve_usuarios, player_id, plataforma
        FROM dispositivos_usuarios
        WHERE cve_usuarios = $1;
    `;

    try {
        const result = await pool.query(query, [cve_usuarios]);
        if (result.rows.length === 0) return [];
        
        // Retornar objetos completos, no solo strings
        return result.rows;
    } catch (error) {
        console.error('Error obteniendo dispositivos:', error);
        throw error;
    }
}
}