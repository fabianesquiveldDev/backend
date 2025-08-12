import { db } from '../config/db.js';
const { pool } = db;

export class GraficasModel {

    /**
     * Gráfica UNO - Estados de citas con filtro por sucursal
     */
    static async consultaUno(cve_sucursal, fechaInicio = '2025-01-01', fechaFin = '2025-12-31') {
        if (!cve_sucursal || isNaN(cve_sucursal)) {
            throw new Error('CVE de sucursal inválido');
        }

        const query = `
            SELECT 
                CASE 
                    WHEN c.cancelada THEN 'Cancelada'
                    WHEN c.no_show THEN 'No Show'
                    WHEN c.atendida THEN 'Atendida'
                    ELSE 'Pendiente'
                END AS estado_cita,
                COUNT(*) AS total_citas,
                ROUND(COUNT(*) * 100.0 / (
                    SELECT COUNT(*) 
                    FROM citas c2
                    JOIN disponibilidad_citas dc2 ON c2.cve_disponibilidad = dc2.cve_disponibilidad
                    JOIN medicos_consultorios mc2 ON dc2.cve_medico_consultorio = mc2.cve_medico_consultorio
                    JOIN consultorios con2 ON mc2.cve_consultorios = con2.cve_consultorios
                    JOIN sucursales s2 ON con2.cve_sucursales = s2.cve_sucursales
                    WHERE dc2.fecha_hora_inicio BETWEEN $2 AND $3
                    AND s2.cve_sucursales = $1
                ), 2) AS porcentaje
            FROM citas c
            JOIN disponibilidad_citas dc ON c.cve_disponibilidad = dc.cve_disponibilidad
            JOIN medicos_consultorios mc ON dc.cve_medico_consultorio = mc.cve_medico_consultorio
            JOIN consultorios con ON mc.cve_consultorios = con.cve_consultorios
            JOIN sucursales s ON con.cve_sucursales = s.cve_sucursales
            WHERE dc.fecha_hora_inicio BETWEEN $2 AND $3
            AND s.cve_sucursales = $1
            GROUP BY estado_cita
            ORDER BY total_citas DESC;
        `;

        try {
            const result = await pool.query(query, [cve_sucursal, fechaInicio, fechaFin]);
            return result.rows;
        } catch (error) {
            console.error('Error en consulta gráfica uno:', error);
            throw new Error('No se pudieron obtener los datos de estados de citas');
        }
    }

    /**
     * Gráfica DOS - Top médicos con más citas atendidas
     */
    static async consultaDos(cve_sucursal, fechaInicio = '2025-01-01', fechaFin = '2025-12-31') {
        if (!cve_sucursal || isNaN(cve_sucursal)) {
            throw new Error('CVE de sucursal inválido');
        }

        const query = `
            SELECT 
                p.nombre || ' ' || p.paterno AS medico,
                COUNT(c.cve_citas) AS citas_atendidas,
                m.cedulas_profesionales
            FROM citas c
            JOIN medicos m ON c.cve_medicos = m.cve_medicos
            JOIN personas p ON m.cve_medicos = p.cve_personas
            JOIN disponibilidad_citas dc ON c.cve_disponibilidad = dc.cve_disponibilidad
            JOIN medicos_consultorios mc ON dc.cve_medico_consultorio = mc.cve_medico_consultorio
            JOIN consultorios con ON mc.cve_consultorios = con.cve_consultorios
            JOIN sucursales s ON con.cve_sucursales = s.cve_sucursales
            WHERE c.atendida = true
            AND dc.fecha_hora_inicio BETWEEN $2 AND $3
            AND s.cve_sucursales = $1
            GROUP BY p.nombre, p.paterno, m.cedulas_profesionales
            ORDER BY citas_atendidas DESC
            LIMIT 10;
        `;
        try {
            const result = await pool.query(query, [cve_sucursal, fechaInicio, fechaFin]);
            return result.rows;
        } catch (error) {
            console.error('Error en consulta gráfica dos:', error);
            throw new Error('No se pudieron obtener los datos de médicos');
        }
    }

