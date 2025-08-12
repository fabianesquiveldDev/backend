import { db } from '../config/db.js';
const { pool } = db;

export class MedicosConsultoriosModel {
    static async crear({ input }) {
        const {
            cve_medicos,
            cve_consultorios,
            fecha_inicio,
            activo,
        } = input;

        const query = `
            INSERT INTO medicos_consultorios (
                cve_medicos, cve_consultorios, fecha_inicio, activo
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;

        const values = [
            cve_medicos,
            cve_consultorios,
            fecha_inicio,
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
            const query = 'SELECT * FROM medicos_consultorios WHERE cve_medico_consultorio = $1';
            const { rows } = await pool.query(query, [cve]);
            
            if (rows.length === 0) {
                return null; 
            }
            
            return rows[0];
        } catch (err) {
            console.error('Error al obtener medicosConsultorios:', err);
            throw new Error('Error al buscar medicosConsultorios en la base de datos');
        }
    }

    static async update({ cve, input }) {
    try {
        // ⚠️ Filtrar solo los campos definidos, conservar false y 0
        const camposActualizables = Object.fromEntries(
            Object.entries(input).filter(([_, v]) => v !== undefined)
        );

        const fields = Object.keys(camposActualizables);
        if (fields.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        
        const query = `
            UPDATE medicos_consultorios
            SET ${setClause}
            WHERE cve_medico_consultorio = $${fields.length + 1}
            RETURNING *;
        `;

        const values = [...Object.values(camposActualizables), Number(cve)];

        console.log('Ejecutando UPDATE:');
        console.log('Query:', query);
        console.log('Values:', values);

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            console.log(`No se encontró registro con CVE: ${cve}`);
            return null;
        }

        console.log(`Registro con CVE ${cve} actualizado exitosamente`);
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
                        (p.nombre || ' ' || p.paterno || ' ' || p.materno) AS nombre_medico,
                        m.cve_medicos AS cve_medicos,
                        STRING_AGG(DISTINCT e.nombre, ', ' ORDER BY e.nombre) AS especialidades_agrupadas,
                        m.activo AS medico_activo,
                        COUNT(DISTINCT c_main.cve_sucursales) AS numero_sucursales_trabajadas
                    FROM
                        medicos AS m
                    INNER JOIN
                        personas AS p ON p.cve_personas = m.cve_medicos
                    INNER JOIN
                        medicos_especialidades AS me ON me.cve_medicos = m.cve_medicos
                    INNER JOIN
                        especialidades AS e ON e.cve_especialidad = me.cve_especialidad
                    LEFT JOIN
                        medicos_consultorios AS mc_main ON mc_main.cve_medicos = m.cve_medicos
                        AND mc_main.fecha_fin IS NULL
                        AND mc_main.activo = TRUE
                    LEFT JOIN
                        consultorios AS c_main ON c_main.cve_consultorios = mc_main.cve_consultorios
                    GROUP BY
                        m.cve_medicos,
                        p.nombre,
                        p.paterno,
                        p.materno,
                        m.activo
                    ORDER BY
                        nombre_medico;
                            `;

            const { rows } = await pool.query(query); 
            return rows;
        } catch (error) {
            console.error("Error al obtener las especialidades de la base de datos:", error);
            throw new Error("No se pudieron obtener las especialidades.");
        }
    }

    // Método para obtener consultorios ya asignados al médico
