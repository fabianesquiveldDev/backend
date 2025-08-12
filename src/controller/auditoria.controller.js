import { AuditoriaModel } from '../models/auditoria.model.js';


export class AuditoriaRouteController {
    static async crear(req, res) {
            // Creación en la base de datos
            const nuevaAuditoria = await AuditoriaModel.crear({ input: req.body });
            
            return res.status(201).json({
                success: true,
                data: nuevaAuditoria
            });

        } catch (error) {
            console.error('Error en AuditoriaRouteController.crear:', error);

            // Manejo específico para errores de duplicados
            if (error.code === '23505') { // Código de violación de única restricción en PostgreSQL
                return res.status(409).json({
                    error: 'Registro duplicado',
                    message: 'El auditoria ya existe en el sistema'
                });
            }

            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }

        static async getAll(req, res) { 
                        try {
                            const auditorias = await AuditoriaModel.getAll();
                            res.json(auditorias);
                        } catch (error) { 
                            console.error("Error en el controlador al obtener auditorías:", error);
                            const errorMessage = error && typeof error === 'object' && 'message' in error
                                            ? error.message
                                            : "Error interno del servidor al obtener auditorías.";
                            res.status(500).json({ message: errorMessage });
                        }
        }
    }
    
