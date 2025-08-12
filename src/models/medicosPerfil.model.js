import { db } from '../config/db.js';
const { pool } = db;

export class MedicosPerfilModel {
    static async crear({ input }) {
        const {
            cve_pacientes,
            creado_por,
        } = input;

        const query = `
            INSERT INTO perfil_medico (
                cve_pacientes, creado_por
            )
            VALUES ($1, $2)
            RETURNING *;
        `;

        const values = [
            cve_pacientes,
            creado_por,
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
                SELECT * FROM perfil_medico WHERE cve_pacientes = $1`;
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
        
        // ✅ CORRECCIÓN: Sin espacios extra al inicio, query en una sola línea
        const query = `UPDATE perfil_medico SET ${setClause} WHERE cve_perfil_medico = $${fields.length + 1} RETURNING *`;

        // 3. Preparar los valores para el query
        const values = [...Object.values(input), Number(cve)];

        console.log('Ejecutando UPDATE:');
        console.log('Query:', query);
        console.log('Values:', values);

        // 4. Ejecutar el UPDATE
        const result = await pool.query(query, values);

        // 5. Verificar si se actualizó algún registro
        if (result.rowCount === 0) {
            console.log(`No se encontró perfil con CVE: ${cve}`);
            return null;
        }

        console.log(`Perfil con CVE ${cve} actualizado exitosamente`);
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
                            pm.*,
                            p.*
                        FROM
                            perfil_medico AS pm
                        INNER JOIN
                            pacientes AS pa ON pm.cve_paciente = pa.cve_pacientes
                        INNER JOIN
                            personas AS p ON pa.cve_pacientes = p.cve_personas; 
                            `;

            const { rows } = await pool.query(query); 
            return rows;
        } catch (error) {
            console.error("Error al obtener las especialidades de la base de datos:", error);
            throw new Error("No se pudieron obtener las especialidades.");
        }
    }

    
       // MÉTODO COMPLETAMENTE CORREGIDO: Obtener datos completos para PDF
static async getDatosCompletos(cve) {
    try {
        const query = `
            SELECT
                -- Datos completos del perfil médico
                pm.tipo_sangre,
                pm.peso,
                pm.altura,
                pm.imc,
                pm.presion_arterial_sistolica,
                pm.presion_arterial_diastolica,
                pm.alergias_medicamentos,
                pm.alergias_alimentos,
                pm.alergias_otras,
                pm.enfermedades_cronicas,
                pm.condiciones_especiales,
                pm.medicamentos_actuales,
                pm.cirugias_previas,
                pm.hospitalizaciones_recientes,
                pm.antecedentes_familiares,
                pm.motivo_consulta_frecuente,
                pm.especialista_habitual,
                pm.restricciones_especiales,
                pm.preferencias_horario,
                pm.contacto_emergencia,
                pm.telefono_emergencia,
                pm.condiciones_criticas,
                pm.notas_especiales,
                pm.observaciones_personal_medico,
                pm.fecha_ultima_actualizacion,

                -- Datos del paciente de la tabla personas
                p_paciente.nombre || ' ' || p_paciente.paterno || ' ' || p_paciente.materno AS nombre_paciente,
                p_paciente.email,
                p_paciente.telefonos AS telefono,
                p_paciente.sexo,
                p_paciente.fecha_nacimiento,
                pa.cve_pacientes

            FROM
                perfil_medico AS pm
            INNER JOIN
                pacientes AS pa ON pm.cve_pacientes = pa.cve_pacientes
            INNER JOIN
                personas AS p_paciente ON pa.cve_pacientes = p_paciente.cve_personas
            WHERE 
                pa.cve_pacientes = $1
        `;

        const { rows } = await pool.query(query, [cve]);
        
        if (rows.length === 0) {
            return null;
        }
        
        return rows[0];
    } catch (error) {
        console.error("Error al obtener datos completos del perfil médico:", error);
        throw new Error("No se pudieron obtener los datos completos del perfil médico.");
    }
}

// En tu modelo, por ejemplo pacientes.model.js o donde manejes pacientes
static async obtenerPlayerIdPorUsuario(cve_usuarios) {
    const query = `
        SELECT player_id
        FROM dispositivos_usuarios
        WHERE cve_usuarios = $1
        LIMIT 1;
    `;

    try {
        const result = await pool.query(query, [cve_usuarios]);
        if (result.rows.length === 0) return null;
        return result.rows[0].player_id;
    } catch (error) {
        console.error('Error obteniendo player_id:', error);
        throw error;
    }
}

}