static async Asignada({ cve }) {
    try {
        // Validar que el ID del médico sea un número válido
        if (!cve || isNaN(Number(cve))) {
            throw new Error('ID de médico no válido');
        }

        const query = `
  WITH consultorios_ocupados AS (
    -- Subconsulta para identificar consultorios que están OCUPADOS (no disponibles para $1)
    SELECT DISTINCT mc.cve_consultorios
    FROM MEDICOS_CONSULTORIOS mc
    WHERE mc.activo = true 
      AND (mc.fecha_fin IS NULL OR mc.fecha_fin >= CURRENT_DATE)
      AND mc.cve_medicos != $1 -- Ocupado por otro médico
),
consultorios_medico AS (
    -- Subconsulta para obtener asignaciones del médico específico ($1)
    SELECT 
        mc.cve_medico_consultorio,
        mc.cve_consultorios,
        mc.cve_medicos,
        mc.fecha_inicio,
        mc.fecha_fin,
        mc.activo as asignacion_activa,
        CASE 
            WHEN mc.activo = true AND (mc.fecha_fin IS NULL OR mc.fecha_fin >= CURRENT_DATE) THEN 'ACTIVO'
            WHEN mc.activo = false THEN 'DESACTIVADO'
            WHEN mc.fecha_fin < CURRENT_DATE THEN 'VENCIDO'
            ELSE 'SIN_ASIGNACION'
        END as estado_asignacion
    FROM MEDICOS_CONSULTORIOS mc
    WHERE mc.cve_medicos = $1
)

SELECT DISTINCT
    s.cve_sucursales,
    s.nombre AS nombre_sucursal,
    c.cve_consultorios,
    c.nombre AS nombre_consultorio,
    c.numero AS numero_consultorio,
    c.cve_pisos,
    cm.cve_medico_consultorio, -- Added this line
    COALESCE(cm.cve_medicos, $1) AS cve_medicos,
    cm.fecha_inicio,
    cm.fecha_fin,
    COALESCE(cm.estado_asignacion, 'SIN_ASIGNACION') AS estado_asignacion,
    COALESCE(cm.asignacion_activa, false) AS tiene_asignacion_activa,
    
    CASE 
        WHEN cm.cve_medicos IS NOT NULL AND cm.estado_asignacion = 'ACTIVO' THEN 'ASIGNADO'
        ELSE 'DISPONIBLE'
    END AS disponibilidad_consultorio

FROM SUCURSALES s
INNER JOIN CONSULTORIOS c ON s.cve_sucursales = c.cve_sucursales
LEFT JOIN consultorios_medico cm ON c.cve_consultorios = cm.cve_consultorios

WHERE 
    c.activo = true -- Consultorio debe estar activo
    AND c.cve_consultorios NOT IN (
        SELECT cve_consultorios FROM consultorios_ocupados -- No debe estar ocupado por otro médico
    )
    AND s.cve_sucursales IN (
        -- Solo sucursales que tienen al menos un consultorio disponible para el médico $1
        SELECT DISTINCT c2.cve_sucursales 
        FROM CONSULTORIOS c2 
        WHERE c2.activo = true
          AND c2.cve_consultorios NOT IN (
              SELECT cve_consultorios FROM consultorios_ocupados
          )
    )

ORDER BY 
    s.nombre,
    c.numero,
    c.nombre;
        `;
        
        const { rows } = await pool.query(query, [cve]);
        
        return {
            success: true,
            data: rows
        };
        
    } catch (err) {
        console.error('Error en Asignada:', {
            error: err,
            cve_medico: cve
        });
        throw new Error('Error al obtener consultorios asignados');
    }
}

// Nuevo método para obtener TODOS los consultorios disponibles para asignar
static async ConsultoriosDisponibles({ cve }) {
    try {
        // Validar que el ID del médico sea un número válido
        if (!cve || isNaN(Number(cve))) {
            throw new Error('ID de médico no válido');
        }

        const query = `
            SELECT 
                c.cve_consultorios as cve_consultorio,
                c.nombre as nombre_consultorio,
                c.numero as numero_consultorio,
                c.activo as consultorio_activo,
                s.cve_sucursales as cve_sucursal,
                s.nombre as nombre_sucursal,
                tc.nombre as tipo_consultorio,
                CASE 
                    WHEN mc.cve_medicos = $1 THEN true 
                    ELSE false 
                END as es_consultorio_actual,
                CASE 
                    WHEN mc.cve_medicos IS NULL THEN 'Disponible'
                    WHEN mc.cve_medicos = $1 THEN 'Actual'
                    ELSE 'Ocupado'
                END as estado_consultorio,
                mc.cve_medico_consultorio
            FROM consultorios c
            INNER JOIN sucursales s ON c.cve_sucursales = s.cve_sucursales
            INNER JOIN tipo_consultorios tc ON c.cve_tipo_consultorios = tc.cve_tipo_consultorios
            LEFT JOIN medicos_consultorios mc ON c.cve_consultorios = mc.cve_consultorios
            WHERE c.activo = true
            AND s.activo = true
            ORDER BY s.nombre, c.nombre
        `;

        // Query para obtener el nombre del médico
        const medicoQuery = `
            SELECT 
                m.cve_medicos,
                (p.nombre || ' ' || p.paterno || ' ' || p.materno) AS nombre_medico
            FROM medicos m
            INNER JOIN personas p ON p.cve_personas = m.cve_medicos
            WHERE m.cve_medicos = $1
        `;

        // Ejecutar ambas consultas
        const [consultoriosResult, medicoResult] = await Promise.all([
            pool.query(query, [cve]),
            pool.query(medicoQuery, [cve])
        ]);

        // Verificar que el médico existe
        if (medicoResult.rows.length === 0) {
            throw new Error('Médico no encontrado');
        }

        const nombreMedico = medicoResult.rows[0].nombre_medico;

        // Agregar el nombre del médico a cada consultorio
        const consultoriosConMedico = consultoriosResult.rows.map(consultorio => ({
            ...consultorio,
            nombre_medico: nombreMedico,
            cve_medicos: parseInt(cve)
        }));

        return {
            success: true,
            data: consultoriosConMedico
        };
        
    } catch (err) {
        console.error('Error en ConsultoriosDisponibles:', {
            error: err,
            cve_medico: cve
        });
        throw new Error('Error al obtener consultorios disponibles');
    }
}

