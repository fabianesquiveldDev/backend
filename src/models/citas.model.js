import { db } from '../config/db.js';
const { pool } = db;

export class CitasModel {
    static async crear({ input }) {
        const {   
            cve_medicos,
            cve_pacientes,
            cve_disponibilidad,
            cve_medico_consultorio,
            es_para_familiar,
            nombre_familiar
        } = input;

        const query = `
            INSERT INTO citas (
                cve_medicos,cve_pacientes,cve_disponibilidad,cve_medico_consultorio,
                es_para_familiar,nombre_familiar
            )
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING *;
        `;

        const values = [
            cve_medicos,
            cve_pacientes,
            cve_disponibilidad,
            cve_medico_consultorio,
            es_para_familiar,
            nombre_familiar
        ];

        try {
            console.log('Query:', query); // Debug
            console.log('Values:', values); // Debug
            
            const { rows } = await pool.query(query, values);
            return rows;
        } catch (err) {
            console.error('Error completo:', err); // Ver error completo
            console.error('Error message:', err.message); // Ver mensaje específico
            console.error('Error code:', err.code); // Ver código de error
            throw err; // Lanzar el error original, no uno genérico
        }
    }

    static async getOne({ cve }) {
        try {
            const query = 'SELECT * FROM especialidades WHERE cve_especialidad = $1';
            const { rows } = await pool.query(query, [cve]);
            
            if (rows.length === 0) {
                return null; 
            }
            
            return rows[0];
        } catch (err) {
            console.error('Error al obtener la especialidad:', err);
            throw new Error('Error al buscar especialidad en la base de datos');
        }
    }

    static async update({ cve, input }) {
        try {
            // 1. Verificar que hay campos para actualizar
            const fields = Object.keys(input);
            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            // 2. Construir el query UPDATE dinámicamente
            const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
            
            const query = `
                UPDATE citas 
                SET ${setClause}
                WHERE cve_citas = $${fields.length + 1}
                RETURNING *;
            `;

            // 3. Preparar los valores para el query
            const values = [...Object.values(input), Number(cve)];

            console.log('Ejecutando UPDATE:');
            console.log('Query:', query);
            console.log('Values:', values);

            // 4. Ejecutar el UPDATE
            const result = await pool.query(query, values);

            // 5. Verificar si se actualizó algún registro
            if (result.rowCount === 0) {
                console.log(`No se encontró citas con CVE: ${cve}`);
                return null;
            }

            console.log(`citas con CVE ${cve} actualizada exitosamente`);
            return result.rows[0];

        } catch (error) {
            console.error('Error ejecutando UPDATE en la base de datos:', error);
            throw error;
        }
    }

    static async getAll() { 
        try {

            const query = `
                        select cve_especialidad, nombre as nombreespecialidades
                        from especialidades
                            `;

            const { rows } = await pool.query(query); 
            return rows;
        } catch (error) {
            console.error("Error al obtener las especialidades de la base de datos:", error);
            throw new Error("No se pudieron obtener las especialidades.");
        }
    }

     // Reemplaza estos métodos en tu CitasModel

    static async obtenerConGoogleEventId(cveCita) {
        try {
            const query = `
                SELECT 
                    c.*,
                    d.fecha_hora_inicio,
                    d.duracion_minutos,
                    (d.fecha_hora_inicio + (d.duracion_minutos * INTERVAL '1 minute')) AS fecha_hora_fin
                FROM 
                    citas c
                INNER JOIN 
                    disponibilidad_citas d ON c.cve_disponibilidad = d.cve_disponibilidad
                WHERE 
                    c.cve_citas = $1;
            `;
            const values = [cveCita];
            const result = await pool.query(query, values);
            
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ Error obteniendo cita:', error);
            throw error;
        }
    }

