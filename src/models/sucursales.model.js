import { db } from '../config/db.js';
const { pool } = db;

export class SucursalesModel {
     static async crear({ input }) {
    const {
        cve_ciudades,
        cve_estados,
        nombre,
        latitud,
        longitud
    } = input;

    const query = `
        INSERT INTO sucursales (
            cve_ciudades, cve_estados, nombre, latitud, longitud
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;

    const values = [
        cve_ciudades,
        cve_estados,
        nombre,
        latitud,
        longitud
    ];

    try {
        console.log('Query:', query);
        console.log('Values:', values);
        
        const { rows } = await pool.query(query, values);
        return rows[0];
    } catch (err) {
        console.error('Error completo:', err);
        throw err;
    }
}

    static async getOne({ cve }) {
        try {
            const query = 'SELECT * FROM sucursales WHERE cve_sucursales = $1';
            const { rows } = await pool.query(query, [cve]);
            
            if (rows.length === 0) {
                return null; 
            }
            
            return rows[0];
        } catch (err) {
            console.error('Error al obtener sucursales:', err);
            throw new Error('Error al buscar sucrsales en la base de datos');
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
                UPDATE sucursales 
                SET ${setClause}
                WHERE cve_sucursales = $${fields.length + 1}
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
                console.log(`No se encontró sucursales con CVE: ${cve}`);
                return null;
            }

            console.log(`sucursales con CVE ${cve} actualizada exitosamente`);
            return result.rows[0];

        } catch (error) {
            console.error('Error ejecutando UPDATE en la base de datos:', error);
            throw error;
        }
    }

    static async getAll() { 
        try {

            const query = `
                select cve_sucursales,s.nombre, (c.nombre,e.nombre) as ubicacion, s.cve_ciudades as cve_ciudades, s.latitud as latitud, s.longitud as longitud
                from sucursales as s
                inner join ciudades  as c on s.cve_ciudades = c.cve_ciudades
                inner join estados as e on c.cve_estados = e.cve_estados
            `;

            const { rows } = await pool.query(query); 
            return rows;
        } catch (error) {
            console.error("Error al obtener las suecursales de la base de datos:", error);
            throw new Error("No se pudieron obtener las suecursales.");
        }

    
    
    }
static async getsearch({ name }) {
    try {
        // PRIMERO: Ver qué ciudades existen
        const debugQuery = `SELECT DISTINCT nombre FROM ciudades ORDER BY nombre LIMIT 10`;
        const { rows: ciudades } = await pool.query(debugQuery);
        console.log('🏙️ CIUDADES DISPONIBLES:', ciudades.map(c => c.nombre));
        
const searchTerm = name.trim().toLowerCase();
        console.log('🔍 BUSCANDO:', searchTerm);
        
        // SEGUNDO: Ver qué ciudades coinciden con la búsqueda
        const matchQuery = `SELECT nombre FROM ciudades WHERE LOWER(nombre) LIKE $1`;
        const { rows: matches } = await pool.query(matchQuery, [searchTerm]);
        console.log('✅ CIUDADES QUE COINCIDEN:', matches.map(m => m.nombre));
        console.log('🧪 searchTerm FINAL USADO EN QUERY:', searchTerm);

        const query = `
            SELECT 
                s.cve_sucursales,
                s.nombre,
                c.nombre as ciudad,
                e.nombre as estado
            FROM sucursales s
            INNER JOIN ciudades c ON s.cve_ciudades = c.cve_ciudades
            INNER JOIN estados e ON s.cve_estados = e.cve_estados
            WHERE 
                LOWER(c.nombre) LIKE $1
            ORDER BY 
                c.nombre ASC,
                s.nombre ASC
            LIMIT 5
        `;
        
        const { rows } = await pool.query(query, [searchTerm]);
        
        console.log('📊 SUCURSALES ENCONTRADAS:', rows.length);
        console.log('📋 RESULTADOS:', rows);
        
        return rows;
        
    } catch (error) {
        console.error('Error en modelo getSearch:', error);
        throw new Error('Error al buscar sucursales en la base de datos');
    }
}

      static async distribucion({ cve }) {
    try {
        const query = `
            SELECT
            s.cve_sucursales,
            s.nombre AS nombre_sucursal,
            p.cve_pisos,
            p.numero AS numero_piso, 
            p.nombre AS nombre_piso,
            ARRAY_AGG(
                JSONB_BUILD_OBJECT(
                    'cve_consultorios', c.cve_consultorios,
                    'nombre_consultorio', c.nombre,
                    'numero_consultorio', c.numero,
                    'consultorio_activo', c.activo,
                    'estado_ocupacion', CASE
                                            WHEN current_assignment.cve_medicos IS NOT NULL THEN 'Ocupado'
                                            ELSE 'Disponible'
                                        END,
                    'cve_medico_actual', current_assignment.cve_medicos,
                    'nombre_medico_actual', current_assignment.nombre_medico_completo_actual,
                    'asignacion_mc_actual', current_assignment.cve_medico_consultorio
                )
                ORDER BY c.numero, c.nombre
            ) AS consultorios_en_piso
        FROM
            sucursales AS s
        INNER JOIN
            pisos AS p ON s.cve_sucursales = p.cve_sucursales
        INNER JOIN
            consultorios AS c ON p.cve_pisos = c.cve_pisos
        LEFT JOIN LATERAL (
            SELECT
                mc_sub.cve_medicos,
                (p_sub.nombre || ' ' || p_sub.paterno || ' ' || p_sub.materno) AS nombre_medico_completo_actual,
                mc_sub.cve_medico_consultorio
            FROM
                medicos_consultorios AS mc_sub
            INNER JOIN
                medicos AS m_sub ON mc_sub.cve_medicos = m_sub.cve_medicos
            INNER JOIN
                personas AS p_sub ON m_sub.cve_medicos = p_sub.cve_personas
            WHERE
                mc_sub.cve_consultorios = c.cve_consultorios
                AND mc_sub.activo = TRUE
                AND (mc_sub.fecha_fin IS NULL OR mc_sub.fecha_fin >= CURRENT_DATE)
            LIMIT 1
        ) AS current_assignment ON TRUE
        WHERE
            s.cve_sucursales = $1
            AND c.activo = TRUE
        GROUP BY
            s.cve_sucursales,
            s.nombre,
            p.cve_pisos,
            p.numero,
            p.nombre
        ORDER BY
            p.numero, p.nombre; 
        `;

        const { rows } = await pool.query(query, [cve]);

        // Los resultados ya vienen con el formato correcto
        return rows;

    } catch (err) {
        console.error('Error al obtener médicos de la sucursal:', err);
        throw new Error('Error al buscar médicos de la sucursal en la base de datos');
    }
}

}