import { db } from '../config/db.js';
const { pool } = db;

export class SituacionConyugalModel {
    static async getAll() { 
        try {

            const query = `
                
            select cve_situacion_conyugal, nombre as nombreSituacionConyugal 
            from SITUACIONES_CONYUGALES
                            `;

            const { rows } = await pool.query(query); 
            return rows;
        } catch (error) {
            console.error("Error al obtener las sutuacionConyugal de la base de datos:", error);
            throw new Error("No se pudieron obtener las sutuacionConyugal.");
        }
    }
}