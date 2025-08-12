import { SituacionConyugalModel } from '../models/sutuacionConyugal.model.js';

export class SituacionConyugalController {
    
        static async getAll(req, res) { 
                try {
                    const pisos = await SituacionConyugalModel.getAll();
                    res.json(pisos);
                } catch (error) { 
                    console.error("Error en el controlador al obtener sutuacionConyugal:", error);
                    const errorMessage = error && typeof error === 'object' && 'message' in error
                                    ? error.message
                                    : "Error interno del servidor al obtener sutuacionConyugal.";
                    res.status(500).json({ message: errorMessage });
                }
            }
}