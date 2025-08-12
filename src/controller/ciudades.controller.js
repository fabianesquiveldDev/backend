import { CiudadesModel } from "../models/ciuades.model.js";



export class CiudadesController {
    static async getAll(req, res) { 
        try {
            const ciudades = await CiudadesModel.getAll();
            res.json(ciudades);
        } catch (error) { 
            console.error("Error en el controlador al obtener ciudades:", error);
            const errorMessage = error && typeof error === 'object' && 'message' in error
                            ? error.message
                            : "Error interno del servidor al obtener ciudades.";
            res.status(500).json({ message: errorMessage });
        }
    }
}