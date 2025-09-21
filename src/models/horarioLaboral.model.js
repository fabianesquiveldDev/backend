import { db } from '../config/db.js';
const { pool } = db;

export class HorarioLaboralModel {
static async getOne({ cve }) { // Asumo que 'cve' aquí es cve_medico_consultorio
    try {
        const query = `
            SELECT
    d.cve_dias,
    d.nombre AS nombre_dia,
    hl.cve_horario_laboral,
    hl.cve_medicos, 
    hl.horario_inicio,
    hl.horario_fin,
    COALESCE(hl.activo, FALSE) AS horario_esta_activo,
    -- Verificación si el médico tiene este día asignado en otra sucursal (activo)
    EXISTS (
        SELECT 1 
        FROM horario_laboral hl2
        JOIN medicos_consultorios mc2 ON hl2.cve_medico_consultorio = mc2.cve_medico_consultorio
        JOIN consultorios c2 ON mc2.cve_consultorios = c2.cve_consultorios
        WHERE hl2.cve_dias = d.cve_dias
          AND hl2.cve_medicos = (SELECT cve_medicos FROM medicos_consultorios WHERE cve_medico_consultorio = $1)
          AND mc2.cve_medico_consultorio != $1
          AND c2.cve_sucursales != (SELECT c.cve_sucursales 
                                   FROM consultorios c
                                   JOIN medicos_consultorios mc ON c.cve_consultorios = mc.cve_consultorios
                                   WHERE mc.cve_medico_consultorio = $1)
          AND hl2.activo = TRUE
    ) AS dia_ocupado_en_otra_sucursal,
    -- Devuelve siempre el cve_medico_consultorio solicitado para referencia
    $1 AS cve_medico_consultorio_consultado
FROM
    dias AS d
LEFT JOIN
    horario_laboral AS hl 
    ON d.cve_dias = hl.cve_dias 
    AND hl.cve_medico_consultorio = $1
ORDER BY
    CASE d.nombre 
        WHEN 'Lunes' THEN 1
        WHEN 'Martes' THEN 2
        WHEN 'Miércoles' THEN 3
        WHEN 'Jueves' THEN 4
        WHEN 'Viernes' THEN 5
        WHEN 'Sábado' THEN 6
        WHEN 'Domingo' THEN 7
        ELSE 8 
    END ASC;
        `;
        const { rows } = await pool.query(query, [cve]);

        // Con esta nueva consulta, 'rows' SIEMPRE tendrá 7 registros (uno por día),
        // incluso si HORARIO_LABORAL está vacío para ese cve_medico_consultorio.
        // Por lo tanto, no necesitamos la lógica de mock data aquí, ya que la DB la proporciona.
        return rows;

    } catch (err) {
        console.error('Error al obtener la horarioLaboral:', err);
        throw new Error('Error al buscar horarioLaboral en la base de datos');
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
                UPDATE especialidades 
                SET ${setClause}
                WHERE cve_especialidad = $${fields.length + 1}
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
                console.log(`No se encontró especialidades con CVE: ${cve}`);
                return null;
            }

            console.log(`especialidades con CVE ${cve} actualizada exitosamente`);
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

    static async getAllDias() { 
        try {

            const query = `
                        SELECT * FROM dias
                            `;

            const { rows } = await pool.query(query); 
            return rows;
        } catch (error) {
            console.error("Error al obtener los dias de la base de datos:", error);
            throw new Error("No se pudieron obtener los dias.");
        }
    }

    static async upsert({
        cve_medicos,
        cve_dias,
        cve_medico_consultorio,
        horario_inicio,
        horario_fin,
        activo
    }) {
        const query = `
        INSERT INTO HORARIO_LABORAL (
            cve_medicos,
            cve_dias,
            cve_medico_consultorio,
            horario_inicio,
            horario_fin,
            activo
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (cve_medicos, cve_dias, cve_medico_consultorio)
        DO UPDATE SET
            horario_inicio = EXCLUDED.horario_inicio,
            horario_fin = EXCLUDED.horario_fin,
            activo = EXCLUDED.activo
        RETURNING *;
        `;

        const values = [
        cve_medicos,
        cve_dias,
        cve_medico_consultorio,
        horario_inicio,
        horario_fin,
        activo
        ];

        try {
        const result = await pool.query(query, values);
        return result.rows[0];
        } catch (error) {
        console.error('Error al hacer upsert en HORARIO_LABORAL:', error);
        throw error;
        }
    }
}
