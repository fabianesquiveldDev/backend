// src/models/UsuarioModel.js
import { db } from '../config/db.js';
const { pool } = db;


export class UsuariosSucursalesModel {
    static async crear({ input }) {
        const {
            cve_usuarios,
            cve_sucursales, 
            active
        } = input;

        const query = `
            INSERT INTO usuarios_sucursales (
                cve_usuarios, cve_sucursales, active
            )
            VALUES ($1, $2, $3)
            RETURNING *;
        `;

        const values = [
            cve_usuarios,
            cve_sucursales,
            active
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
                UPDATE usuarios_sucursales 
                SET ${setClause}
                WHERE cve_usuario_sucursal = $${fields.length + 1}
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
                console.log(`No se encontró usuarios_sucursales con CVE: ${cve}`);
                return null;
            }

            console.log(`usuarios_sucursales con CVE ${cve} actualizada exitosamente`);
            return result.rows[0];

        } catch (error) {
            console.error('Error ejecutando UPDATE en la base de datos:', error);
            throw error;
        }
    }    
    
}