    /**
     * Gráfica TRES - Citas por mes (últimos 6 meses)
     */
    static async consultaTres(cve_sucursal, fechaInicio = '2025-01-01', fechaFin = '2025-12-31') {
        if (!cve_sucursal || isNaN(cve_sucursal)) {
            throw new Error('CVE de sucursal inválido');
        }

        const query = `
            SELECT 
                TO_CHAR(dc.fecha_hora_inicio, 'TMMonth YYYY') AS mes,
                COUNT(*) AS total_citas,
                COUNT(CASE WHEN c.atendida = true THEN 1 END) AS citas_atendidas,
                COUNT(CASE WHEN c.cancelada = true THEN 1 END) AS citas_canceladas,
                COUNT(CASE WHEN c.no_show = true THEN 1 END) AS citas_no_show
            FROM citas c
            JOIN disponibilidad_citas dc ON c.cve_disponibilidad = dc.cve_disponibilidad
            JOIN medicos_consultorios mc ON dc.cve_medico_consultorio = mc.cve_medico_consultorio
            JOIN consultorios con ON mc.cve_consultorios = con.cve_consultorios
            JOIN sucursales s ON con.cve_sucursales = s.cve_sucursales
            WHERE dc.fecha_hora_inicio BETWEEN $2 AND $3
            AND s.cve_sucursales = $1
            GROUP BY TO_CHAR(dc.fecha_hora_inicio, 'TMMonth YYYY'), DATE_TRUNC('month', dc.fecha_hora_inicio)
            ORDER BY DATE_TRUNC('month', dc.fecha_hora_inicio) DESC
            LIMIT 6;
        `;

        try {
            const result = await pool.query(query, [cve_sucursal, fechaInicio, fechaFin]);
            return result.rows; // Cambié de result.rows[0] a result.rows
        } catch (error) {
            console.error('Error en consulta gráfica tres:', error);
            throw new Error('No se pudieron obtener los datos de citas por mes');
        }
    }

    /**
     * Gráfica CUATRO - Especialidades más solicitadas
     */
    static async consultaCuatro(cve_sucursal, fechaInicio = '2025-01-01', fechaFin = '2025-12-31') {
        if (!cve_sucursal || isNaN(cve_sucursal)) {
            throw new Error('CVE de sucursal inválido');
        }

        const query = `
            SELECT 
                e.nombre AS especialidad,
                COUNT(c.cve_citas) AS total_citas,
                COUNT(CASE WHEN c.atendida = true THEN 1 END) AS citas_atendidas,
                ROUND(
                    CASE 
                        WHEN COUNT(c.cve_citas) = 0 THEN 0 
                        ELSE (COUNT(CASE WHEN c.atendida = true THEN 1 END) * 100.0 / COUNT(c.cve_citas)) 
                    END, 2
                ) as porcentaje_atencion,
                COUNT(DISTINCT c.cve_pacientes) as pacientes_unicos
            FROM especialidades e
            JOIN medicos_especialidades me ON e.cve_especialidad = me.cve_especialidad
            JOIN medicos m ON me.cve_medicos = m.cve_medicos
            JOIN citas c ON m.cve_medicos = c.cve_medicos
            JOIN disponibilidad_citas dc ON c.cve_disponibilidad = dc.cve_disponibilidad
            JOIN medicos_consultorios mc ON dc.cve_medico_consultorio = mc.cve_medico_consultorio
            JOIN consultorios con ON mc.cve_consultorios = con.cve_consultorios
            JOIN sucursales s ON con.cve_sucursales = s.cve_sucursales
            WHERE dc.fecha_hora_inicio BETWEEN $2 AND $3
            AND s.cve_sucursales = $1
            GROUP BY e.nombre
            ORDER BY total_citas DESC
            LIMIT 10;
        `;

        try {
            const result = await pool.query(query, [cve_sucursal, fechaInicio, fechaFin]);
            return result.rows;
        } catch (error) {
            console.error('Error en consulta gráfica cuatro:', error);
            throw new Error('No se pudieron obtener los datos de especialidades');
        }
    }

