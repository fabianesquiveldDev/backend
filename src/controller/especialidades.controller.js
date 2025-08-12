import { EspecialidadesModel } from '../models/especialidades.model.js';
import { validarEspecialidades, validarPartialEspecialidades } from '../schemas/especialidades.schemas.js';


export class EspecialidadesController {
    static async crear(req, res) {
        try {
            // Validación de datos
            const result = validarEspecialidades(req.body);
            
            if (!result.success) {
                return res.status(400).json({ 
                    error: 'Datos inválidos',
                    details: JSON.parse(result.error.message) 
                });
            }

            // Creación en la base de datos
            const nuevasEspecialidades= await EspecialidadesModel.crear({ input: result.data });
            
            return res.status(201).json({
                success: true,
                data: nuevasEspecialidades
            });

        } catch (error) {
            console.error('Error en EspecialidadesController.crear:', error);
            
            // Manejo específico para errores de duplicados
            if (error.code === '23505') { // Código de violación de única restricción en PostgreSQL
                return res.status(409).json({
                    error: 'Registro duplicado',
                    message: 'La especialidad ya existe en el sistema'
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

            console.log('Llamando a especialidadesModel.getOne con:', { cve }); 
            const especialidades = await  EspecialidadesModel.getOne({ cve });
            console.log('Resultado del modelo:', especialidades); 
            
            if (!especialidades) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'serivico no encontrado' 
                });
            }

            return res.json({
                success: true,
                data: especialidades
            });

        } catch (error) {
            console.error('Error completo en EspecialidadesController.getOne:', error);
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
            
            const result = validarPartialEspecialidades(req.body);

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

            const updatedEsoecialidades = await EspecialidadesModel.update({ 
                cve: Number(cve),
                input: result.data 
            });

            if (!updatedEsoecialidades) {
                return res.status(404).json({ 
                    error: 'especialidades no encontrada',
                    message: `No existe una especialidades con CVE: ${cve}`
                });
            }

            return res.json({
                success: true,
                message: 'especialidades actualizado correctamente',
                data: updatedEsoecialidades
            });

        } catch (error) {
            console.error('Error en EspecialidadesController.update:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }

    static async getAll(req, res) { 
                    try {
                        const pisos = await EspecialidadesModel.getAll();
                        res.json(pisos);
                    } catch (error) { 
                        console.error("Error en el controlador al obtener especialidades:", error);
                        const errorMessage = error && typeof error === 'object' && 'message' in error
                                        ? error.message
                                        : "Error interno del servidor al obtener especialidades.";
                        res.status(500).json({ message: errorMessage });
                    }
            }
}