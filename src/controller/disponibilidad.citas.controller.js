    import { DisponibilidadCitasModel } from '../models/disponibilidad.citas.model.js';
    import { MedicosModel } from '../models/medicos.model.js';
    import { validarDisponibilidadCitas, validarPartialDisponibilidadCitas } from '../schemas/disponibilidad.citas.schemas.js';


    export class DisponibilidadCitasController {
        static async crear(req, res) {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🚀 [${requestId}] Iniciando creación de disponibilidad`);
    console.log(`📝 [${requestId}] Datos recibidos:`, JSON.stringify(req.body, null, 2));
    
    try {
        // 1. Validación con Zod
        console.log(`🔍 [${requestId}] Paso 1: Validando datos con Zod...`);
        const result = validarDisponibilidadCitas(req.body);
        
        if (!result.success) {
            console.error(`❌ [${requestId}] Error de validación Zod:`);
            console.error(`   - Error completo:`, result.error);
            console.error(`   - Errores por campo:`, result.error.errors);
            
            return res.status(400).json({
                error: 'Datos inválidos',
                requestId,
                details: result.error.errors.map(err => ({
                    campo: err.path.join('.'),
                    mensaje: err.message,
                    valorRecibido: err.received,
                    valorEsperado: err.expected
                })),
                rawError: result.error,
            });
        }
        
        console.log(`✅ [${requestId}] Validación Zod exitosa`);
        const {
            cve_medico_consultorio,
            fecha_hora_inicio,
            duracion_minutos,
            ocupado,
            cancelado,
            nota,
        } = result.data;

        // 2. Obtener cve_medico a partir del cve_medico_consultorio
        console.log(`🔍 [${requestId}] Paso 2: Obteniendo cve_medico para consultorio ${cve_medico_consultorio}...`);
        
        const cve_medicos = await MedicosModel.obtenerCveMedicoDesdeConsultorio(cve_medico_consultorio);
        
        if (!cve_medicos) {
            console.error(`❌ [${requestId}] Médico no encontrado para consultorio ${cve_medico_consultorio}`);
            return res.status(404).json({ 
                error: 'Médico no encontrado para este consultorio',
                requestId,
                cve_medico_consultorio
            });
        }
        
        console.log(`✅ [${requestId}] Médico encontrado: ${cve_medicos}`);

        // 3. Validar que esté dentro del horario laboral
        console.log(`🔍 [${requestId}] Paso 3: Validando horario laboral...`);
        
        const fecha = new Date(fecha_hora_inicio);
        const diaSemana = fecha.getDay() === 0 ? 7 : fecha.getDay();
        const diaSemanaNum = Number(diaSemana);
        
        console.log(`📅 [${requestId}] Fecha: ${fecha.toISOString()}, Día semana: ${diaSemanaNum}`);

<<<<<<< HEAD
            const horario = await MedicosModel.obtenerHorarioLaboral({ cve_medicos,cve_medico_consultorio, dia_semana: diaSemana });
=======
            const horario = await MedicosModel.obtenerHorarioLaboral({ cve_medicos, dia_semana: diaSemana });
>>>>>>> 24914752ac825107d34852571f8363ada74da35c
        
        if (!horario) {
            console.warn(`⚠️ [${requestId}] No hay horario laboral para día ${diaSemanaNum} (médico ${cve_medicos})`);
            return res.status(400).json({ 
                error: 'El médico no tiene horario laboral para este día',
                requestId,
                diaSemanaNum,
                fecha: fecha.toISOString()
            });
        }
        
        console.log(`📋 [${requestId}] Horario encontrado:`, {
            inicio: horario.horario_inicio,
            fin: horario.horario_fin
        });

        const horaInicioStr = fecha.toTimeString().slice(0, 8);
        const [hIni, mIni] = horaInicioStr.split(':').map(Number);
        const [hFin, mFin] = horario.horario_fin.split(':').map(Number);
        const minutosInicio = hIni * 60 + mIni;
        const minutosFin = hFin * 60 + mFin;
        const margenMin = 20;

        console.log(`⏰ [${requestId}] Validación horaria:`, {
            horaInicioStr,
            horarioInicio: horario.horario_inicio,
            horarioFin: horario.horario_fin,
            minutosInicio,
            minutosFin,
            margenMin,
            dentroDeRango: horaInicioStr >= horario.horario_inicio && horaInicioStr < horario.horario_fin,
            conMargen: minutosInicio <= minutosFin - margenMin
        });

        if (
            horaInicioStr < horario.horario_inicio ||
            horaInicioStr >= horario.horario_fin ||
            minutosInicio > minutosFin - margenMin
        ) {
            console.warn(`⚠️ [${requestId}] Hora fuera del horario laboral permitido`);
            return res.status(400).json({
                error: 'La hora de inicio no está permitida dentro del horario laboral del médico',
                requestId,
                detalles: {
                    horaSeleccionada: horaInicioStr,
                    horarioPermitido: `${horario.horario_inicio} - ${horario.horario_fin}`,
                    margenRequerido: `${margenMin} minutos antes del cierre`,
                    diaSemana
                }
            });
        }
        
        console.log(`✅ [${requestId}] Horario laboral válido`);

        // 4. Validar que no haya solapamiento con otras disponibilidades
        console.log(`🔍 [${requestId}] Paso 4: Verificando solapamientos...`);
        
        const parametrosSolapamiento = {
            cve_medico_consultorio,
            fecha_hora_inicio,
            duracion_minutos
        };
        
        console.log(`🔎 [${requestId}] Parámetros solapamiento:`, parametrosSolapamiento);

        const haySolapamiento = await DisponibilidadCitasModel.verificarSolapamiento(parametrosSolapamiento);

        if (haySolapamiento) {
            console.warn(`⚠️ [${requestId}] Solapamiento detectado:`, haySolapamiento);
            return res.status(409).json({
                error: 'Solapamiento de disponibilidad',
                message: 'Ya existe una disponibilidad que se cruza con este horario',
                requestId,
                disponibilidadExistente: haySolapamiento
            });
        }
        
        console.log(`✅ [${requestId}] No hay solapamientos`);

        // 5. Crear la disponibilidad
        console.log(`🔍 [${requestId}] Paso 5: Creando disponibilidad en BD...`);
        
        const datosCreacion = {
            input: {
                cve_medico_consultorio,
                fecha_hora_inicio,
                duracion_minutos,
                ocupado,
                cancelado,
                nota
            }
        };
        
        console.log(`💾 [${requestId}] Datos para crear:`, datosCreacion);

        const nuevaDisponibilidad = await DisponibilidadCitasModel.crear(datosCreacion);
        
        const tiempoTotal = Date.now() - startTime;
        console.log(`🎉 [${requestId}] Disponibilidad creada exitosamente en ${tiempoTotal}ms`);
        console.log(`📋 [${requestId}] Resultado:`, nuevaDisponibilidad);

        return res.status(201).json({
            success: true,
            data: nuevaDisponibilidad,
            requestId,
            tiempoProcesamiento: `${tiempoTotal}ms`
        });

    } catch (error) {
        const tiempoTotal = Date.now() - startTime;
        
        console.error(`💥 [${requestId}] ERROR INESPERADO después de ${tiempoTotal}ms:`);
        console.error(`   - Tipo: ${error.constructor.name}`);
        console.error(`   - Mensaje: ${error.message}`);
        console.error(`   - Stack:`, error.stack);
        
        // Log adicional para errores de BD
        if (error.code) {
            console.error(`   - Código BD: ${error.code}`);
        }
        if (error.constraint) {
            console.error(`   - Constraint: ${error.constraint}`);
        }
        if (error.detail) {
            console.error(`   - Detalle BD: ${error.detail}`);
        }
        
        // Diferentes tipos de respuesta según el error
        let statusCode = 500;
        let errorResponse = {
            error: 'Error interno del servidor',
            message: error.message,
            requestId,
            tiempoProcesamiento: `${tiempoTotal}ms`
        };

        // Errores específicos de PostgreSQL
        if (error.code === '23505') { // Unique constraint violation
            statusCode = 409;
            errorResponse.error = 'Conflicto de datos';
            errorResponse.message = 'Ya existe un registro con estos datos';
        } else if (error.code === '23503') { // Foreign key violation
            statusCode = 400;
            errorResponse.error = 'Referencia inválida';
            errorResponse.message = 'Uno de los datos referenciados no existe';
        } else if (error.code === '23502') { // Not null violation
            statusCode = 400;
            errorResponse.error = 'Datos faltantes';
            errorResponse.message = 'Faltan campos requeridos';
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

                console.log('Llamando a DisponibilidadCitasModel.getOne con:', { cve }); 
                const disponibilidad = await  DisponibilidadCitasModel.getOne({ cve });
                console.log('Resultado del modelo:', disponibilidad); 
                
                if (!disponibilidad) {
                    return res.status(404).json({ 
                        error: 'No encontrado',
                        message: 'serivico no encontrado' 
                    });
                }

                return res.json({
                    success: true,
                    data: disponibilidad
                });

            } catch (error) {
                console.error('Error completo en disponibilidadController.getOne:', error);
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
                
                const result = validarPartialDisponibilidadCitas(req.body);

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

                const updateDisponibilidad_Citas = await DisponibilidadCitasModel.update({ 
                    cve: Number(cve),
                    input: result.data 
                });

                if (!updateDisponibilidad_Citas) {
                    return res.status(404).json({ 
                        error: 'dsiponibilidad no encontrada',
                        message: `No existe una especialidades con CVE: ${cve}`
                    });
                }

                return res.json({
                    success: true,
                    message: 'dsiponibilidad actualizado correctamente',
                    data: updateDisponibilidad_Citas
                });

            } catch (error) {
                console.error('Error en dsiponibilidadConbtroller.update:', error);
                return res.status(500).json({
                    error: 'Error interno del servidor',
                    message: error.message
                });
            }
        }

        static async getAll(req, res) { 
                        try {
                            const pisos = await DisponibilidadCitasModel.getAll();
                            res.json(pisos);
                        } catch (error) { 
                            console.error("Error en el controlador al obtener las disponibilidades:", error);
                            const errorMessage = error && typeof error === 'object' && 'message' in error
                                            ? error.message
                                            : "Error interno del servidor al obtener las disponibilidaes.";
                            res.status(500).json({ message: errorMessage });
                        }
        }

    static async eliminar(req, res) {
        const { cve } = req.params;

        if (!cve || isNaN(Number(cve))) {
            return res.status(400).json({ error: 'ID de disponibilidad inválido' });
        }

        try {
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
            console.error('Error al eliminar disponibilidad:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
        }
        


    }