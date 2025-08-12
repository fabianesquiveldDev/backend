import { db } from '../config/db.js';
const { pool } = db;

export class MedicosEspecialidadesModel {
    static async crear({ input }) {
        const {   
            cve_medicos,
            cve_especialidad
        } = input;

        const query = `
            INSERT INTO medicos_especialidades (
                cve_medicos, cve_especialidad
            )
            VALUES ($1,$2)
            RETURNING *;
        `;

        const values = [
            cve_medicos,
            cve_especialidad,
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


    
    static async noAsignada({ cve }) {
    try {
        // Validar que el ID del médico sea un número válido
        if (!cve || isNaN(Number(cve))) {
            throw new Error('ID de médico no válido');
        }

        const query = `
            SELECT
                e.cve_especialidad,
                e.nombre AS nombre_especialidad
            FROM
                especialidades AS e
            LEFT JOIN
                medicos_especialidades AS me 
                ON e.cve_especialidad = me.cve_especialidad 
                AND me.cve_medicos = $1
            WHERE
                me.cve_especialidad IS NULL
            ORDER BY
                e.cve_especialidad ASC;
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
        throw new Error('Error al obtener especialidades no asignadas');
    }
    }



    static async Asignada({ cve }) {
    try {
        // Validar que el ID del médico sea un número válido
        if (!cve || isNaN(Number(cve))) {
            throw new Error('ID de médico no válido');
        }

        const query = `
            SELECT
                e.cve_especialidad,
                e.nombre AS nombre_especialidad
            FROM
                especialidades AS e
            LEFT JOIN
                medicos_especialidades AS me 
                ON e.cve_especialidad = me.cve_especialidad 
                AND me.cve_medicos = $1
            WHERE
                not (me.cve_especialidad IS NULL)
            ORDER BY
                e.cve_especialidad ASC;
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
        throw new Error('Error al obtener especialidades no asignadas');
    }
    }

    static async eliminar({ cve_medicos, cve_especialidad }) {
    const query = `
        DELETE FROM medicos_especialidades
        WHERE cve_medicos = $1 AND cve_especialidad = $2;
    `;

    try {
        const resultado = await pool.query(query, [cve_medicos, cve_especialidad]);
        return resultado; 
    } catch (error) {
        console.error('Error al eliminar la relación médico-especialidad:', error);
        throw error;
    }
}

}