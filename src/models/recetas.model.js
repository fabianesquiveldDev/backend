import { db } from '../config/db.js';
const { pool } = db;

export class RecetasModel {
    
    // Crear nueva receta
    static async crear({ input }) {
        const {
            cve_citas,
            fecha_receta,
            indicaciones_generales,
            medicamentos,
            instrucciones_especificas,
            observaciones,
            proximo_control
        } = input;

        const query = `
            INSERT INTO recetas (
                cve_citas,
                fecha_receta,
                indicaciones_generales,
                medicamentos,
                instrucciones_especificas,
                observaciones,
                proximo_control
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;

        const values = [
            cve_citas,
            fecha_receta,
            indicaciones_generales,
            medicamentos,
            instrucciones_especificas,
            observaciones,
            proximo_control
        ];

        try {
            console.log('Query:', query);
            console.log('Values:', values);
            
            const { rows } = await pool.query(query, values);
            return rows[0];
        } catch (err) {
            console.error('Error completo:', err);
            console.error('Error message:', err.message);
            console.error('Error code:', err.code);
            throw err;
        }
    }

    // Obtener receta por ID
    static async getOne(cve) {
        try {
            const query = 'SELECT * FROM recetas WHERE cve_recetas = $1';
            const { rows } = await pool.query(query, [cve]);
            
            if (rows.length === 0) {
                return null; 
            }
            
            return rows[0];
        } catch (err) {
            console.error('Error al obtener la receta:', err);
            throw new Error('Error al buscar receta en la base de datos');
        }
    }

    // Actualizar receta
    static async update(cve, input) {
        try {
            // 1. Verificar que hay campos para actualizar
            const fields = Object.keys(input);
            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            // 2. Construir el query UPDATE dinámicamente
            const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
            
            const query = `
                UPDATE recetas 
                SET ${setClause}
                WHERE cve_recetas = $${fields.length + 1}
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
                console.log(`No se encontró receta con CVE: ${cve}`);
                return null;
            }

