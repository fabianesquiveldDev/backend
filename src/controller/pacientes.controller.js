import { PacientesModel } from '../models/pacientes.model.js';
import { validarPacientes, validarPartialPacientes } from '../schemas/paciente.schemas.js';


export class PacientesController {
    static async crear(req, res) {
        try {
            // Validación de datos
            const result = validarPacientes(req.body);
            
            if (!result.success) {
                return res.status(400).json({ 
                    error: 'Datos inválidos',
                    details: JSON.parse(result.error.message) 
                });
            }

            // Creación en la base de datos
            const nuevaPacientes = await PacientesModel.crear({ input: result.data });
            
            return res.status(201).json({
                success: true,
                data: nuevaPacientes
            });

        } catch (error) {
            console.error('Error en PacientesController.crear:', error);
            
            // Manejo específico para errores de duplicados
            if (error.code === '23505') { // Código de violación de única restricción en PostgreSQL
                return res.status(409).json({
                    error: 'Registro duplicado',
                    message: 'El paciente ya existe en el sistema'
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

            console.log('Llamando a PacientesModel.getOne con:', { cve }); 
            const pacientes = await PacientesModel.getOne({ cve });
            console.log('Resultado del modelo:', pacientes); 
            
            if (!pacientes) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'paciente no encontrado' 
                });
            }

            return res.json({
                success: true,
                data: pacientes
            });

        } catch (error) {
            console.error('Error completo en PacientesController.getOne:', error);
            console.error('Stack trace:', error.stack); // Más detalles del error
            
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
    }

    
    }

    static async getPorSucursal(req, res) {
        try {
            const { cve } = req.params;
            
            if (!cve || isNaN(Number(cve))) {
                return res.status(400).json({
                    error: 'CVE de sucursal inválido',
                    message: 'El identificador de sucursal debe ser un número válido'
                });
            }

            console.log('Obteniendo pacientes de la sucursal:', cve);
            
            const pacientes = await PacientesModel.getPorSucursal({ cve_sucursal: Number(cve) });
            
            return res.json({
                success: true,
                message: `Pacientes de la sucursal ${cve} obtenidos correctamente`,
                data: pacientes,
                total: pacientes.length
            });

        } catch (error) {
            console.error('Error en PacientesController.getPorSucursal:', error);
            
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }

    static async update(req, res) {
        try {
            console.log('req.params:', req.params); // Para debug
            console.log('req.body:', req.body); // Para debug
            
            const result = validarPartialPacientes(req.body);

            if (!result.success) {
                return res.status(400).json({ 
                    error: 'Datos de validación incorrectos',
                    details: result.error.errors // Mostrar errores de Zod correctamente
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

            const updatedPacientes = await PacientesModel.update({ 
                cve: Number(cve),
                input: result.data 
            });

            if (!updatedPacientes) {
                return res.status(404).json({ 
                    error: 'paciente no encontrada',
                    message: `No existe una persona con CVE: ${cve}`
                });
            }

            return res.json({
                success: true,
                message: 'paciente actualizado correctamente',
                data: updatedPacientes
            });

        } catch (error) {
            console.error('Error en PacienteController.update:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }
}