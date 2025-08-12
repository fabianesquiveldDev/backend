import { MedicosEspecialidadesModel } from '../models/medicos_especialidades.model.js';

export class MedicosEspecialidadesController {
    static async crear(req, res) {
        try {
            const nuevasMedicosEspecialidades = await MedicosEspecialidadesModel.crear({ input: req.body });

            
            return res.status(201).json({
                success: true,
                data: nuevasMedicosEspecialidades
            });

        } catch (error) {
            console.error('Error en medicos_EspecialidadesController.crear:', error);
            
            // Manejo específico para errores de duplicados
            if (error.code === '23505') { // Código de violación de única restricción en PostgreSQL
                return res.status(409).json({
                    error: 'Registro duplicado',
                    message: 'La medico_especialidad ya existe en el sistema'
                });
            }

            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }


            
    static async noAsignada(req, res) {
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

            console.log('Llamando a MedicosEspecialidadesModel.noAsignada con:', { cve }); 
            const Medicoespecialidades = await  MedicosEspecialidadesModel.noAsignada({ cve });
            console.log('Resultado del modelo:', Medicoespecialidades); 
            
            if (!Medicoespecialidades) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'serivico no encontrado' 
                });
            }

            return res.json({
                success: true,
                data: Medicoespecialidades
            });

        } catch (error) {
            console.error('Error completo en MedicosEspecialidadesController.noAsignada:', error);
            console.error('Stack trace:', error.stack); // Más detalles del error
            
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
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

            console.log('Llamando a MedicosEspecialidadesModel.Asignada con:', { cve }); 
            const Medicoespecialidades = await  MedicosEspecialidadesModel.Asignada({ cve });
            console.log('Resultado del modelo:', Medicoespecialidades); 
            
            if (!Medicoespecialidades) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'serivico no encontrado' 
                });
            }

            return res.json({
                success: true,
                data: Medicoespecialidades
            });

        } catch (error) {
            console.error('Error completo en MedicosEspecialidadesController.Asignada:', error);
            console.error('Stack trace:', error.stack); // Más detalles del error
            
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
    }

    
    }
    
    static async eliminar(req, res) {
        try {
            const { cve_medicos, cve_especialidad } = req.params;

            if (!cve_medicos || !cve_especialidad) {
                return res.status(400).json({
                    error: 'Parámetros inválidos',
                    message: 'Debe proporcionar cve_medicos y cve_especialidad en la URL'
                });
            }

            const resultado = await MedicosEspecialidadesModel.eliminar({ cve_medicos, cve_especialidad });

            if (resultado.rowCount === 0) {
                return res.status(404).json({
                    error: 'No encontrado',
                    message: 'La relación médico-especialidad no existe'
                });
            }

            return res.json({
                success: true,
                message: 'Relación médico-especialidad eliminada correctamente'
            });

        } catch (error) {
            console.error('Error al eliminar la relación:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }
}