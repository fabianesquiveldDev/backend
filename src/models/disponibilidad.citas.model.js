import { db } from '../config/db.js';
const { pool } = db;

export class DisponibilidadCitasModel {
    static async crear({ input }) {
        const {   
            cve_medico_consultorio,
            fecha_hora_inicio,
            duracion_minutos,
            ocupado,
            cancelado,
            nota
        } = input;

        const query = `
            INSERT INTO disponibilidad_citas (
                cve_medico_consultorio,fecha_hora_inicio,duracion_minutos,ocupado,cancelado,nota
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;

        const values = [
            cve_medico_consultorio,
            fecha_hora_inicio,
            duracion_minutos,
            ocupado,
            cancelado,
            nota
        ];

        try {
            console.log('Query:', query); // Debug
            console.log('Values:', values); // Debug
            
            const { rows } = await pool.query(query, values);
            return rows[0];
        } catch (err) {
            console.error('Error completo:', err); // Ver error completo
            console.error('Error message:', err.message); // Ver mensaje específico
            console.error('Error code:', err.code); // Ver código de error
            throw err; // Lanzar el error original, no uno genérico
        }
    }

    static async getOne({ cve }) {
        try {
            const query = 'SELECT * FROM disponibilidad_citas WHERE cve_medico_consultorio = $1';
            const { rows } = await pool.query(query, [cve]);
            
            return rows;
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
                UPDATE disponibilidad_citas
                SET ${setClause}
                WHERE cve_disponibilidad = $${fields.length + 1}
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
                console.log(`No se encontró la disponibilidad con CVE: ${cve}`);
                return null;
            }

            console.log(`la disponibilidad con CVE ${cve} actualizada exitosamente`);
            return result.rows[0];

        } catch (error) {
            console.error('Error ejecutando UPDATE en la base de datos:', error);
            throw error;
        }
    }

    static async getAll() { 
        try {

            const query = `
                
                            `;

            const { rows } = await pool.query(query); 
            return rows;
        } catch (error) {
            console.error("Error al obtener las especialidades de la base de datos:", error);
            throw new Error("No se pudieron obtener las especialidades.");
        }
    }

    static async verificarSolapamiento({ cve_medico_consultorio, fecha_hora_inicio, duracion_minutos }) {
    // Calcula fecha fin en SQL usando INTERVAL
    const query = `
        SELECT 1
        FROM disponibilidad_citas
        WHERE cve_medico_consultorio = $1
            AND (
                fecha_hora_inicio < ($2::timestamp + ($3 || ' minutes')::interval)
                AND (fecha_hora_inicio + (duracion_minutos || ' minutes')::interval) > $2::timestamp
            )
        LIMIT 1
    `;

    const values = [cve_medico_consultorio, fecha_hora_inicio, duracion_minutos];

    const { rowCount } = await pool.query(query, values);
    return rowCount > 0;
    }

    static async eliminarSiNoEstaOcupada(cve_disponibilidad) {
        const query = `
            DELETE FROM disponibilidad_citas
            WHERE cve_disponibilidad = $1 AND ocupado = false
            RETURNING *;
        `;

        const { rows } = await pool.query(query, [cve_disponibilidad]);
        return rows[0] || null; // Devuelve null si no se eliminó (porque estaba ocupada o no existía)
    }

static async obtenerDatos(cve_disponibilidad) {
    try {
        const query = `
            SELECT
                CONCAT(p.nombre, ' ', p.paterno, ' ', p.materno) AS NombreCompletoMedico,
                m.cve_medicos,
                p.email AS email,
                pi.nombre AS NombrePiso,
                co.nombre AS NombreConsultorio,
                co.numero AS NumeroConsultorio,
                s.nombre AS NombreSucursal,
                da.motivoconsulta AS MotivoCita,
                da.fecha_hora_inicio,
                duracion_minutos
            FROM DISPONIBILIDAD_CITAS da
            JOIN MEDICOS_CONSULTORIOS mc ON da.cve_medico_consultorio = mc.cve_medico_consultorio
            JOIN MEDICOS m ON mc.cve_medicos = m.cve_medicos
            JOIN PERSONAS p ON m.cve_medicos = p.cve_personas
            JOIN CONSULTORIOS co ON mc.cve_consultorios = co.cve_consultorios
            JOIN PISOS pi ON co.cve_pisos = pi.cve_pisos
            JOIN SUCURSALES s ON co.cve_sucursales = s.cve_sucursales
            WHERE da.cve_disponibilidad = $1;
        `;
        const { rows } = await pool.query(query, [cve_disponibilidad]);

        return rows[0] || null; // Retorna solo un objeto o null si no existe
    } catch (err) {
        console.error('Error al obtener la disponibilidad:', err);
        throw new Error('Error al buscar disponibilidad en la base de datos');
    }
}


}