// Método para asignar un consultorio a un médico
static async AsignarConsultorio({ cve_medico, cve_consultorio }) {
    try {
        // Validaciones
        if (!cve_medico || isNaN(Number(cve_medico))) {
            throw new Error('ID de médico no válido');
        }
        
        if (!cve_consultorio || isNaN(Number(cve_consultorio))) {
            throw new Error('ID de consultorio no válido');
        }

        // Verificar que el consultorio esté disponible
        const verificarQuery = `
            SELECT 
                c.cve_consultorios,
                c.nombre as nombre_consultorio,
                mc.cve_medicos as medico_asignado
            FROM consultorios c
            LEFT JOIN medicos_consultorios mc ON c.cve_consultorios = mc.cve_consultorios
            WHERE c.cve_consultorios = $1 
            AND c.activo = true
        `;

        const verificarResult = await pool.query(verificarQuery, [cve_consultorio]);

        if (verificarResult.rows.length === 0) {
            throw new Error('Consultorio no encontrado');
        }

        const consultorio = verificarResult.rows[0];

        // Si ya está asignado a otro médico
        if (consultorio.medico_asignado && consultorio.medico_asignado != cve_medico) {
            throw new Error('Este consultorio ya está asignado a otro médico');
        }

        // Si ya está asignado al mismo médico
        if (consultorio.medico_asignado == cve_medico) {
            throw new Error('Este consultorio ya está asignado a este médico');
        }

        // Asignar el consultorio
        const asignarQuery = `
            INSERT INTO medicos_consultorios (cve_medicos, cve_consultorios)
            VALUES ($1, $2)
            RETURNING cve_medico_consultorio
        `;

        const asignarResult = await pool.query(asignarQuery, [cve_medico, cve_consultorio]);

        return {
            success: true,
            message: 'Consultorio asignado exitosamente',
            data: {
                cve_medico_consultorio: asignarResult.rows[0].cve_medico_consultorio,
                cve_medicos: parseInt(cve_medico),
                cve_consultorio: cve_consultorio,
                nombre_consultorio: consultorio.nombre_consultorio
            }
        };

    } catch (err) {
        console.error('Error en AsignarConsultorio:', {
            error: err,
            cve_medico,
            cve_consultorio
        });
        throw new Error(err.message || 'Error al asignar consultorio');
    }
}