    static async cancelar(cveCita) { 
    try {
        const query = `
            UPDATE citas 
            SET cancelada = true
            WHERE cve_citas = $1 AND cancelada = false
            RETURNING *;
        `;
        const values = [cveCita];
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            console.log(`⚠️ No se encontró cita ${cveCita} o ya estaba cancelada`);
            return null;
        }
        
        console.log(`✅ Cita ${cveCita} marcada como cancelada en BD`);
        return result.rows[0];
    } catch (error) {
        console.error('❌ Error cancelando cita en BD:', error);
        throw error;
    }
}

    static async actualizarGoogleEventId(cveCita, googleEventId) {
        try {
            const query = `
                UPDATE citas 
                SET google_event_id = $1 
                WHERE cve_citas = $2 AND cancelada = false
                RETURNING *;
            `;
            const values = [googleEventId, cveCita];
            const result = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error('Cita no encontrada o ya cancelada');
            }
            
            console.log(`✅ Google Event ID actualizado para cita ${cveCita}: ${googleEventId}`);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Error actualizando Google Event ID:', error);
            throw error;
        }
    }

    // Método adicional para obtener citas activas
    static async obtenerCitasActivas(filtros = {}) {
        try {
            let query = `
                SELECT 
                    c.*,
                    d.fecha_hora_inicio,
                    d.fecha_hora_fin,
                    d.duracion_minutos
                FROM citas c
                LEFT JOIN disponibilidad_citas d ON c.cve_disponibilidad = d.cve_disponibilidad
                WHERE c.cancelada = false
            `;
            
            const values = [];
            let paramIndex = 1;

            if (filtros.fechaDesde) {
                query += ` AND d.fecha_hora_inicio >= $${paramIndex}`;
                values.push(filtros.fechaDesde);
                paramIndex++;
            }

            if (filtros.fechaHasta) {
                query += ` AND d.fecha_hora_inicio <= $${paramIndex}`;
                values.push(filtros.fechaHasta);
                paramIndex++;
            }

            query += ` ORDER BY d.fecha_hora_inicio ASC`;

            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('❌ Error obteniendo citas activas:', error);
            throw error;
        }
    }


    static async getCitasPacientes({cve}) { 
        try {

            const query = `
                SELECT
                    c.*,
                    s.cve_sucursales,
                    s.nombre AS nombre_sucursal,
                    co.cve_consultorios,
                    co.nombre AS nombre_consultorio,
                    (p_medico.nombre || ' ' || p_medico.paterno || ' ' || p_medico.materno) AS nombre_medico,
                    (p_paciente.nombre || ' ' || p_paciente.paterno || ' ' || p_paciente.materno) AS nombre_paciente,
                    dc.fecha_hora_inicio AS fecha_hora_cita_disponible,
                    dc.duracion_minutos
                FROM
                    CITAS AS c
                INNER JOIN
                    DISPONIBILIDAD_CITAS AS dc ON c.cve_disponibilidad = dc.cve_disponibilidad
                INNER JOIN
                    medicos_consultorios AS mc ON dc.cve_medico_consultorio = mc.cve_medico_consultorio
                INNER JOIN
                    medicos AS m ON mc.cve_medicos = m.cve_medicos
                INNER JOIN
                    personas AS p_medico ON m.cve_medicos = p_medico.cve_personas
                INNER JOIN
                    consultorios AS co ON mc.cve_consultorios = co.cve_consultorios
                INNER JOIN
                    sucursales AS s ON co.cve_sucursales = s.cve_sucursales
                INNER JOIN
                    pacientes AS pa ON c.cve_pacientes = pa.cve_pacientes
                INNER JOIN
                    personas AS p_paciente ON pa.cve_pacientes = p_paciente.cve_personas -- ¡CORREGIDO AQUÍ!
                WHERE
                    c.cve_pacientes = $1
                ORDER BY
                    dc.fecha_hora_inicio DESC;

            `;

            const { rows } = await pool.query(query, [cve]); 
            return rows;
        } catch (error) {
            console.error("Error al obtener las citas del pacinte de la base de datos:", error);
            throw new Error("No se pudieron obtener las citas del pacinte.");
        }

    
    
    }

    static async contarNoShows({ cve }) {
    try {
        const query = `
            SELECT COUNT(*) as total
            FROM CITAS 
            WHERE cve_pacientes = $1 
            AND no_show = TRUE
        `;
        
        const { rows } = await pool.query(query, [cve]);
        return parseInt(rows[0].total);
        
    } catch (error) {
        console.error("Error al contar No-Shows:", error);
        throw new Error("No se pudieron contar los No-Shows.");
    }
}



    static async getCitasMedicos({ cveMedic, cveSucursales }) { 
    try {
        const query = `
            SELECT
    c.*,
    s.cve_sucursales,
    s.nombre AS nombre_sucursal,
    co.cve_consultorios,
    co.nombre AS nombre_consultorio,
    (p_medico.nombre || ' ' || p_medico.paterno || ' ' || p_medico.materno) AS nombre_medico,
    (p_paciente.nombre || ' ' || p_paciente.paterno || ' ' || p_paciente.materno) AS nombre_paciente,
    dc.fecha_hora_inicio AS fecha_hora_cita_disponible,
    dc.duracion_minutos,
    mc.cve_consultorios,
    CASE
        WHEN r.cve_recetas IS NOT NULL THEN r.cve_recetas
        ELSE NULL
    END AS cve_recetas_asociada
FROM
    CITAS AS c
INNER JOIN
    DISPONIBILIDAD_CITAS AS dc ON c.cve_disponibilidad = dc.cve_disponibilidad
INNER JOIN
    medicos_consultorios AS mc ON dc.cve_medico_consultorio = mc.cve_medico_consultorio
INNER JOIN
    medicos AS m ON mc.cve_medicos = m.cve_medicos
INNER JOIN
    personas AS p_medico ON m.cve_medicos = p_medico.cve_personas
INNER JOIN
    consultorios AS co ON mc.cve_consultorios = co.cve_consultorios
INNER JOIN
    sucursales AS s ON co.cve_sucursales = s.cve_sucursales
INNER JOIN
    pacientes AS pa ON c.cve_pacientes = pa.cve_pacientes
INNER JOIN
    personas AS p_paciente ON pa.cve_pacientes = p_paciente.cve_personas
LEFT JOIN
    recetas AS r ON c.cve_citas = r.cve_citas
WHERE
    c.cve_medicos = $1 AND s.cve_sucursales = $2
ORDER BY
    dc.fecha_hora_inicio DESC;
        `;

        // ✅ Pasar los dos valores en el arreglo
        const { rows } = await pool.query(query, [cveMedic, cveSucursales]); 
        return rows;

    } catch (error) {
        console.error("Error al obtener las citas del médico de la base de datos:", error);
        throw new Error("No se pudieron obtener las citas del paciente.");
    }
}

    static async cancelar(cveCita, motivo_cancelacion) { 
    try {
        const query = `
            UPDATE citas 
            SET cancelada = true,
                motivo_cancelacion = $2
            WHERE cve_citas = $1 AND cancelada = false
            RETURNING *;

        `;
        const values = [cveCita, motivo_cancelacion];
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            console.log(`⚠️ No se encontró cita ${cveCita} o ya estaba cancelada`);
            return null;
        }
        
        console.log(`✅ Cita ${cveCita} marcada como cancelada en BD con motivo`);
        return result.rows[0];
    } catch (error) {
        console.error('❌ Error cancelando cita en BD:', error);
        throw error;
    }
}
static async getCitasParaRecordatorio() {
    const query = `
        SELECT
            c.cve_pacientes,
            dc.fecha_hora_inicio
        FROM
            citas AS c
        INNER JOIN
            disponibilidad_citas AS dc
            ON c.cve_disponibilidad = dc.cve_disponibilidad
        WHERE
            dc.fecha_hora_inicio >= NOW() + INTERVAL '18 hours'
            AND dc.fecha_hora_inicio < NOW() + INTERVAL '30 hours'
            AND c.cancelada = FALSE
            AND c.atendida = FALSE
    `;

    const result = await pool.query(query);
    return result.rows;
}

    static async obtenerTodosPlayerIdsMoviles() {
    const query = `
        SELECT player_id, cve_usuarios
        FROM dispositivos_usuarios
        WHERE player_id IS NOT NULL
        AND plataforma = 'mobile'
    `;
    const result = await pool.query(query);
    return result.rows; // devuelve array de { cve_usuarios, player_id }
}

}