    /**
     * Método auxiliar para obtener la sucursal del usuario
     */
    static async obtenercvesucursal(cve_usuarios) {
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

    /**
     * Método para obtener todas las gráficas de una vez
     */
    static async obtenerTodasLasGraficas(cve_sucursal, fechaInicio = '2025-01-01', fechaFin = '2025-12-31') {
        try {
            const [grafica1, grafica2, grafica3, grafica4] = await Promise.all([
                this.consultaUno(cve_sucursal, fechaInicio, fechaFin),
                this.consultaDos(cve_sucursal, fechaInicio, fechaFin),
                this.consultaTres(cve_sucursal, fechaInicio, fechaFin),
                this.consultaCuatro(cve_sucursal, fechaInicio, fechaFin)
            ]);

            return {
                citasPorMes: grafica1,
                especialidadesSolicitadas: grafica2,
                estadosCitas: grafica3,
                medicosTopCitas: grafica4
            };
        } catch (error) {
            console.error('Error obteniendo todas las gráficas:', error);
            throw new Error('No se pudieron obtener los datos de las gráficas');
        }
    }

    /**
     * Gráfica Sucursal UNO - Citas por Mes en una Sucursal
     */
    static async consultaSucursalUno(cve_sucursal) {
        if (!cve_sucursal || isNaN(cve_sucursal)) {
            throw new Error('CVE de sucursal inválido');
        }

        const query = `
            SELECT 
                TO_CHAR(c.fecha_hora_consulta, 'YYYY-MM') AS mes,
                COUNT(*) AS total_citas,
                SUM(CASE WHEN c.atendida THEN 1 ELSE 0 END) AS citas_atendidas
            FROM citas c
            JOIN medicos_consultorios mc ON c.cve_medico_consultorio = mc.cve_medico_consultorio
            JOIN consultorios co ON mc.cve_consultorios = co.cve_consultorios
            WHERE co.cve_sucursales = $1
                AND c.fecha_hora_consulta >= CURRENT_DATE - INTERVAL '1 year'
            GROUP BY mes
            ORDER BY mes;
        `;

        try {
            const result = await pool.query(query, [cve_sucursal]);
            return result.rows;
        } catch (error) {
            console.error('Error en consulta sucursal uno:', error);
            throw new Error('No se pudieron obtener los datos de citas por mes');
        }
    }

    /**
     * Gráfica Sucursal DOS - Especialidades Más Demandadas por Sucursal
     */
    static async consultaSucursalDos(cve_sucursal) {
        if (!cve_sucursal || isNaN(cve_sucursal)) {
            throw new Error('CVE de sucursal inválido');
        }

        const query = `
            SELECT 
                e.nombre AS especialidad,
                COUNT(c.cve_citas) AS total_citas
            FROM citas c
            JOIN medicos m ON c.cve_medicos = m.cve_medicos
            JOIN medicos_especialidades me ON m.cve_medicos = me.cve_medicos
            JOIN especialidades e ON me.cve_especialidad = e.cve_especialidad
            JOIN medicos_consultorios mc ON c.cve_medico_consultorio = mc.cve_medico_consultorio
            JOIN consultorios co ON mc.cve_consultorios = co.cve_consultorios
            WHERE co.cve_sucursales = $1
            GROUP BY especialidad
            ORDER BY total_citas DESC
            LIMIT 5;
        `;

        try {
            const result = await pool.query(query, [cve_sucursal]);
            return result.rows;
        } catch (error) {
            console.error('Error en consulta sucursal dos:', error);
            throw new Error('No se pudieron obtener los datos de especialidades demandadas');
        }
    }

    /**
     * Gráfica Sucursal TRES - Médicos con Más Citas por Sucursal
     */
    static async consultaSucursalTres(cve_sucursal) {
        if (!cve_sucursal || isNaN(cve_sucursal)) {
            throw new Error('CVE de sucursal inválido');
        }

        const query = `
            SELECT 
                CONCAT(p.nombre, ' ', p.paterno) AS medico,
                COUNT(c.cve_citas) AS total_citas,
                e.nombre AS especialidad
            FROM citas c
            JOIN medicos m ON c.cve_medicos = m.cve_medicos
            JOIN personas p ON m.cve_medicos = p.cve_personas
            JOIN medicos_especialidades me ON m.cve_medicos = me.cve_medicos
            JOIN especialidades e ON me.cve_especialidad = e.cve_especialidad
            JOIN medicos_consultorios mc ON c.cve_medico_consultorio = mc.cve_medico_consultorio
            JOIN consultorios co ON mc.cve_consultorios = co.cve_consultorios
            WHERE co.cve_sucursales = $1
                AND c.fecha_hora_consulta >= CURRENT_DATE - INTERVAL '3 months'
            GROUP BY medico, especialidad
            ORDER BY total_citas DESC
            LIMIT 5;
        `;

        try {
            const result = await pool.query(query, [cve_sucursal]);
            return result.rows;
        } catch (error) {
            console.error('Error en consulta sucursal tres:', error);
            throw new Error('No se pudieron obtener los datos de médicos con más citas');
        }
    }

    /**
     * Gráfica Sucursal CUATRO - Horarios Más Solicitados por Sucursal
     */
    static async consultaSucursalCuatro(cve_sucursal) {
        if (!cve_sucursal || isNaN(cve_sucursal)) {
            throw new Error('CVE de sucursal inválido');
        }

        const query = `
            SELECT 
                EXTRACT(HOUR FROM c.fecha_hora_consulta) AS hora_del_dia,
                COUNT(*) AS total_citas
            FROM citas c
            JOIN medicos_consultorios mc ON c.cve_medico_consultorio = mc.cve_medico_consultorio
            JOIN consultorios co ON mc.cve_consultorios = co.cve_consultorios
            WHERE co.cve_sucursales = $1
                AND c.fecha_hora_consulta >= CURRENT_DATE - INTERVAL '3 months'
            GROUP BY hora_del_dia
            ORDER BY hora_del_dia;
        `;

        try {
            const result = await pool.query(query, [cve_sucursal]);
            return result.rows;
        } catch (error) {
            console.error('Error en consulta sucursal cuatro:', error);
            throw new Error('No se pudieron obtener los datos de horarios más solicitados');
        }
    }
}
