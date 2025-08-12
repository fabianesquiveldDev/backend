    // src/models/asignaciones.model.js
    import { db } from '../config/db.js';
    const { pool } = db;

    export class AsignacionesModel {
        
      // UPSERT: crea o actualiza una asignación
// UPSERT: crea o actualiza una asignación
static async upsert({ cve_pacientes, cve_medicos, fecha_inicio }) {
    try {
        const query = `
            INSERT INTO asignaciones_medico_paciente (
                cve_pacientes, cve_medicos, fecha_inicio, activo
            )
            VALUES ($1, $2, $3, true)
            ON CONFLICT (cve_pacientes, cve_medicos)
            DO UPDATE SET 
                activo = true
            RETURNING *;
        `;
        
        const { rows } = await pool.query(query, [
            cve_pacientes,
            cve_medicos,
            fecha_inicio || new Date()
        ]);
        
        return rows[0];
    } catch (error) {
        console.error("Error en UPSERT de asignaciones:", error);
        throw new Error("No se pudo crear o actualizar la asignación.");
    }
}

        // Obtener todas las asignaciones CON JOINS CORREGIDOS
        static async getAll() {
            try {
                const query = `
                    SELECT 
                        a.cve_asignacion,
                        a.cve_pacientes,
                        a.cve_medicos,
                        a.fecha_inicio,
                        a.activo,
                        pp.nombre || ' ' || pp.paterno || ' ' || COALESCE(pp.materno, '') AS nombre_paciente,
                        pm.nombre || ' ' || pm.paterno || ' ' || COALESCE(pm.materno, '') AS nombre_medico,
                        pp.email AS email_paciente,
                        pm.email AS email_medico,
                        pp.telefonos AS telefono_paciente
                    FROM asignaciones_medico_paciente a
                    INNER JOIN pacientes p ON p.cve_pacientes = a.cve_pacientes
                    INNER JOIN personas pp ON pp.cve_personas = p.cve_pacientes
                    INNER JOIN medicos m ON m.cve_medicos = a.cve_medicos
                    INNER JOIN personas pm ON pm.cve_personas = m.cve_medicos
                    WHERE a.activo = true
                    ORDER BY a.fecha_inicio DESC;
                `;
                const { rows } = await pool.query(query);
                return rows;
            } catch (error) {
                console.error("Error al obtener asignaciones:", error);
                throw new Error("No se pudieron obtener las asignaciones.");
            }
        }

        // Obtener una asignación por ID CON INFORMACIÓN COMPLETA
        static async getOne(cve_asignacion) {
            try {
                const query = `
                    SELECT 
                        a.*,
                        pp.nombre || ' ' || pp.paterno || ' ' || COALESCE(pp.materno, '') AS nombre_paciente,
                        pm.nombre || ' ' || pm.paterno || ' ' || COALESCE(pm.materno, '') AS nombre_medico,
                        pp.email AS email_paciente,
                        pm.email AS email_medico,
                        pp.telefonos AS telefono_paciente,
                        pp.fecha_nacimiento,
                        pp.sexo,
                        m.cedulas_profesionales
                    FROM asignaciones_medico_paciente a
                    INNER JOIN pacientes p ON p.cve_pacientes = a.cve_pacientes
                    INNER JOIN personas pp ON pp.cve_personas = p.cve_pacientes
                    INNER JOIN medicos m ON m.cve_medicos = a.cve_medicos
                    INNER JOIN personas pm ON pm.cve_personas = m.cve_medicos
                    WHERE a.cve_asignacion = $1;
                `;
                const { rows } = await pool.query(query, [cve_asignacion]);
                return rows[0];
            } catch (error) {
                console.error("Error al obtener asignación por ID:", error);
                throw new Error("No se pudo obtener la asignación.");
            }
        }

        // Obtener asignaciones por paciente CON INFORMACIÓN DE MÉDICOS
        static async getByPaciente(cve_pacientes) {
            try {
                const query = `
                    SELECT 
                        a.*,
                        pm.nombre || ' ' || pm.paterno || ' ' || COALESCE(pm.materno, '') AS nombre_medico,
                        pm.email AS email_medico,
                        m.cedulas_profesionales,
                        -- Obtener especialidades del médico
                        ARRAY_AGG(DISTINCT e.nombre) as especialidades
                    FROM asignaciones_medico_paciente a
                    INNER JOIN medicos m ON m.cve_medicos = a.cve_medicos
                    INNER JOIN personas pm ON pm.cve_personas = m.cve_medicos
                    LEFT JOIN medicos_especialidades me ON me.cve_medicos = m.cve_medicos
                    LEFT JOIN especialidades e ON e.cve_especialidad = me.cve_especialidad
                    WHERE a.cve_pacientes = $1 AND a.activo = true
                    GROUP BY a.cve_asignacion, a.cve_pacientes, a.cve_medicos, a.fecha_inicio, a.activo,
                            pm.nombre, pm.paterno, pm.materno, pm.email, m.cedulas_profesionales
                    ORDER BY a.fecha_inicio DESC;
                `;
                const { rows } = await pool.query(query, [cve_pacientes]);
                return rows;
            } catch (error) {
                console.error("Error al obtener asignaciones por paciente:", error);
                throw new Error("No se pudieron obtener las asignaciones del paciente.");
            }
        }

        // Obtener asignaciones por médico CON INFORMACIÓN DE PACIENTES
        static async getByMedico(cve_medicos) {
            try {
                const query = `
                    SELECT 
                        a.*,
                        pp.nombre || ' ' || pp.paterno || ' ' || COALESCE(pp.materno, '') AS nombre_paciente,
                        pp.email AS email_paciente,
                        pp.telefonos AS telefono_paciente,
                        pp.fecha_nacimiento,
                        pp.sexo,
                        -- Contar citas del paciente con este médico
                        (SELECT COUNT(*) 
                        FROM citas c 
                        WHERE c.cve_pacientes = a.cve_pacientes 
                        AND c.cve_medicos = a.cve_medicos 
                        AND c.cancelada = false) as total_citas
                    FROM asignaciones_medico_paciente a
                    INNER JOIN pacientes p ON p.cve_pacientes = a.cve_pacientes
                    INNER JOIN personas pp ON pp.cve_personas = p.cve_pacientes
                    WHERE a.cve_medicos = $1 AND a.activo = true
                    ORDER BY a.fecha_inicio DESC;
                `;
                const { rows } = await pool.query(query, [cve_medicos]);
                return rows;
            } catch (error) {
                console.error("Error al obtener asignaciones por médico:", error);
                throw new Error("No se pudieron obtener las asignaciones del médico.");
            }
        }

        // Desactivar asignación
        static async desactivar(cve_asignacion) {
            try {
                const query = `
                    UPDATE asignaciones_medico_paciente
                    SET activo = false
                    WHERE cve_asignacion = $1
                    RETURNING *;
                `;
                const { rows } = await pool.query(query, [cve_asignacion]);
                return rows[0];
            } catch (error) {
                console.error("Error al desactivar asignación:", error);
                throw new Error("No se pudo desactivar la asignación.");
            }
        }

        // MÉTODOS ADICIONALES ÚTILES

        // Verificar si existe una asignación activa
        static async existeAsignacion(cve_pacientes, cve_medicos) {
            try {
                const query = `
                    SELECT EXISTS(
                        SELECT 1 FROM asignaciones_medico_paciente 
                        WHERE cve_pacientes = $1 
                        AND cve_medicos = $2 
                        AND activo = true
                    ) as existe;
                `;
                const { rows } = await pool.query(query, [cve_pacientes, cve_medicos]);
                return rows[0].existe;
            } catch (error) {
                console.error("Error al verificar asignación:", error);
                throw new Error("No se pudo verificar la asignación.");
            }
        }

        // Obtener médicos asignados a un paciente (solo activos)
        static async getMedicosDelPaciente(cve_pacientes) {
            try {
                const query = `
                    SELECT 
                        m.cve_medicos,
                        pm.nombre || ' ' || pm.paterno || ' ' || COALESCE(pm.materno, '') AS nombre_completo,
                        pm.email,
                        m.cedulas_profesionales,
                        a.fecha_inicio,
                        ARRAY_AGG(DISTINCT e.nombre) as especialidades
                    FROM asignaciones_medico_paciente a
                    INNER JOIN medicos m ON m.cve_medicos = a.cve_medicos
                    INNER JOIN personas pm ON pm.cve_personas = m.cve_medicos
                    LEFT JOIN medicos_especialidades me ON me.cve_medicos = m.cve_medicos
                    LEFT JOIN especialidades e ON e.cve_especialidad = me.cve_especialidad
                    WHERE a.cve_pacientes = $1 
                    AND a.activo = true 
                    AND m.activo = true
                    GROUP BY m.cve_medicos, pm.nombre, pm.paterno, pm.materno, 
                            pm.email, m.cedulas_profesionales, a.fecha_inicio
                    ORDER BY a.fecha_inicio DESC;
                `;
                const { rows } = await pool.query(query, [cve_pacientes]);
                return rows;
            } catch (error) {
                console.error("Error al obtener médicos del paciente:", error);
                throw new Error("No se pudieron obtener los médicos del paciente.");
            }
        }

        // Obtener pacientes asignados a un médico (solo activos)
        static async getPacientesDelMedico(cve_medicos) {
            try {
                const query = `
                    SELECT 
                        p.cve_pacientes,
                        pp.nombre || ' ' || pp.paterno || ' ' || COALESCE(pp.materno, '') AS nombre_completo,
                        pp.email,
                        pp.telefonos,
                        pp.fecha_nacimiento,
                        pp.sexo,
                        a.fecha_inicio,
                        -- Última cita
                        (SELECT MAX(c.fecha_hora_consulta) 
                        FROM citas c 
                        WHERE c.cve_pacientes = p.cve_pacientes 
                        AND c.cve_medicos = $1 
                        AND c.cancelada = false 
                        AND c.atendida = true) as ultima_consulta
                    FROM asignaciones_medico_paciente a
                    INNER JOIN pacientes p ON p.cve_pacientes = a.cve_pacientes
                    INNER JOIN personas pp ON pp.cve_personas = p.cve_pacientes
                    WHERE a.cve_medicos = $1 
                    AND a.activo = true 
                    AND p.activo = true
                    ORDER BY a.fecha_inicio DESC;
                `;
                const { rows } = await pool.query(query, [cve_medicos]);
                return rows;
            } catch (error) {
                console.error("Error al obtener pacientes del médico:", error);
                throw new Error("No se pudieron obtener los pacientes del médico.");
            }
        }
    }