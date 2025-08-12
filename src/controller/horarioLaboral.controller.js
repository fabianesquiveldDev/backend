import { HorarioLaboralModel } from '../models/horarioLaboral.model.js';

export class HorarioLaboralController {

    static async upsert(req, res) {
        try {
        const {
            cve_medicos,
            cve_dias,
            cve_medico_consultorio,
            horario_inicio,
            horario_fin,
            activo
        } = req.body;

        if (
            !cve_medicos || !cve_dias || !cve_medico_consultorio ||
            !horario_inicio || !horario_fin || activo === undefined
        ) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const result = await HorarioLaboralModel.upsert({
            cve_medicos,
            cve_dias,
            cve_medico_consultorio,
            horario_inicio,
            horario_fin,
            activo
        });

        res.status(200).json({
            message: 'Horario laboral registrado correctamente',
            data: result
        });
        } catch (error) {
        console.error('Error en upsert de horario laboral:', error);
        res.status(500).json({ error: 'Error al registrar el horario laboral' });
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

            console.log('Llamando a horarioLaboral.getOne con:', { cve }); 
            const horarioLaboral = await  HorarioLaboralModel.getOne({ cve });
            console.log('Resultado del modelo:', horarioLaboral); 
            
            if (!horarioLaboral) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'serivico no encontrado' 
                });
            }

            return res.json({
                success: true,
                data: horarioLaboral
            });

        } catch (error) {
            console.error('Error completo en horarioLaboralController.getOne:', error);
            console.error('Stack trace:', error.stack); 
            
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
    static async getAllDias(req, res) { 
                    try {
                        const dias = await HorarioLaboralModel.getAllDias();
                        res.json(dias);
                    } catch (error) { 
                        console.error("Error en el controlador al obtener dias:", error);
                        const errorMessage = error && typeof error === 'object' && 'message' in error
                                        ? error.message
                                        : "Error interno del servidor al obtener dias.";
                        res.status(500).json({ message: errorMessage });
                    }
    }

}