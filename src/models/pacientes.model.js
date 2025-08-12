import { db } from '../config/db.js';
const { pool } = db;

export class PacientesModel {
    static async crear({ input }) {
        const {
            cve_pacientes,
            fecha_ingreso,
            activo,
        } = input;

        const query = `
            INSERT INTO pacientes (
                cve_pacientes, fecha_ingreso, activo
            )
            VALUES ($1, $2, $3)
            RETURNING *;
        `;

        const values = [
            cve_pacientes,
            fecha_ingreso,
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
            const query = 'SELECT * FROM pacientes WHERE cve_pacientes = $1';
            const { rows } = await pool.query(query, [cve]);
            
            if (rows.length === 0) {
                return null; 
            }
            
            return rows[0];
        } catch (err) {
            console.error('Error al obtener pacientes:', err);
            throw new Error('Error al buscar pacientes en la base de datos');
        }
    }

    static async getPorSucursal({ cve_sucursal }) {
        try {
            const query = `
                SELECT 
    pa.cve_pacientes,
    pa.fecha_ingreso,
    pa.activo,
    CONCAT(p.nombre, ' ', p.paterno, ' ', COALESCE(p.materno, '')) AS nombre_completo,
    p.email,
    p.telefonos AS telefono,  -- Corregido: el campo es telefonos (no telefono)
    p.fecha_nacimiento,
    s.nombre AS sucursal_nombre
FROM pacientes pa
JOIN personas p ON pa.cve_pacientes = p.cve_personas
JOIN citas c ON pa.cve_pacientes = c.cve_pacientes
JOIN medicos_consultorios mc ON c.cve_medico_consultorio = mc.cve_medico_consultorio  -- Necesario para llegar a sucursal
JOIN consultorios co ON mc.cve_consultorios = co.cve_consultorios
JOIN sucursales s ON co.cve_sucursales = s.cve_sucursales  -- Relación corregida
WHERE s.cve_sucursales = $1  -- Corregido: el campo es cve_sucursales (no cve_sucursal)
    AND pa.activo = true  -- Filtro adicional recomendado
GROUP BY 
    pa.cve_pacientes, 
    pa.fecha_ingreso, 
    pa.activo, 
    p.nombre, 
    p.paterno, 
    p.materno, 
    p.email, 
    p.telefonos, 
    p.fecha_nacimiento, 
    s.nombre
ORDER BY p.nombre, p.paterno;
            `;
            
            const { rows } = await pool.query(query, [cve_sucursal]);
            
            return rows;
        } catch (err) {
            console.error('Error al obtener pacientes por sucursal:', err);
            throw new Error('Error al buscar pacientes de la sucursal en la base de datos');
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
                UPDATE pacientes 
                SET ${setClause}
                WHERE cve_pacientes = $${fields.length + 1}
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
                console.log(`No se encontró paciente con CVE: ${cve}`);
                return null;
            }

            console.log(`paciente con CVE ${cve} actualizada exitosamente`);
            return result.rows[0];

        } catch (error) {
            console.error('Error ejecutando UPDATE en la base de datos:', error);
            throw error;
        }
    }

    static async obtenrNombrePacinetes(cve_pacientes) {
    try {
        const query = `
            SELECT
                CONCAT(p.nombre, ' ', p.paterno, ' ', p.materno) AS NombreCompletoPaciente,
                p.email,
                pa.cve_pacientes
            FROM PACIENTES pa
            JOIN PERSONAS p ON pa.cve_pacientes = p.cve_personas
            WHERE pa.cve_pacientes = $1;
        `;
        const { rows } = await pool.query(query, [cve_pacientes]);

        return rows[0] || null; // Retorna solo un objeto o null si no existe
    } catch (err) {
        console.error('Error al obtener el nombre del pacinete:', err);
        throw new Error('Error al buscar el nomre del paciente en la base de datos');
    }
}


}