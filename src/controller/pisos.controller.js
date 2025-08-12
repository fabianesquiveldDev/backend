import { PisosModel } from '../models/pisos.model.js';
import { validarPisos, validarPartialPisos } from '../schemas/pisos.schemas.js';


export class PisosController {
    static async crear(req, res) {
        try {
            // Validación de datos
            const result = validarPisos(req.body);
            
            if (!result.success) {
                return res.status(400).json({ 
                    error: 'Datos inválidos',
                    details: JSON.parse(result.error.message) 
                });
            }

            // Creación en la base de datos
            const nuevoPisos = await PisosModel.crear({ input: result.data });
            
            return res.status(201).json({
                success: true,
                data: nuevoPisos
            });

        } catch (error) {
            console.error('Error en SucursalesController.crear:', error);
            
            // Manejo específico para errores de duplicados
            if (error.code === '23505') { // Código de violación de única restricción en PostgreSQL
                return res.status(409).json({
                    error: 'Registro duplicado',
                    message: 'El piso ya existe en el sistema'
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

            console.log('Llamando a PisosModel.getOne con:', { cve }); 
            const pisos = await PisosModel.getOne({ cve });
            console.log('Resultado del modelo:', pisos); 
            
            if (!pisos) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'paciente no encontrado' 
                });
            }

            return res.json({
                success: true,
                data: pisos
            });

        } catch (error) {
            console.error('Error completo en pisosController.getOne:', error);
            console.error('Stack trace:', error.stack); // Más detalles del error
            
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
            
            const result =validarPartialPisos(req.body);

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

            const updatedPisos = await PisosModel.update({ 
                cve: Number(cve),
                input: result.data 
            });

            if (!updatedPisos) {
                return res.status(404).json({ 
                    error: 'paciente no encontrada',
                    message: `No existe una persona con CVE: ${cve}`
                });
            }

            return res.json({
                success: true,
                message: 'pisos actualizado correctamente',
                data: updatedPisos
            });

        } catch (error) {
            console.error('Error en písosController.update:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }


    
        static async getAll(req, res) { 
                try {
                    const pisos = await PisosModel.getAll();
                    res.json(pisos);
                } catch (error) { 
                    console.error("Error en el controlador al obtener pisos:", error);
                    const errorMessage = error && typeof error === 'object' && 'message' in error
                                    ? error.message
                                    : "Error interno del servidor al obtener pisos.";
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

        const pisos = await PisosModel.getByCveSucursal({ cve: Number(cve) });

        if (!pisos || pisos.length === 0) {
            return res.status(404).json({ 
                error: 'No encontrado',
                message: 'No se encontraron pisos para la sucursal especificada' 
            });
        }

        return res.json({
            success: true,
            data: pisos
        });

    } catch (error) {
        console.error('Error en pisosController.getByCveSucursal:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
}



}