// Método para desasignar un consultorio
static async DesasignarConsultorio({ cve_medico, cve_consultorio }) {
    try {
        // Validaciones
        if (!cve_medico || isNaN(Number(cve_medico))) {
            throw new Error('ID de médico no válido');
        }
        
        if (!cve_consultorio || isNaN(Number(cve_consultorio))) {
            throw new Error('ID de consultorio no válido');
        }

        const desasignarQuery = `
            DELETE FROM medicos_consultorios 
            WHERE cve_medicos = $1 AND cve_consultorios = $2
            RETURNING cve_medico_consultorio
        `;

        const result = await pool.query(desasignarQuery, [cve_medico, cve_consultorio]);

        if (result.rows.length === 0) {
            throw new Error('Asignación no encontrada');
        }

        return {
            success: true,
            message: 'Consultorio desasignado exitosamente',
            data: {
                cve_medico_consultorio: result.rows[0].cve_medico_consultorio
            }
        };

    } catch (err) {
        console.error('Error en DesasignarConsultorio:', {
            error: err,
            cve_medico,
            cve_consultorio
        });
        throw new Error(err.message || 'Error al desasignar consultorio');
    }
}

    static async AsignarConsultorios({ cve }) {
    try {
        // Validar que el ID del médico sea un número válido
        if (!cve || isNaN(Number(cve))) {
            throw new Error('ID de médico no válido');
        }

        const query = `
           SELECT
    m.cve_medicos,
    (p.nombre || ' ' || p.paterno || ' ' || p.materno) AS nombre_medico,
    s_main.cve_sucursales AS cve_sucursal,
    s_main.nombre AS nombre_sucursal,
    'Consultorio Disponible' AS tipo_consultorio,
    c_avail.cve_consultorios AS cve_consultorio,
    c_avail.nombre AS nombre_consultorio,
    c_avail.numero AS numero_consultorio,
    c_avail.activo AS consultorio_activo,
    FALSE AS es_consultorio_actual
FROM
    medicos AS m
INNER JOIN
    personas AS p ON p.cve_personas = m.cve_medicos
INNER JOIN

    (
        SELECT DISTINCT mc_sub.cve_medicos, c_sub.cve_sucursales
        FROM medicos_consultorios AS mc_sub
        INNER JOIN consultorios AS c_sub ON c_sub.cve_consultorios = mc_sub.cve_consultorios
        WHERE mc_sub.fecha_fin IS NULL AND mc_sub.activo = TRUE
    ) AS doctor_branches ON doctor_branches.cve_medicos = m.cve_medicos
INNER JOIN
    sucursales AS s_main ON s_main.cve_sucursales = doctor_branches.cve_sucursales
INNER JOIN
    consultorios AS c_avail ON c_avail.cve_sucursales = s_main.cve_sucursales
WHERE
    m.cve_medicos = $1
    AND c_avail.activo = TRUE -- Consultorio must be active
    AND NOT EXISTS ( -- Consultorio is NOT currently assigned to ANY doctor
        SELECT 1
        FROM medicos_consultorios AS mc_check
        WHERE mc_check.cve_consultorios = c_avail.cve_consultorios
          AND mc_check.fecha_fin IS NULL
          AND mc_check.activo = TRUE
    )

UNION ALL

    SELECT
        m.cve_medicos,
        (p.nombre || ' ' || p.paterno || ' ' || p.materno) AS nombre_medico,
        s_main.cve_sucursales AS cve_sucursal,
        s_main.nombre AS nombre_sucursal,
        'Consultorio Actual' AS tipo_consultorio,
        c_current.cve_consultorios AS cve_consultorio,
        c_current.nombre AS nombre_consultorio,
        c_current.numero AS numero_consultorio,
        c_current.activo AS consultorio_activo,
        TRUE AS es_consultorio_actual
    FROM
        medicos AS m
    INNER JOIN
        personas AS p ON p.cve_personas = m.cve_medicos
    INNER JOIN
        medicos_consultorios AS mc_current ON mc_current.cve_medicos = m.cve_medicos
    INNER JOIN
        consultorios AS c_current ON c_current.cve_consultorios = mc_current.cve_consultorios
    INNER JOIN
        sucursales AS s_main ON s_main.cve_sucursales = c_current.cve_sucursales
    WHERE
        m.cve_medicos = $1
        AND mc_current.fecha_fin IS NULL 
        AND mc_current.activo = TRUE     

    ORDER BY
        nombre_medico,
        nombre_sucursal,
        tipo_consultorio DESC, 
        nombre_consultorio;
        `;
        
        const { rows } = await pool.query(query, [cve]);
        
        // Devolver todas las especialidades no asignadas
        return {
            success: true,
            data: rows  // Esto devolverá todas las filas encontradas
        };
        
    } catch (err) {
        console.error('Error en noAsignada:', {
            error: err,
            cve_medico: cve
        });
        throw new Error('Error al obtener medicos_consultorios no asignadas');
    }
    }
    
    static async getAllAdmin({ cve }) {
        try {
            const query = `
                SELECT
                    (p.nombre || ' ' || p.paterno || ' ' || p.materno) AS nombre_medico,
                    m.cve_medicos AS cve_medicos,
                    STRING_AGG(DISTINCT e.nombre, ', ' ORDER BY e.nombre) AS especialidades_agrupadas,
                    m.activo AS medico_activo_general,
                    p.email,
                    p.telefonos,
                    CASE
                        WHEN active_in_this_branch.cve_medicos IS NOT NULL THEN TRUE
                        ELSE FALSE
                    END AS esta_activo_en_esta_sucursal,
                    active_in_this_branch.cve_medico_consultorio_activos_en_sucursal,
                    -- NUEVA COLUMNA: Total de consultorios asignados (activos/inactivos) en esta sucursal
                    COALESCE(all_consultorios_in_branch.count_consultorios, 0) AS total_consultorios_en_sucursal
                FROM
                    medicos AS m
                INNER JOIN
                    personas AS p ON p.cve_personas = m.cve_medicos
                LEFT JOIN
                    medicos_especialidades AS me ON me.cve_medicos = m.cve_medicos
                LEFT JOIN
                    especialidades AS e ON e.cve_especialidad = me.cve_especialidad
                LEFT JOIN LATERAL (
                    SELECT
                        mc_sub.cve_medicos,
                        ARRAY_AGG(mc_sub.cve_medico_consultorio ORDER BY mc_sub.cve_medico_consultorio) AS cve_medico_consultorio_activos_en_sucursal
                    FROM
                        medicos_consultorios AS mc_sub
                    INNER JOIN
                        consultorios AS c_sub ON mc_sub.cve_consultorios = c_sub.cve_consultorios
                    WHERE
                        mc_sub.cve_medicos = m.cve_medicos
                        AND c_sub.cve_sucursales = $1
                        AND mc_sub.activo = TRUE
                        AND (mc_sub.fecha_fin IS NULL OR mc_sub.fecha_fin >= CURRENT_DATE)
                    GROUP BY
                        mc_sub.cve_medicos
                ) AS active_in_this_branch ON active_in_this_branch.cve_medicos = m.cve_medicos
                LEFT JOIN LATERAL ( -- NUEVO: Subconsulta para contar todos los consultorios en la sucursal
                    SELECT
                        mc_all.cve_medicos,
                        COUNT(mc_all.cve_consultorios) AS count_consultorios
                    FROM
                        medicos_consultorios AS mc_all
                    INNER JOIN
                        consultorios AS c_all ON mc_all.cve_consultorios = c_all.cve_consultorios
                    WHERE
                        mc_all.cve_medicos = m.cve_medicos
                        AND c_all.cve_sucursales = $1
                    GROUP BY
                        mc_all.cve_medicos
                ) AS all_consultorios_in_branch ON all_consultorios_in_branch.cve_medicos = m.cve_medicos
                WHERE
                    EXISTS (
                        SELECT 1
                        FROM medicos_consultorios AS mc_filter
                        INNER JOIN consultorios AS c_filter ON mc_filter.cve_consultorios = c_filter.cve_consultorios
                        WHERE mc_filter.cve_medicos = m.cve_medicos
                        AND c_filter.cve_sucursales = $1
                    )
                GROUP BY
                    m.cve_medicos,
                    p.nombre,
                    p.paterno,
                    p.materno,
                    m.activo,
                    p.email,
                    p.telefonos,
                    active_in_this_branch.cve_medicos,
                    active_in_this_branch.cve_medico_consultorio_activos_en_sucursal,
                    all_consultorios_in_branch.count_consultorios -- NUEVO: Añadido al GROUP BY
                ORDER BY
    nombre_medico;
            ` ;
            const { rows } = await pool.query(query, [cve]);
        
        return {
            success: true,
            data: rows
        };

        } catch (err) {
            console.error('Error al obtener medicosConsultorios:', err);
            throw new Error('Error al buscar medicosConsultorios en la base de datos');
        }
    }

    static async AsignadaAdmin({ cveSucursal, cveMedico }) {
    try {
        // Validar que ambos IDs sean números válidos
        if (!cveSucursal || isNaN(Number(cveSucursal))) {
            throw new Error('ID de sucursal no válido');
        }
        
        if (!cveMedico || isNaN(Number(cveMedico))) {
            throw new Error('ID de médico no válido');
        }

        const query = `
             WITH consultorios_ocupados AS (
    -- Identifica consultorios que están OCUPADOS por CUALQUIER OTRO médico activo y vigente
    SELECT DISTINCT mc.cve_consultorios
    FROM MEDICOS_CONSULTORIOS mc
    WHERE mc.activo = true 
      AND (mc.fecha_fin IS NULL OR mc.fecha_fin >= CURRENT_DATE)
      AND mc.cve_medicos != $2 -- $2 es cve_medicos: Ocupado por otro médico que no es el que estamos consultando
),
consultorios_medico AS (
    -- Obtiene TODAS las asignaciones (activas, inactivas, vencidas) para el médico específico ($2)
    SELECT 
        mc.cve_medico_consultorio,
        mc.cve_consultorios,
        mc.cve_medicos,
        mc.fecha_inicio,
        mc.fecha_fin,
        mc.activo as asignacion_activa,
        CASE 
            WHEN mc.activo = true AND (mc.fecha_fin IS NULL OR mc.fecha_fin >= CURRENT_DATE) THEN 'ACTIVO'
            WHEN mc.activo = false THEN 'DESACTIVADO'
            WHEN mc.fecha_fin < CURRENT_DATE THEN 'VENCIDO'
            ELSE 'SIN_ASIGNACION'
        END as estado_asignacion
    FROM MEDICOS_CONSULTORIOS mc
    WHERE mc.cve_medicos = $2 -- $2 es cve_medicos
)

SELECT DISTINCT
    s.cve_sucursales,
    s.nombre AS nombre_sucursal,
    p.cve_pisos,
    p.numero AS numero_piso, 
    p.nombre AS nombre_piso,
    c.cve_consultorios,
    c.nombre AS nombre_consultorio,
    c.numero AS numero_consultorio,
    c.activo AS consultorio_activo_general,
    cm.cve_medico_consultorio, 
    COALESCE(cm.cve_medicos, $2) AS cve_medicos_consultado, -- $2 es cve_medicos
    cm.fecha_inicio AS fecha_inicio_asignacion,
    cm.fecha_fin AS fecha_fin_asignacion,
    COALESCE(cm.estado_asignacion, 'NO_ASIGNADO') AS estado_asignacion_medico,
    COALESCE(cm.asignacion_activa, false) AS asignacion_activa_medico,
    
    CASE 
        WHEN cm.cve_medicos IS NOT NULL AND cm.estado_asignacion = 'ACTIVO' THEN 'ASIGNADO_A_ESTE_MEDICO'
        WHEN co.cve_consultorios IS NOT NULL THEN 'OCUPADO_POR_OTRO_MEDICO'
        ELSE 'DISPONIBLE'
    END AS estado_disponibilidad_consultorio

FROM 
    SUCURSALES s
INNER JOIN 
    PISOS p ON s.cve_sucursales = p.cve_sucursales
INNER JOIN 
    CONSULTORIOS c ON p.cve_pisos = c.cve_pisos
LEFT JOIN 
    consultorios_medico cm ON c.cve_consultorios = cm.cve_consultorios
LEFT JOIN
    consultorios_ocupados co ON c.cve_consultorios = co.cve_consultorios

WHERE 
    s.cve_sucursales = $1 -- $1 es cve_sucursales: Filtra por la sucursal específica
    AND c.activo = true 
    
ORDER BY 
    p.numero, 
    c.numero;
        `;
        
        const { rows } = await pool.query(query, [
            Number(cveSucursal), 
            Number(cveMedico)
        ]);
        
        if (rows.length === 0) {
            throw new Error('No se encontraron consultorios asignados');
        }

        return rows; // Devuelve directamente los resultados
        
    } catch (err) {
        console.error('Error en AsignadaAdmin:', {
            error: err.message,
            cveSucursal,
            cveMedico
        });
        throw err; // Relanza el error para que lo maneje el controlador
    }
}

    
}