import { db } from '../config/db.js';
const { pool } = db;

export class ConsultoriosModel {
    static async crear({ input }) {
        const {
            cve_sucursales,
            cve_pisos,
            nombre,
            numero,
            activo
        } = input;

        const query = `
            INSERT INTO consultorios (
                cve_sucursales,cve_pisos,nombre,numero,activo
            )
            VALUES ($1, $2, $3, $4,$5)
            RETURNING *;
        `;

        const values = [
            cve_sucursales,
            cve_pisos,
            nombre,
            numero,
            activo
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
            const query = 'SELECT * FROM consultorios WHERE cve_consultorios = $1';
            const { rows } = await pool.query(query, [cve]);
            
            if (rows.length === 0) {
                return null; 
            }
            
            return rows[0];
        } catch (err) {
            console.error('Error al obtener consultorios:', err);
            throw new Error('Error al buscar consultorios en la base de datos');
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
                UPDATE consultorios 
                SET ${setClause}
                WHERE cve_consultorios = $${fields.length + 1}
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
                console.log(`No se encontró consultorios con CVE: ${cve}`);
                return null;
            }

            console.log(`consultorios con CVE ${cve} actualizada exitosamente`);
            return result.rows[0];

        } catch (error) {
            console.error('Error ejecutando UPDATE en la base de datos:', error);
            throw error;
        }
    }


    
    static async getAll() { 
        try {

            const query = `
                    
        SELECT cve_consultorios,c.cve_sucursales,s.nombre as sucursal,c.cve_pisos, c.nombre,c.numero,c.activo
        from  consultorios as c
        inner join pisos as p on p.cve_pisos = c.cve_pisos
        inner join sucursales as s on s.cve_sucursales = c.cve_sucursales
                            `;

            const { rows } = await pool.query(query); 
            return rows;
        } catch (error) {
            console.error("Error al obtener las pisos de la base de datos:", error);
            throw new Error("No se pudieron obtener las pisos.");
        }
    }

    
    static async getByCveSucursal({ cve }) {
    try {
        const query = 'SELECT * FROM consultorios WHERE cve_sucursales = $1';
        const { rows } = await pool.query(query, [cve]);

        if (rows.length === 0) {
            return null;
        }

        return rows; 
    } catch (err) {
        console.error('Error al obtener consultorios:', err);
        throw new Error('Error al buscar consultorios en la base de datos');
    }
}
}