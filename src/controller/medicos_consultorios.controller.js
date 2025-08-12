import { MedicosConsultoriosModel } from '../models/medicos_consultorios.model.js';
import { validarMedicosConsultorios, validarPartialMedicosConsultorios } from '../schemas/medicos_consultorios.schemas.js';


export class MedicosConsultoriosController {
    static async crear(req, res) {
        try {
            // Validación de datos
            const result = validarMedicosConsultorios(req.body);
            
            if (!result.success) {
                return res.status(400).json({ 
                    error: 'Datos inválidos',
                    details: JSON.parse(result.error.message) 
                });
            }

            // Creación en la base de datos
            const nuevoMedicosConsultorios = await MedicosConsultoriosModel.crear({ input: result.data });
            
            return res.status(201).json({
                success: true,
                data: nuevoMedicosConsultorios
            });

        } catch (error) {
            console.error('Error en nuevoMedicosConsultoriosController.crear:', error);
            
            // Manejo específico para errores de duplicados
            if (error.code === '23505') { // Código de violación de única restricción en PostgreSQL
                return res.status(409).json({
                    error: 'Registro duplicado',
                    message: 'El nuevoMedicosConsultorios ya existe en el sistema'
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
            
            const result = validarPartialMedicosConsultorios(req.body);

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

            const updatedMedicosConsultorios = await MedicosConsultoriosModel.update({ 
                cve: Number(cve),
                input: result.data 
            });

            if (!updatedMedicosConsultorios) {
                return res.status(404).json({ 
                    error: 'paciente no encontrada',
                    message: `No existe una medicoConsultorios con CVE: ${cve}`
                });
            }

            return res.json({
                success: true,
                message: 'medicoConsultorios actualizado correctamente',
                data: updatedMedicosConsultorios
            });

        } catch (error) {
            console.error('Error en medicoConsultoriosController.update:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }

    
        static async getAll(req, res) { 
                        try {
                            const pisos = await MedicosConsultoriosModel.getAll();
                            res.json(pisos);
                        } catch (error) { 
                            console.error("Error en el controlador al obtener medicoconsultorios:", error);
                            const errorMessage = error && typeof error === 'object' && 'message' in error
                                            ? error.message
                                            : "Error interno del servidor al obtener medicoconsultorios.";
                            res.status(500).json({ message: errorMessage });
                        }
                }

    static async Asignada(req, res) {
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
    
                console.log('Llamando a MedicosConsultoriosModel.Asignada con:', { cve }); 
                const medicos_consultorios = await  MedicosConsultoriosModel.Asignada({ cve });
                console.log('Resultado del modelo:', MedicosConsultoriosModel); 
                
                if (!medicos_consultorios) {
                    return res.status(404).json({ 
                        error: 'No encontrado',
                        message: 'serivico no encontrado' 
                    });
                }
    
                return res.json({
                    success: true,
                    data: medicos_consultorios
                });
    
            } catch (error) {
                console.error('Error completo en MedicosConsultoriosController.Asignada:', error);
                console.error('Stack trace:', error.stack); // Más detalles del error
                
                return res.status(500).json({
                    error: 'Error interno del servidor',
                    message: error.message
                });
        }
    
        
        }

    static async AsignarConsultorios(req, res) {
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
    
                console.log('Llamando a MedicosConsultoriosModel.Asignada con:', { cve }); 
                const medicos_consultorios = await  MedicosConsultoriosModel.AsignarConsultorios({ cve });
                console.log('Resultado del modelo:', MedicosConsultoriosModel); 
                
                if (!medicos_consultorios) {
                    return res.status(404).json({ 
                        error: 'No encontrado',
                        message: 'serivico no encontrado' 
                    });
                }
    
                return res.json({
                    success: true,
                    data: medicos_consultorios
                });
    
            } catch (error) {
                console.error('Error completo en MedicosConsultoriosController.Asignada:', error);
                console.error('Stack trace:', error.stack); // Más detalles del error
                
                return res.status(500).json({
                    error: 'Error interno del servidor',
                    message: error.message
                });
        }
    
        
        }

    static async getAllAdmin(req, res) {
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

            console.log('Llamando a MedicosModel.getAllAdmin con:', { cve }); 
            const medicos = await MedicosConsultoriosModel.getAllAdmin({ cve });
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
            console.error('Error completo en MedicosController.getAllAdmin:', error);
            console.error('Stack trace:', error.stack); // Más detalles del error
            
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
    }

    
    }

    static async AsignadaAdmin(req, res) {
        try {
            const { cveSucursal, cveMedico } = req.params;
            
            // Validar que ambos parámetros sean números válidos
            if (!cveSucursal || isNaN(Number(cveSucursal))) {
                return res.status(400).json({
                    error: 'ID de sucursal inválido',
                    message: 'El identificador de sucursal debe ser un número válido'
                });
            }
            
            if (!cveMedico || isNaN(Number(cveMedico))) {
                return res.status(400).json({
                    error: 'ID de médico inválido',
                    message: 'El identificador de médico debe ser un número válido'
                });
            }

            // Llamar al modelo con ambos parámetros
            const resultado = await MedicosConsultoriosModel.AsignadaAdmin({
                cveSucursal: Number(cveSucursal),
                cveMedico: Number(cveMedico)
            });
            
            if (!resultado || resultado.length === 0) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'No se encontraron consultorios asignados para esta combinación de sucursal y médico' 
                });
            }

            return res.json({
                success: true,
                data: resultado
            });

        } catch (error) {
            console.error('Error en AsignadaAdmin:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }
}