import { MedicosModel } from '../models/medicos.model.js';
import { validarMedicos, validarPartialMedicos } from '../schemas/medicos.schemas.js';


export class MedicosController {
    static async crear(req, res) {
        try {
            // Validación de datos
            const result = validarMedicos(req.body);
            
            if (!result.success) {
                return res.status(400).json({ 
                    error: 'Datos inválidos',
                    details: JSON.parse(result.error.message) 
                });
            }

            // Creación en la base de datos
            const nuevoMedicos = await MedicosModel.crear({ input: result.data });
            
            return res.status(201).json({
                success: true,
                data: nuevoMedicos
            });

        } catch (error) {
            console.error('Error en MedicosController.crear:', error);
            
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

            console.log('Llamando a MedicosModel.getOne con:', { cve }); 
            const medicos = await MedicosModel.getOne({ cve });
            console.log('Resultado del modelo:', medicos); 
            
            if (!medicos) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'paciente no encontrado' 
                });
            }

            return res.json({
                success: true,
                data: medicos
            });

        } catch (error) {
            console.error('Error completo en MedicosController.getOne:', error);
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
            
            const result = validarPartialMedicos(req.body);

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

            const updatedMedicos = await MedicosModel.update({ 
                cve: Number(cve),
                input: result.data 
            });

            if (!updatedMedicos) {
                return res.status(404).json({ 
                    error: 'paciente no encontrada',
                    message: `No existe una medico con CVE: ${cve}`
                });
            }

            return res.json({
                success: true,
                message: 'medico actualizado correctamente',
                data: updatedMedicos
            });

        } catch (error) {
            console.error('Error en medicoController.update:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }

    
    static async getAll(req, res) { 
                        try {
                            const pisos = await MedicosModel.getAll();
                            res.json(pisos);
                        } catch (error) { 
                            console.error("Error en el controlador al obtener medico:", error);
                            const errorMessage = error && typeof error === 'object' && 'message' in error
                                            ? error.message
                                            : "Error interno del servidor al obtener medico.";
                            res.status(500).json({ message: errorMessage });
                        }
    }

    static async getSucursal(req, res) {
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

            console.log('Llamando a MedicosModel.getSucursal con:', { cve }); 
            const medicos = await MedicosModel.getSucursal({ cve });
            console.log('Resultado del modelo:', medicos); 
            
            if (!medicos) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'paciente no encontrado' 
                });
            }

            return res.json({
                success: true,
                data: medicos
            });

        } catch (error) {
            console.error('Error completo en MedicosController.getSucursal:', error);
            console.error('Stack trace:', error.stack); // Más detalles del error
            
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
    }

    
    }
}