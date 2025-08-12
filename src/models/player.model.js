import { db } from '../config/db.js';
const { pool } = db;

export async function guardarPlayerIdEnBD(usuarioId, playerId, plataforma = 'mobile') {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // ✅ Verificar si el player_id ya existe
        const checkQuery = `
            SELECT cve_usuarios, plataforma 
            FROM dispositivos_usuarios 
            WHERE player_id = $1
        `;
        const existingDevice = await client.query(checkQuery, [playerId]);
        
        let accion = 'creado';
        
        if (existingDevice.rows.length > 0) {
            const dispositivoExistente = existingDevice.rows[0];
            
            if (dispositivoExistente.cve_usuarios === usuarioId) {
                // ✅ Mismo usuario, actualizar plataforma si es diferente
                if (dispositivoExistente.plataforma !== plataforma) {
                    const updateQuery = `
                        UPDATE dispositivos_usuarios 
                        SET plataforma = $1, fecha_registro = CURRENT_TIMESTAMP
                        WHERE player_id = $2
                    `;
                    await client.query(updateQuery, [plataforma, playerId]);
                    accion = 'actualizado';
                } else {
                    accion = 'sin_cambios';
                }
            } else {
                // ✅ Diferente usuario, reasignar dispositivo
                const reassignQuery = `
                    UPDATE dispositivos_usuarios 
                    SET cve_usuarios = $1, plataforma = $2, fecha_registro = CURRENT_TIMESTAMP
                    WHERE player_id = $3
                `;
                await client.query(reassignQuery, [usuarioId, plataforma, playerId]);
                accion = 'reasignado';
            }
        } else {
            // ✅ Dispositivo nuevo
            const insertQuery = `
                INSERT INTO dispositivos_usuarios (cve_usuarios, player_id, plataforma, fecha_registro)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            `;
            await client.query(insertQuery, [usuarioId, playerId, plataforma]);
            accion = 'creado';
        }
        
        await client.query('COMMIT');
        
        console.log(`📱 [${new Date().toISOString()}] Dispositivo ${accion} - Usuario: ${usuarioId}, Player: ${playerId}, Plataforma: ${plataforma}`);
        
        return { 
            success: true, 
            accion,
            usuario_id: usuarioId,
            player_id: playerId,
            plataforma 
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en guardarPlayerIdEnBD:', error);
        throw error;
    } finally {
        client.release();
    }
}

// ✅ Función adicional para obtener dispositivos de un usuario
export async function obtenerDispositivosUsuario(usuarioId) {
    const query = `
        SELECT player_id, plataforma, fecha_registro
        FROM dispositivos_usuarios 
        WHERE cve_usuarios = $1
        ORDER BY fecha_registro DESC
    `;
    
    const result = await pool.query(query, [usuarioId]);
    return result.rows;
}

// ✅ Función para eliminar dispositivo
export async function eliminarDispositivo(usuarioId, playerId) {
    const query = `
        DELETE FROM dispositivos_usuarios 
        WHERE cve_usuarios = $1 AND player_id = $2
    `;
    
    const result = await pool.query(query, [usuarioId, playerId]);
    return result.rowCount > 0;
}