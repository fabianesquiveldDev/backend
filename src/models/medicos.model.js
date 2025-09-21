import { db } from '../config/db.js';
const { pool } = db;

export class MedicosModel {
    static async crear({ input }) {
        const {
            cve_medicos,
            cedulas_profesionales,
            fecha_ingreso,
            activo,
        } = input;

        const query = `
            INSERT INTO medicos (
                cve_medicos, cedulas_profesionales, fecha_ingreso,activo
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;

        const values = [
            cve_medicos,
            cedulas_profesionales,
            fecha_ingreso,
            activo,
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
            const query = `
SELECT
    m.cve_medicos,
    m.cedulas_profesionales,
    m.fecha_ingreso,
    m.activo AS medico_activo,
    COALESCE(STRING_AGG(e.nombre, ', ' ORDER BY e.nombre), '') AS especialidades_del_medico
FROM
    medicos AS m
LEFT JOIN
    medicos_especialidades AS me ON m.cve_medicos = me.cve_medicos
LEFT JOIN
    especialidades AS e ON me.cve_especialidad = e.cve_especialidad
WHERE
    m.cve_medicos =  $1 
GROUP BY
    m.cve_medicos,
    m.cedulas_profesionales,
    m.fecha_ingreso,
    m.activo
ORDER BY
    m.cve_medicos;`;
            const { rows } = await pool.query(query, [cve]);
            
            if (rows.length === 0) {
                return null; 
            }
            
            return rows[0];
        } catch (err) {
            console.error('Error al obtener medicos:', err);
            throw new Error('Error al buscar medicos en la base de datos');
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
                UPDATE medicos 
                SET ${setClause}
                WHERE cve_medicos = $${fields.length + 1}
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
                console.log(`No se encontró persona con CVE: ${cve}`);
                return null;
            }

            console.log(`paciente con CVE ${cve} actualizada exitosamente`);
            return result.rows[0];

        } catch (error) {
            console.error('Error ejecutando UPDATE en la base de datos:', error);
            throw error;
        }
    }

    static async getAll() { 
        try {

            const query = `
                        SELECT
                            p.cve_personas,
                            TRIM(CONCAT_WS(' ', p.nombre, p.paterno, p.materno)) AS nombre_completo_medico,
                            p.telefonos,
                            p.email,
                            m.fecha_ingreso,
                            m.cedulas_profesionales,
                            u.activo AS estado_activo_usuario
                        FROM
                            personas AS p
                        INNER JOIN
                            usuarios AS u ON p.cve_personas = u.cve_usuarios
                        INNER JOIN
                            medicos AS m ON m.cve_medicos = p.cve_personas
                        ORDER BY
                            nombre_completo_medico ASC; 
                            `;

            const { rows } = await pool.query(query); 
            return rows;
        } catch (error) {
            console.error("Error al obtener las especialidades de la base de datos:", error);
            throw new Error("No se pudieron obtener las especialidades.");
        }
    }

    static async getSucursal({ cve }) {
        try {
            const query = `
                SELECT
                    s.cve_sucursales,
                    s.nombre AS nombre_sucursal,
                    active_assignment.cve_medico_consultorio
                FROM
                    sucursales AS s
                INNER JOIN
                    consultorios AS c ON s.cve_sucursales = c.cve_sucursales
                INNER JOIN LATERAL (
                    SELECT
                        mc_sub.cve_medico_consultorio,
                        mc_sub.cve_consultorios
                    FROM
                        medicos_consultorios AS mc_sub
                    WHERE
                        mc_sub.cve_medicos = $1
                        AND mc_sub.cve_consultorios = c.cve_consultorios
                        AND mc_sub.activo = TRUE
                        AND (mc_sub.fecha_fin IS NULL OR mc_sub.fecha_fin >= CURRENT_DATE)
                    ORDER BY
                        mc_sub.cve_medico_consultorio ASC
                    LIMIT 1
                ) AS active_assignment ON c.cve_consultorios = active_assignment.cve_consultorios
                ORDER BY
                    s.nombre;
            `;
            const { rows } = await pool.query(query, [cve]);
            
            if (rows.length === 0) {
                return []; 
            }
            
            return rows;
        } catch (err) {
            console.error('Error al obtener sucursales del médico:', err);
            throw new Error('Error al buscar sucursales del médico en la base de datos');
        }
    }

    static async obtenerHorarioLaboral({ cve_medicos,cve_medico_consultorio, dia_semana }) {
        const query = `
            SELECT horario_inicio, horario_fin
            FROM horario_laboral
            WHERE cve_medicos = $1
            AND cve_dias = $3
            AND activo = true
            AND cve_medico_consultorio = $2
            LIMIT 1
        `;

        console.log('Obteniendo horario laboral con:', { cve_medicos, cve_medico_consultorio, dia_semana });
        const { rows } = await pool.query(query, [cve_medicos, cve_medico_consultorio, dia_semana]);
        console.log('horario_laboral rows:', rows);
        return rows[0] || null;
        }


    static async obtenerCveMedicoDesdeConsultorio(cve_medico_consultorio) {
        const query = `
            SELECT cve_medicos
            FROM medicos_consultorios
            WHERE cve_medico_consultorio = $1
        `;
        const { rows } = await pool.query(query, [cve_medico_consultorio]);
        return rows.length > 0 ? rows[0].cve_medicos : null;
    }

    static async obtenerEmailMedicos (cve_medicos){
        const query = `
        
        `;
        const { rows } = await pool.query(query, [cve_medicos]);
        return rows.length > 0 ? rows[0].cve_medicos : null;
    }

}