import { db } from '../config/db.js';
const { pool } = db;

export class PersonaModel {
    static async crear({ input }) {
        const {
            cve_situacion_conyugal,
            nombre,
            paterno,
            materno,
            curp,
            direccion,
            rfc,
            telefonos,
            fecha_nacimiento,
            fotografia,
            sexo,
            email
        } = input;

        const query = `
            INSERT INTO personas (
                cve_situacion_conyugal, nombre, paterno, materno, 
                curp, direccion, rfc, telefonos, fecha_nacimiento, 
                fotografia, sexo, email
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;
        `;

        const values = [
            cve_situacion_conyugal,
            nombre,
            paterno,
            materno,
            curp,
            direccion,
            rfc,
            telefonos,
            fecha_nacimiento,
            fotografia,
            sexo,
            email
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
            const query = 'SELECT * FROM personas WHERE cve_personas = $1';
            const { rows } = await pool.query(query, [cve]);
            
            if (rows.length === 0) {
                return null; 
            }
            
            return rows[0];
        } catch (err) {
            console.error('Error al obtener persona:', err);
            throw new Error('Error al buscar persona en la base de datos');
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
                UPDATE personas 
                SET ${setClause}
                WHERE cve_personas = $${fields.length + 1}
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
                console.log(`No se encontró persona con CVE: ${cve}`);
                return null;
            }

            console.log(`✅ Persona con CVE ${cve} actualizada exitosamente`);
            return result.rows[0];

        } catch (error) {
            console.error('❌ Error ejecutando UPDATE en la base de datos:', error);
            throw error;
        }
    }

    static async getCurrentImage(cve) {
    try {
        const query = `
            SELECT fotografia 
            FROM personas 
            WHERE cve_personas = $1;
        `;
        
        const result = await pool.query(query, [Number(cve)]);
        
        if (result.rowCount === 0) {
            return null;
        }
        
        return result.rows[0].fotografia;
    } catch (error) {
        console.error('❌ Error obteniendo imagen actual:', error);
        throw error;
    }
}

static async checkCurp({ curp }) {
    try {
        const query = 'SELECT COUNT(*) as count FROM personas WHERE curp = $1';
        const result = await pool.query(query, [curp]);
        return result.rows[0].count > 0;
    } catch (error) {
        console.error('Error en PersonaModel.checkCurp:', error);
        throw error;
    }
}

static async checkRfc({ rfc }) {
    try {
        const query = 'SELECT COUNT(*) as count FROM personas WHERE rfc = $1';
        const result = await pool.query(query, [rfc]);
        return result.rows[0].count > 0;
    } catch (error) {
        console.error('Error en PersonaModel.checkRfc:', error);
        throw error;
    }
}

static async checkEmail({ email }) {
    try {
        const query = 'SELECT COUNT(*) as count FROM personas WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0].count > 0;
    } catch (error) {
        console.error('Error en PersonaModel.checkEmail:', error);
        throw error;
    }
}

static async checkTelefono({ telefono }) {
    try {
        const query = 'SELECT COUNT(*) as count FROM personas WHERE telefonos = $1';
        const result = await pool.query(query, [telefono]);
        return result.rows[0].count > 0;
    } catch (error) {
        console.error('Error en PersonaModel.checkTelefono:', error);
        throw error;
    }
}

}