            console.log(`Receta con CVE ${cve} actualizada exitosamente`);
            return result.rows[0];

        } catch (error) {
            console.error('Error ejecutando UPDATE en la base de datos:', error);
            throw error;
        }
    }

    // Obtener todas las recetas - CORREGIDO
    static async getAll() { 
        try {
            const query = `
                SELECT 
                    r.*,
                    (p_medico.nombre || ' ' || p_medico.paterno || ' ' || p_medico.materno) AS nombre_medico,
                    (p_paciente.nombre || ' ' || p_paciente.paterno || ' ' || p_paciente.materno) AS nombre_paciente,
                    dc.fecha_hora_inicio AS fecha_hora_cita
                FROM recetas r
                INNER JOIN citas c ON r.cve_citas = c.cve_citas
                INNER JOIN disponibilidad_citas dc ON c.cve_disponibilidad = dc.cve_disponibilidad
                INNER JOIN medicos m ON c.cve_medicos = m.cve_medicos
                INNER JOIN personas p_medico ON m.cve_medicos = p_medico.cve_personas
                INNER JOIN pacientes pa ON c.cve_pacientes = pa.cve_pacientes
                INNER JOIN personas p_paciente ON pa.cve_pacientes = p_paciente.cve_personas
                ORDER BY r.fecha_receta DESC;
            `;

            const { rows } = await pool.query(query); 
            return rows;
        } catch (error) {
            console.error("Error al obtener las recetas de la base de datos:", error);
            throw new Error("No se pudieron obtener las recetas.");
        }
    }

    // Obtener recetas por cita - CORREGIDO
    static async getByCita(cveCita) {
        try {
            const query = `
                SELECT 
                    r.*,
                    (p_medico.nombre || ' ' || p_medico.paterno || ' ' || p_medico.materno) AS nombre_medico,
                    (p_paciente.nombre || ' ' || p_paciente.paterno || ' ' || p_paciente.materno) AS nombre_paciente,
                    dc.fecha_hora_inicio AS fecha_hora_cita
                FROM recetas r
                INNER JOIN citas c ON r.cve_citas = c.cve_citas
                INNER JOIN disponibilidad_citas dc ON c.cve_disponibilidad = dc.cve_disponibilidad
                INNER JOIN medicos m ON c.cve_medicos = m.cve_medicos
                INNER JOIN personas p_medico ON m.cve_medicos = p_medico.cve_personas
                INNER JOIN pacientes pa ON c.cve_pacientes = pa.cve_pacientes
                INNER JOIN personas p_paciente ON pa.cve_pacientes = p_paciente.cve_personas
                WHERE r.cve_citas = $1
                ORDER BY r.fecha_receta DESC;
            `;

            const { rows } = await pool.query(query, [cveCita]);
            return rows;
        } catch (error) {
            console.error("Error al obtener recetas por cita:", error);
            throw new Error("No se pudieron obtener las recetas de la cita.");
        }
    }

    // Obtener recetas por paciente - CORREGIDO
    static async getByPaciente(cvePaciente) {
        try {
            const query = `
                SELECT 
                    r.*,
                    (p_medico.nombre || ' ' || p_medico.paterno || ' ' || p_medico.materno) AS nombre_medico,
                    c.diagnostico,
                    dc.fecha_hora_inicio AS fecha_hora_cita
                FROM recetas r
                INNER JOIN citas c ON r.cve_citas = c.cve_citas
                INNER JOIN disponibilidad_citas dc ON c.cve_disponibilidad = dc.cve_disponibilidad
                INNER JOIN medicos m ON c.cve_medicos = m.cve_medicos
                INNER JOIN personas p_medico ON m.cve_medicos = p_medico.cve_personas
                WHERE c.cve_pacientes = $1
                ORDER BY r.fecha_receta DESC;
            `;

            const { rows } = await pool.query(query, [cvePaciente]);
            return rows;
        } catch (error) {
            console.error("Error al obtener recetas por paciente:", error);
            throw new Error("No se pudieron obtener las recetas del paciente.");
        }
    }

    // Obtener recetas por médico - CORREGIDO
    static async getByMedico(cveMedico) {
        try {
            const query = `
                SELECT 
                    r.*,
                    (p_paciente.nombre || ' ' || p_paciente.paterno || ' ' || p_paciente.materno) AS nombre_paciente,
                    c.diagnostico,
                    dc.fecha_hora_inicio AS fecha_hora_cita
                FROM recetas r
                INNER JOIN citas c ON r.cve_citas = c.cve_citas
                INNER JOIN disponibilidad_citas dc ON c.cve_disponibilidad = dc.cve_disponibilidad
                INNER JOIN pacientes pa ON c.cve_pacientes = pa.cve_pacientes
                INNER JOIN personas p_paciente ON pa.cve_pacientes = p_paciente.cve_personas
                WHERE c.cve_medicos = $1
                ORDER BY r.fecha_receta DESC;
            `;

            const { rows } = await pool.query(query, [cveMedico]);
            return rows;
        } catch (error) {
            console.error("Error al obtener recetas por médico:", error);
            throw new Error("No se pudieron obtener las recetas del médico.");
        }
    }

    // MÉTODO COMPLETAMENTE CORREGIDO: Obtener datos completos para PDF
    static async getDatosCompletos(cve) {
    try {
        const query = `
            SELECT 
                r.*,
                cit.diagnostico,
                cit.notas as notas_cita,
                dc.fecha_hora_inicio AS fecha_hora_cita,
                
                -- Datos del paciente
                (p_paciente.nombre || ' ' || p_paciente.paterno || ' ' || p_paciente.materno) AS nombre_paciente,
                p_paciente.telefonos,
                p_paciente.fecha_nacimiento,
                p_paciente.sexo,
                p_paciente.email,
                
                -- Datos del médico
                (p_medico.nombre || ' ' || p_medico.paterno || ' ' || p_medico.materno) AS nombre_medico,
                m.cedulas_profesionales,
                p_medico.telefonos as telefono_medico,
                p_medico.email as email_medico,
                
                -- Datos del consultorio
                cons.nombre as nombre_consultorio,
                cons.numero as numero_consultorio,
                s.nombre as nombre_sucursal,
                ciudad.nombre as ciudad,
                est.nombre as estado
                
            FROM recetas r
            INNER JOIN citas cit ON r.cve_citas = cit.cve_citas
            INNER JOIN disponibilidad_citas dc ON cit.cve_disponibilidad = dc.cve_disponibilidad
            INNER JOIN medicos m ON cit.cve_medicos = m.cve_medicos
            INNER JOIN personas p_medico ON m.cve_medicos = p_medico.cve_personas
            INNER JOIN pacientes pa ON cit.cve_pacientes = pa.cve_pacientes
            INNER JOIN personas p_paciente ON pa.cve_pacientes = p_paciente.cve_personas
            INNER JOIN medicos_consultorios mc ON cit.cve_medico_consultorio = mc.cve_medico_consultorio
            INNER JOIN consultorios cons ON mc.cve_consultorios = cons.cve_consultorios
            INNER JOIN sucursales s ON cons.cve_sucursales = s.cve_sucursales
            INNER JOIN ciudades ciudad ON s.cve_ciudades = ciudad.cve_ciudades AND s.cve_estados = ciudad.cve_estados
            INNER JOIN estados est ON s.cve_estados = est.cve_estados
            WHERE r.cve_recetas = $1;
        `;

        const { rows } = await pool.query(query, [cve]);
        
        if (rows.length === 0) {
            return null;
        }
        
        return rows[0];
    } catch (error) {
        console.error("Error al obtener datos completos de receta:", error);
        throw new Error("No se pudieron obtener los datos completos de la receta.");
    }
}
}