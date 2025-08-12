import { ConsultoriosModel } from '../models/consultorios.model.js';
import { validarConsultorios, validarPartialConsultorios } from '../schemas/consultorios.schemas.js';


export class ConsultoriosController {
    static async crear(req, res) {
        try {
            // Validación de datos
            const result = validarConsultorios(req.body);
            
            if (!result.success) {
                return res.status(400).json({ 
                    error: 'Datos inválidos',
                    details: JSON.parse(result.error.message) 
                });
            }

            // Creación en la base de datos
            const nuevoConsultorios = await ConsultoriosModel.crear({ input: result.data });
            
            return res.status(201).json({
                success: true,
                data: nuevoConsultorios
            });

        } catch (error) {
            console.error('Error en ConsultoriosController.crear:', error);
            
            // Manejo específico para errores de duplicados
            if (error.code === '23505') { // Código de violación de única restricción en PostgreSQL
                return res.status(409).json({
                    error: 'Registro duplicado',
                    message: 'El medico ya existe en el sistema'
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

            console.log('Llamando a ConsultoriosModel.getOne con:', { cve }); 
            const consultorios = await  ConsultoriosModel.getOne({ cve });
            console.log('Resultado del modelo:', consultorios); 
            
            if (!consultorios) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'consultorios no encontrado' 
                });
            }

            return res.json({
                success: true,
                data: consultorios
            });

        } catch (error) {
            console.error('Error completo en ConsultoriosController.getOne:', error);
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
            
            const result = validarPartialConsultorios(req.body);

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

            const updatedConsultorios = await ConsultoriosModel.update({ 
                cve: Number(cve),
                input: result.data 
            });

            if (!updatedConsultorios) {
                return res.status(404).json({ 
                    error: 'consultorios no encontrada',
                    message: `No existe una consultorios con CVE: ${cve}`
                });
            }

            return res.json({
                success: true,
                message: 'consultorios actualizado correctamente',
                data: updatedConsultorios
            });

        } catch (error) {
            console.error('Error en consultoriosController.update:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }


    
            static async getAll(req, res) { 
                    try {
                        const consultorios = await ConsultoriosModel.getAll();
                        res.json(consultorios);
                    } catch (error) { 
                        console.error("Error en el controlador al obtener consultorios:", error);
                        const errorMessage = error && typeof error === 'object' && 'message' in error
                                        ? error.message
                                        : "Error interno del servidor al obtener consultorios.";
                        res.status(500).json({ message: errorMessage });
                    }
                }
    
                
    static async getByCveSucursal(req, res) {
        try {
            const { cve } = req.params;
    
            if (!cve || isNaN(Number(cve))) {
                return res.status(400).json({
                    error: 'ID inválido',
                    message: 'El identificador debe ser un número válido'
                });
            }
    
            const consultorios = await ConsultoriosModel.getByCveSucursal({ cve: Number(cve) });
    
            if (!consultorios || consultorios.length === 0) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'No se encontraron pisos para la sucursal especificada' 
                });
            }
    
            return res.json({
                success: true,
                data: consultorios
            });
    
        } catch (error) {
            console.error('Error en consultoriosController.getByCveSucursal:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }
}