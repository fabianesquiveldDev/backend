import { db } from '../config/db.js';
const { pool } = db;

export class SucursalServiciosModel {
    static async crear({ input }) {
        const {
            cve_servicios,
            cve_sucursales,
            active,
        } = input;

        const query = `
            INSERT INTO sucursal_servicios (
                cve_servicios, cve_sucursales, active
            )
            VALUES ($1, $2, $3)
            RETURNING *;
        `;

        const values = [
            cve_servicios,
            cve_sucursales,
            active,
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
            throw new Error('Error al buscar sucursales en la base de datos');
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
                UPDATE sucursal_servicios
                SET ${setClause}
                WHERE cve_servicios = $${fields.length + 1}
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
                console.log(`No se encontró sucursal_servicios con CVE: ${cve}`);
                return null;
            }

            console.log(`Sucursal_servicios con CVE ${cve} actualizado exitosamente`);
            return result.rows[0];

        } catch (error) {
            console.error('Error ejecutando UPDATE en la base de datos:', error);
            throw error;
        }
    }

    static async getAll({ cve }) { 
        try {
            const query = `
                SELECT
                    SU.cve_sucursales,
                    SU.nombre AS nombre_sucursal,
                    CASE
                        WHEN SS.cve_servicios IS NOT NULL AND SS.active = TRUE THEN TRUE
                        ELSE FALSE
                    END AS esta_activo
                FROM
                    sucursales AS SU
                LEFT JOIN
                    sucursal_servicios AS SS ON SU.cve_sucursales = SS.cve_sucursales
                    AND SS.cve_servicios = $1
                ORDER BY
                    nombre_sucursal;
            `;

            const { rows } = await pool.query(query, [cve]); 
            return rows;
        } catch (error) {
            console.error("Error al obtener las sucursales_servicios de la base de datos:", error);
            throw new Error("No se pudieron obtener las sucursales_servicios.");
        }
    }

    static async getSucursalesServicios() { 
        try {
            const query = `
                SELECT 
                    s.cve_sucursales,
                    s.nombre AS nombre_sucursal,
                    s.latitud,
                    s.longitud,
                    ARRAY(
                        SELECT sv.nombre
                        FROM sucursal_servicios ss
                        JOIN servicios sv ON ss.cve_servicios = sv.cve_servicios
                        WHERE ss.cve_sucursales = s.cve_sucursales
                        AND ss.active = true
                    ) AS servicios_activos
                FROM sucursales s
                ORDER BY s.nombre;
            `;

            const { rows } = await pool.query(query); 
            return rows;
        } catch (error) {
            console.error("Error al obtener las sucursales_servicios de la base de datos:", error);
            throw new Error("No se pudieron obtener las sucursales_servicios.");
        }
    }

    static async upsert({ cve_servicios, cve_sucursales, active }) {
        try {
            console.log('=== INICIO UPSERT ===');
            console.log('Datos recibidos en model:', { 
                cve_servicios, 
                cve_sucursales, 
                active, 
                typeOfActive: typeof active 
            });
            
            // Asegurar que active sea boolean
            let activeBoolean;
            if (typeof active === 'boolean') {
                activeBoolean = active;
            } else if (typeof active === 'string') {
                activeBoolean = active === 'true';
            } else if (typeof active === 'number') {
                activeBoolean = active === 1;
            } else {
                activeBoolean = Boolean(active);
            }

            console.log('Active convertido a boolean:', activeBoolean);

            // Validar que los parámetros sean válidos
            if (!cve_servicios || !cve_sucursales) {
                throw new Error('cve_servicios y cve_sucursales son requeridos');
            }

            // Convertir a números para asegurar tipos correctos
            const cveServiciosNum = parseInt(cve_servicios);
            const cveSucursalesNum = parseInt(cve_sucursales);

            console.log('Parámetros finales:', {
                cve_servicios: cveServiciosNum,
                cve_sucursales: cveSucursalesNum,
                active: activeBoolean
            });

            // Verificar que la tabla existe
            const checkTableQuery = `
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'sucursal_servicios'
                ORDER BY ordinal_position;
            `;
            
            console.log('Verificando estructura de tabla...');
            const tableInfo = await pool.query(checkTableQuery);
            console.log('Estructura de tabla:', tableInfo.rows);

            // Query para PostgreSQL - sin campos created_at/updated_at
            const query = `
                INSERT INTO sucursal_servicios (cve_servicios, cve_sucursales, active) 
                VALUES ($1, $2, $3)
                ON CONFLICT (cve_servicios, cve_sucursales) 
                DO UPDATE SET active = EXCLUDED.active
                RETURNING *;
            `;
            
            console.log('Ejecutando query:', query);
            console.log('Con parámetros:', [cveServiciosNum, cveSucursalesNum, activeBoolean]);
            
            const result = await pool.query(query, [cveServiciosNum, cveSucursalesNum, activeBoolean]);
            
            console.log('Resultado de la query:', result.rows);
            console.log('=== FIN UPSERT EXITOSO ===');
            
            if (!result.rows || result.rows.length === 0) {
                throw new Error('No se pudo ejecutar la operación upsert');
            }

            const row = result.rows[0];
            
            return {
                cve_servicios: row.cve_servicios,
                cve_sucursales: row.cve_sucursales,
                active: row.active,
                wasCreated: true
            };

        } catch (error) {
            console.error('=== ERROR EN UPSERT ===');
            console.error('Error completo:', error);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Error detail:', error.detail);
            console.error('Error hint:', error.hint);
            console.error('Error stack:', error.stack);
            console.error('=== FIN ERROR ===');
            throw error;
        }
    }
    
    static async obtenerTodosPlayerIdsMoviles() {
        try {
            const query = `
                SELECT player_id, cve_usuarios
                FROM dispositivos_usuarios
                WHERE player_id IS NOT NULL
                AND plataforma = 'mobile';
            `;
            
            const result = await pool.query(query);
            return result.rows; // devuelve array de { cve_usuarios, player_id }
        } catch (error) {
            console.error('Error al obtener player IDs móviles:', error);
            throw new Error('Error al buscar player IDs móviles en la base de datos');
        }
    }
}