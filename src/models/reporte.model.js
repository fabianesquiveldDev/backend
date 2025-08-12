import { db } from '../config/db.js';
const { pool } = db;

export class ReporteModel {

    static async generarPDFCompletoadmin(cve, fechaInicio = '2025-01-01', fechaFin = '2025-12-31') {
        // Validación de entrada
        if (!cve || isNaN(cve)) {
            throw new Error('CVE de sucursal inválido');
        }

        try {
            const consulta1 = `
                SELECT 
                    s.nombre as sucursal,
                    COUNT(*) as total_citas_programadas,
                    COUNT(CASE WHEN c.atendida = true THEN 1 END) as citas_atendidas,
                    COUNT(CASE WHEN c.cancelada = true THEN 1 END) as citas_canceladas,
                    COUNT(CASE WHEN c.no_show = true THEN 1 END) as no_show,
                    ROUND(
                        CASE 
                            WHEN COUNT(*) = 0 THEN 0 
                            ELSE (COUNT(CASE WHEN c.atendida = true THEN 1 END) * 100.0 / COUNT(*)) 
                        END, 2
                    ) as porcentaje_efectividad,
                    COUNT(DISTINCT c.cve_pacientes) as pacientes_unicos_atendidos,
                    COUNT(DISTINCT c.cve_medicos) as medicos_activos
                FROM citas c
                JOIN disponibilidad_citas dc ON c.cve_disponibilidad = dc.cve_disponibilidad
                JOIN medicos_consultorios mc ON dc.cve_medico_consultorio = mc.cve_medico_consultorio
                JOIN consultorios con ON mc.cve_consultorios = con.cve_consultorios
                JOIN sucursales s ON con.cve_sucursales = s.cve_sucursales
                WHERE dc.fecha_hora_inicio BETWEEN $2 AND $3
                AND s.cve_sucursales = $1
                GROUP BY s.cve_sucursales, s.nombre;
            `;

            const consulta2 = `
                SELECT 
                    CONCAT(p.nombre, ' ', p.paterno, ' ', p.materno) as nombre_medico,
                    m.cedulas_profesionales,
                    COUNT(*) as total_citas,
                    COUNT(CASE WHEN c.atendida = true THEN 1 END) as citas_atendidas,
                    COUNT(CASE WHEN c.cancelada = true THEN 1 END) as citas_canceladas,
                    COUNT(CASE WHEN c.no_show = true THEN 1 END) as no_show,
                    ROUND(
                        CASE 
                            WHEN COUNT(*) = 0 THEN 0 
                            ELSE (COUNT(CASE WHEN c.atendida = true THEN 1 END) * 100.0 / COUNT(*)) 
                        END, 2
                    ) as porcentaje_atencion
                FROM citas c
                JOIN disponibilidad_citas dc ON c.cve_disponibilidad = dc.cve_disponibilidad
                JOIN medicos_consultorios mc ON dc.cve_medico_consultorio = mc.cve_medico_consultorio
                JOIN consultorios con ON mc.cve_consultorios = con.cve_consultorios
                JOIN sucursales s ON con.cve_sucursales = s.cve_sucursales
                JOIN medicos m ON c.cve_medicos = m.cve_medicos
                JOIN personas p ON m.cve_medicos = p.cve_personas
                WHERE dc.fecha_hora_inicio BETWEEN $2 AND $3
                AND s.cve_sucursales = $1
                GROUP BY m.cve_medicos, p.nombre, p.paterno, p.materno, m.cedulas_profesionales
                ORDER BY total_citas DESC;
            `;

            const consulta3 = `
                SELECT 
                    EXTRACT(YEAR FROM dc.fecha_hora_inicio) as año,
                    EXTRACT(MONTH FROM dc.fecha_hora_inicio) as mes,
                    TO_CHAR(DATE_TRUNC('month', dc.fecha_hora_inicio), 'TMMonth YYYY') as periodo,
                    COUNT(*) as total_citas,
                    COUNT(CASE WHEN c.atendida = true THEN 1 END) as citas_atendidas,
                    COUNT(CASE WHEN c.cancelada = true THEN 1 END) as citas_canceladas,
                    ROUND(
                        CASE 
                            WHEN COUNT(*) = 0 THEN 0 
                            ELSE (COUNT(CASE WHEN c.atendida = true THEN 1 END) * 100.0 / COUNT(*)) 
                        END, 2
                    ) as porcentaje_efectividad
                FROM citas c
                JOIN disponibilidad_citas dc ON c.cve_disponibilidad = dc.cve_disponibilidad
                JOIN medicos_consultorios mc ON dc.cve_medico_consultorio = mc.cve_medico_consultorio
                JOIN consultorios con ON mc.cve_consultorios = con.cve_consultorios
                JOIN sucursales s ON con.cve_sucursales = s.cve_sucursales
                WHERE dc.fecha_hora_inicio BETWEEN $2 AND $3
                AND s.cve_sucursales = $1
                GROUP BY 
                    EXTRACT(YEAR FROM dc.fecha_hora_inicio), 
                    EXTRACT(MONTH FROM dc.fecha_hora_inicio),
                    DATE_TRUNC('month', dc.fecha_hora_inicio)
                ORDER BY año, mes;
            `;

            const consulta4 = `
                SELECT 
                    e.nombre as especialidad,
                    con.nombre as consultorio,
                    COUNT(*) as total_citas,
                    COUNT(CASE WHEN c.atendida = true THEN 1 END) as citas_atendidas,
                    ROUND(
                        CASE 
                            WHEN COUNT(*) = 0 THEN 0 
                            ELSE (COUNT(CASE WHEN c.atendida = true THEN 1 END) * 100.0 / COUNT(*)) 
                        END, 2
                    ) as porcentaje_atencion,
                    COUNT(DISTINCT c.cve_pacientes) as pacientes_unicos
                FROM citas c
                JOIN disponibilidad_citas dc ON c.cve_disponibilidad = dc.cve_disponibilidad
                JOIN medicos_consultorios mc ON dc.cve_medico_consultorio = mc.cve_medico_consultorio
                JOIN consultorios con ON mc.cve_consultorios = con.cve_consultorios
                JOIN sucursales s ON con.cve_sucursales = s.cve_sucursales
                JOIN medicos m ON c.cve_medicos = m.cve_medicos
                JOIN medicos_especialidades me ON m.cve_medicos = me.cve_medicos
                JOIN especialidades e ON me.cve_especialidad = e.cve_especialidad
                WHERE dc.fecha_hora_inicio BETWEEN $2 AND $3
                AND s.cve_sucursales = $1
                GROUP BY e.cve_especialidad, e.nombre, con.cve_consultorios, con.nombre
                ORDER BY total_citas DESC;
            `;

            const resultados = await Promise.all([
                pool.query(consulta1, [cve, fechaInicio, fechaFin]),
                pool.query(consulta2, [cve, fechaInicio, fechaFin]),
                pool.query(consulta3, [cve, fechaInicio, fechaFin]),
                pool.query(consulta4, [cve, fechaInicio, fechaFin]),
            ]);

            const resumenSucursal = resultados[0].rows;
            const resumenMedicos = resultados[1].rows;
            const resumenMensual = resultados[2].rows;
            const resumenEspecialidades = resultados[3].rows;

            if (
                resumenSucursal.length === 0 &&
                resumenMedicos.length === 0 &&
                resumenMensual.length === 0 &&
                resumenEspecialidades.length === 0
            ) {
                return null;
            }

            return {
                resumenSucursal,
                resumenMedicos,
                resumenMensual,
                resumenEspecialidades,
            };
        } catch (error) {
            console.error('Error al obtener datos para reporte admin:', error);
            throw new Error('No se pudieron obtener los datos para el reporte.');
        }
    }

    static async obtenercvesucursal(cve_usuarios) {
        // Validación de entrada
        if (!cve_usuarios || isNaN(cve_usuarios)) {
            throw new Error('CVE de usuario inválido');
        }

        const query = `
            SELECT cve_sucursales
            FROM usuarios_sucursales
            WHERE cve_usuarios = $1
            LIMIT 1;
        `;

        try {
            const result = await pool.query(query, [cve_usuarios]);
            if (result.rows.length === 0) return null;
            return result.rows[0].cve_sucursales;
        } catch (error) {
            console.error('Error obteniendo cve_sucursales:', error);
            throw new Error('No se pudo obtener la sucursal del usuario');
        }
    }
}