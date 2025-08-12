import { ServiciosModel } from '../models/servicios.model.js';
import { validarServicios, validarPartialServicios } from '../schemas/servicios.schemas.js';


export class ServiciosController {
    static async crear(req, res) {
        try {
            // Validación de datos
            const result = validarServicios(req.body);
            
            if (!result.success) {
                return res.status(400).json({ 
                    error: 'Datos inválidos',
                    details: JSON.parse(result.error.message) 
                });
            }

            // Creación en la base de datos
            const nuevoServicios= await ServiciosModel.crear({ input: result.data });
            
            return res.status(201).json({
                success: true,
                data: nuevoServicios
            });

        } catch (error) {
            console.error('Error en ServiciosController.crear:', error);
            
            // Manejo específico para errores de duplicados
            if (error.code === '23505') { // Código de violación de única restricción en PostgreSQL
                return res.status(409).json({
                    error: 'Registro duplicado',
                    message: 'El serivico ya existe en el sistema'
                });
            }

            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }

    static async getOne(req, res) {
        try {
            console.log('req.params:', req.params); 
            const { cve } = req.params;
            console.log('CVE extraído:', cve); 
            
            if (!cve || isNaN(Number(cve))) {
                console.log('CVE inválido:', cve); 
                return res.status(400).json({
                    error: 'ID inválido',
                    message: 'El identificador debe ser un número válido'
                });
            }

            console.log('Llamando a ServiciosModel.getOne con:', { cve }); 
            const servicios = await  ServiciosModel.getOne({ cve });
            console.log('Resultado del modelo:', servicios); 
            
            if (!servicios) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'serivico no encontrado' 
                });
            }

            return res.json({
                success: true,
                data: servicios
            });

        } catch (error) {
            console.error('Error completo en ServiciosController.getOne:', error);
            console.error('Stack trace:', error.stack); // Más detalles del error
            
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
    }

    
    }

    static async update(req, res) {
        try {
            console.log('req.params:', req.params); 
            console.log('req.body:', req.body); 
            
            const result = validarPartialServicios(req.body);

            if (!result.success) {
                return res.status(400).json({ 
                    error: 'Datos de validación incorrectos',
                    details: result.error.errors 
                });
            }

            const { cve } = req.params;
            
            // Validar que cve sea un número
            if (!cve || isNaN(Number(cve))) {
                return res.status(400).json({
                    error: 'CVE inválido',
                    message: 'El CVE debe ser un número válido'
                });
            }

            const updatedServicios = await ServiciosModel.update({ 
                cve: Number(cve),
                input: result.data 
            });

            if (!updatedServicios) {
                return res.status(404).json({ 
                    error: 'consultorios no encontrada',
                    message: `No existe una serivicio con CVE: ${cve}`
                });
            }

            return res.json({
                success: true,
                message: 'serivicio actualizado correctamente',
                data: updatedServicios
            });

        } catch (error) {
            console.error('Error en serivicioController.update:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }

    static async getAll(req, res) { 
                        try {
                            const AllUser = await ServiciosModel.getAll();
                            res.json(AllUser);
                        } catch (error) { 
                            console.error("Error en el controlador al obtener servicios:", error);
                            const errorMessage = error && typeof error === 'object' && 'message' in error
                                            ? error.message
                                            : "Error interno del servidor al obtener servicios.";
                            res.status(500).json({ message: errorMessage });
                        }
                    }
            
}