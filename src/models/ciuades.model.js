// src/models/ciudades.model.ts
import { db } from '../config/db.js';
const { pool } = db;

export class CiudadesModel {
    static async getAll() { 
        try {

            const query = `
                SELECT 
                    c.nombre || ', ' || e.nombre AS nombre,
                    c.cve_ciudades as cve_ciudades,
                    c.cve_estados as cve_estados
                    FROM ciudades AS c
                    INNER JOIN estados AS e ON e.cve_estados = c.cve_estados
                    ORDER BY nombre ASC;

            `;

            const { rows } = await pool.query(query); 
            return rows;
        } catch (error) {
            console.error("Error al obtener las ciudades de la base de datos:", error);
            throw new Error("No se pudieron obtener las ciudades.");
        }
    }

}