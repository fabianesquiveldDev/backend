import { DisponibilidadCitasModel } from '../models/disponibilidad.citas.model.js';
import { MedicosModel } from '../models/medicos.model.js';
import { validarDisponibilidadCitas, validarPartialDisponibilidadCitas } from '../schemas/disponibilidad.citas.schemas.js';

export class DisponibilidadCitasController {
    
    /**
     * Crea una nueva disponibilidad de citas
     */
    static async crear(req, res) {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            // 1. Validación con Zod
            const result = validarDisponibilidadCitas(req.body);
            
            if (!result.success) {
                return res.status(400).json({
                    error: 'Datos inválidos',
                    requestId,
                    details: result.error.errors.map(err => ({
                        campo: err.path.join('.'),
                        mensaje: err.message,
                        valorRecibido: err.received,
                        valorEsperado: err.expected
                    }))
                });
            }
            
            const {
                cve_medico_consultorio,
                fecha_hora_inicio,
                duracion_minutos,
                ocupado,
                cancelado,
                nota,
            } = result.data;

            // 2. Obtener cve_medico a partir del cve_medico_consultorio
            const cve_medicos = await MedicosModel.obtenerCveMedicoDesdeConsultorio(cve_medico_consultorio);
            
            if (!cve_medicos) {
                return res.status(404).json({ 
                    error: 'Médico no encontrado',
                    message: 'No se encontró médico para este consultorio',
                    requestId,
                    cve_medico_consultorio
                });
            }

            // 3. Validar horario laboral
            const fecha = new Date(fecha_hora_inicio);
            const diaSemana = fecha.getDay() === 0 ? 7 : fecha.getDay();
            
            const horario = await MedicosModel.obtenerHorarioLaboral({ 
                cve_medicos,
                cve_medico_consultorio, 
                dia_semana: diaSemana 
            });
            
            if (!horario) {
                return res.status(400).json({ 
                    error: 'Horario no disponible',
                    message: 'El médico no tiene horario laboral para este día',
                    requestId,
                    diaSemana,
                    fecha: fecha.toISOString()
                });
            }

            // Validar que esté dentro del horario permitido
            const validacionHorario = this._validarHorarioLaboral(fecha, horario, duracion_minutos);
            if (!validacionHorario.valido) {
                return res.status(400).json({
                    error: 'Horario no permitido',
                    message: validacionHorario.mensaje,
                    requestId,
                    detalles: validacionHorario.detalles
                });
            }

            // 4. Validar solapamientos
            const haySolapamiento = await DisponibilidadCitasModel.verificarSolapamiento({
                cve_medico_consultorio,
                fecha_hora_inicio,
                duracion_minutos
            });

            if (haySolapamiento) {
                return res.status(409).json({
                    error: 'Solapamiento de disponibilidad',
                    message: 'Ya existe una disponibilidad que se cruza con este horario',
                    requestId,
                    disponibilidadExistente: haySolapamiento
                });
            }

            // 5. Crear la disponibilidad
            const nuevaDisponibilidad = await DisponibilidadCitasModel.crear({
                input: {
                    cve_medico_consultorio,
                    fecha_hora_inicio,
                    duracion_minutos,
                    ocupado,
                    cancelado,
                    nota
                }
            });

            return res.status(201).json({
                success: true,
                data: nuevaDisponibilidad,
                requestId
            });

        } catch (error) {
            console.error(`Error en DisponibilidadCitasController.crear [${requestId}]:`, error);
            
            return this._manejarError(error, res, requestId);
        }
    }

    /**
     * Obtiene una disponibilidad específica por CVE
     */
    static async getOne(req, res) {
        try {
            const { cve } = req.params;
            
            if (!cve || isNaN(Number(cve))) {
                return res.status(400).json({
                    error: 'CVE inválido',
                    message: 'El identificador debe ser un número válido'
                });
            }

            const disponibilidad = await DisponibilidadCitasModel.getOne({ cve: Number(cve) });
            
            if (!disponibilidad) {
                return res.status(404).json({ 
                    error: 'Disponibilidad no encontrada',
                    message: `No existe disponibilidad con CVE: ${cve}`
                });
            }

            return res.json({
                success: true,
                data: disponibilidad
            });

        } catch (error) {
            console.error('Error en DisponibilidadCitasController.getOne:', error);
            
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }

    /**
     * Actualiza una disponibilidad existente
     */
    static async update(req, res) {
        try {
            const result = validarPartialDisponibilidadCitas(req.body);

            if (!result.success) {
                return res.status(400).json({ 
                    error: 'Datos de validación incorrectos',
                    details: result.error.errors 
                });
            }

            const { cve } = req.params;
            
            if (!cve || isNaN(Number(cve))) {
                return res.status(400).json({
                    error: 'CVE inválido',
                    message: 'El CVE debe ser un número válido'
                });
            }

            const disponibilidadActualizada = await DisponibilidadCitasModel.update({ 
                cve: Number(cve),
                input: result.data 
            });

            if (!disponibilidadActualizada) {
                return res.status(404).json({ 
                    error: 'Disponibilidad no encontrada',
                    message: `No existe disponibilidad con CVE: ${cve}`
                });
            }

            return res.json({
                success: true,
                message: 'Disponibilidad actualizada correctamente',
                data: disponibilidadActualizada
            });

        } catch (error) {
            console.error('Error en DisponibilidadCitasController.update:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }

    /**
     * Obtiene todas las disponibilidades
     */
    static async getAll(req, res) { 
        try {
            const disponibilidades = await DisponibilidadCitasModel.getAll();
            
            return res.json({
                success: true,
                data: disponibilidades
            });

        } catch (error) { 
            console.error("Error en DisponibilidadCitasController.getAll:", error);
            return res.status(500).json({ 
                error: "Error interno del servidor",
                message: error.message || "Error al obtener las disponibilidades"
            });
        }
    }

    /**
     * Elimina una disponibilidad si no está ocupada
     */
    static async eliminar(req, res) {
        try {
            const { cve } = req.params;

            if (!cve || isNaN(Number(cve))) {
                return res.status(400).json({ 
                    error: 'CVE inválido',
                    message: 'El identificador debe ser un número válido'
                });
            }

            const disponibilidadEliminada = await DisponibilidadCitasModel.eliminarSiNoEstaOcupada(Number(cve));

            if (!disponibilidadEliminada) {
                return res.status(400).json({
                    error: 'No se puede eliminar',
                    message: 'La disponibilidad está ocupada o no existe'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Disponibilidad eliminada correctamente',
                data: disponibilidadEliminada
            });

        } catch (error) {
            console.error('Error en DisponibilidadCitasController.eliminar:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }

    /**
     * Método privado para validar horario laboral
     */
    static _validarHorarioLaboral(fecha, horario, duracionMinutos) {
        const horaInicioStr = fecha.toTimeString().slice(0, 8);
        const [hIni, mIni] = horaInicioStr.split(':').map(Number);
        const [hFin, mFin] = horario.horario_fin.split(':').map(Number);
        const minutosInicio = hIni * 60 + mIni;
        const minutosFin = hFin * 60 + mFin;
        const margenMin = 20;

        // Verificar si está dentro del horario laboral
        const dentroDelHorario = horaInicioStr >= horario.horario_inicio && horaInicioStr < horario.horario_fin;
        const conMargenSuficiente = minutosInicio <= minutosFin - margenMin;

        if (!dentroDelHorario || !conMargenSuficiente) {
            return {
                valido: false,
                mensaje: 'La hora de inicio no está permitida dentro del horario laboral del médico',
                detalles: {
                    horaSeleccionada: horaInicioStr,
                    horarioPermitido: `${horario.horario_inicio} - ${horario.horario_fin}`,
                    margenRequerido: `${margenMin} minutos antes del cierre`,
                    duracionCita: `${duracionMinutos} minutos`
                }
            };
        }

        return { valido: true };
    }

    /**
     * Método privado para manejar errores
     */
    static _manejarError(error, res, requestId = null) {
        let statusCode = 500;
        let errorResponse = {
            error: 'Error interno del servidor',
            message: error.message
        };

        if (requestId) {
            errorResponse.requestId = requestId;
        }

        // Errores específicos de PostgreSQL
        switch (error.code) {
            case '23505': // Unique constraint violation
                statusCode = 409;
                errorResponse.error = 'Conflicto de datos';
                errorResponse.message = 'Ya existe un registro con estos datos';
                break;
            case '23503': // Foreign key violation
                statusCode = 400;
                errorResponse.error = 'Referencia inválida';
                errorResponse.message = 'Uno de los datos referenciados no existe';
                break;
            case '23502': // Not null violation
                statusCode = 400;
                errorResponse.error = 'Datos faltantes';
                errorResponse.message = 'Faltan campos requeridos';
                break;
        }

        // En desarrollo, incluir más detalles
        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = error.stack;
            errorResponse.errorCode = error.code;
            errorResponse.errorDetails = {
                constraint: error.constraint,
                detail: error.detail,
                hint: error.hint
            };
        }

        return res.status(statusCode).json(errorResponse);
    }
}