import { db } from '../config/db.js';
const { pool } = db;

export class AuditoriaModel {
    static async crear({ input }) {
        const {
            tabla_afectada,
            operacion,
            clave_registro,
            usuario,
            descripcion_cambio
        } = input;

        const query = `
            INSERT INTO auditoria (
                tabla_afectada, operacion, clave_registro, usuario, descripcion_cambio
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;

        const values = [
            tabla_afectada,
            operacion,
            clave_registro,
            usuario,
            descripcion_cambio
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

     static async getAll() { 
        try {

            const query = `
                        select 
                        A.*, U.nombre_usuario as nombre_usuario
                        from auditoria as A
                        inner join usuarios as U on A.usuario = U.cve_usuarios
                            `;

            const { rows } = await pool.query(query); 
            return rows;
        } catch (error) {
            console.error("Error al obtener las auditorías de la base de datos:", error);
            throw new Error("No se pudieron obtener las auditorías.");
        }
    }


}