    import { CitasModel } from '../models/citas.model.js';
    import { UsuariosModel } from '../models/usuarios.model.js';
    import { DisponibilidadCitasModel } from '../models/disponibilidad.citas.model.js';
    import { PacientesModel } from '../models/pacientes.model.js';
    import { validarPartialCitas } from '../schemas/citas.schemas.js';
    import { crearEvento, servicioDisponible, eliminarEvento } from '../services/googleCalendarService.js';
    import { calcularHoraFin } from '../utils/fechas.js'; 
    import { enviarCorreo } from '../services/ResendServices.js';
    import generarPlantillaCorreo from '../templates/emailTemplates.js';
    import { NotificacionesController } from './notificaciones.controller.js';




    export class CitasController {

static async crear(req, res) {
    try {
        const result = validarPartialCitas(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Datos inválidos',
                details: JSON.parse(result.error.message)
            });
        }

        const nuevaCita = await CitasModel.crear({ input: result.data });
        console.log('✅ Cita creada en BD:', nuevaCita);

        // Obtener datos necesarios para correos, Google Calendar y NOTIFICACIONES
        const paciente = await PacientesModel.obtenrNombrePacinetes(result.data.cve_pacientes);
        console.log('  - cve_pacientes:', paciente?.cve_pacientes);
        const disponibilidad = await DisponibilidadCitasModel.obtenerDatos(result.data.cve_disponibilidad);
        console.log('  - cve_medicos:', disponibilidad?.cve_medicos);  


        if (paciente && disponibilidad) { 
            // 📨 ENVÍO DE CORREOS A PACIENTE Y MÉDICO
            try {
                // Correo al paciente
                if (paciente.email) {
                    const correoPaciente = generarPlantillaCorreo('confirmacionPaciente', {
                        paciente,
                        disponibilidad
                    });

                    await enviarCorreo({
                        para: paciente.email,
                        asunto: correoPaciente.asunto,
                        textoPlano: correoPaciente.textoPlano,
                        html: correoPaciente.html
                    });
                }

                // Correo al médico
                if (disponibilidad.email) {
                    const correoMedico = generarPlantillaCorreo('notificacionMedico', {
                        paciente,
                        disponibilidad
                    });

                    await enviarCorreo({
                        para: disponibilidad.email,
                        asunto: correoMedico.asunto,
                        textoPlano: correoMedico.textoPlano,
                        html: correoMedico.html
                    });
                }

                console.log('✅ Correos enviados a paciente y médico');
                
            } catch (correoErr) {
                console.error('❌ Error enviando correos:', correoErr);
            }

            // 🔔 ENVÍO DE NOTIFICACIONES PUSH - VERSIÓN CORREGIDA
            try {
                console.log('🔔 INICIANDO ENVÍO DE NOTIFICACIONES PUSH');
                
                // Formatear fecha y hora para las notificaciones
                const fechaFormateada = new Date(disponibilidad.fecha_hora_inicio).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                });
                
                const horaFormateada = new Date(disponibilidad.fecha_hora_inicio).toLocaleTimeString('es-MX', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true
                });

                // Contadores para el resumen final
                let notificacionesExitosas = 0;
                let notificacionesFallidas = 0;

                // 📱 NOTIFICACIÓN AL PACIENTE - CORREGIDA
                console.log('📱 Procesando notificación para PACIENTE...');
                
                if (paciente && paciente.cve_pacientes) {
                    try {
                        // ✅ CORRECCIÓN: cve_pacientes = cve_usuarios
                        const cve_usuario_paciente = paciente.cve_pacientes;
                        
                        console.log(`   👤 Paciente ID (cve_pacientes = cve_usuarios): ${cve_usuario_paciente}`);
                        console.log(`   📧 Paciente Email: ${paciente.email}`);
                        
                        const reqPaciente = {
                            body: {
                                tipo: 'confirmacion_cita',
                                cve_usuarios: cve_usuario_paciente, // ✅ Usar cve_pacientes como cve_usuarios
                                variables: {
                                    fecha: fechaFormateada,
                                    hora: horaFormateada,
                                    doctor: `Dr. ${disponibilidad.nombrecompletomedico}`
                                }
                            }
                        };

                        const resPaciente = {
                            status: (code) => ({
                                json: (data) => {
                                    if (code !== 200) {
                                        console.error('❌ Error en notificación paciente:', data);
                                        throw new Error(`Notificación paciente falló: ${JSON.stringify(data)}`);
                                    }
                                    return data;
                                }
                            }),
                            json: (data) => {
                                console.log('✅ Respuesta notificación paciente:', data);
                                return data;
                            }
                        };

                        await NotificacionesController.enviarNotificacion(reqPaciente, resPaciente);
                        console.log('✅ NOTIFICACIÓN PACIENTE: ENVIADA CORRECTAMENTE');
                        notificacionesExitosas++;
                        
                    } catch (pacienteErr) {
                        console.error('❌ NOTIFICACIÓN PACIENTE: ERROR');
                        console.error('   Error específico:', pacienteErr.message);
                        
                        // Verificar si es problema de dispositivo no registrado
                        if (pacienteErr.message.includes('player_id') || 
                            pacienteErr.message.includes('dispositivo') ||
                            pacienteErr.message.includes('usuario no encontrado')) {
                            console.error('   🔍 POSIBLE CAUSA: Paciente sin dispositivo móvil registrado');
                            console.error('   💡 SOLUCIÓN: El paciente debe instalar la app y permitir notificaciones');
                        }
                        
                        notificacionesFallidas++;
                    }
                } else {
                    console.log('⚠️ NOTIFICACIÓN PACIENTE: Sin datos válidos para enviar');
                    console.log('   paciente existe:', !!paciente);
                    console.log('   paciente.cve_pacientes:', paciente?.cve_pacientes);
                }

                console.log(''); // Separador visual

                // 👨‍⚕️ NOTIFICACIÓN AL MÉDICO - CORREGIDA
                console.log('👨‍⚕️ Procesando notificación para MÉDICO...');
                
                if (disponibilidad && disponibilidad.cve_medicos) {
                    try {
                        // ✅ CORRECCIÓN: cve_medicos = cve_usuarios
                        const cve_usuario_medico = disponibilidad.cve_medicos;
                        
                        console.log(`   👨‍⚕️ Médico ID (cve_medicos = cve_usuarios): ${cve_usuario_medico}`);
                        console.log(`   📧 Médico Email: ${disponibilidad.email}`);
                        
                        const reqMedico = {
                            body: {
                                tipo: 'nueva_cita_medico',
                                cve_usuarios: cve_usuario_medico, // ✅ Usar cve_medicos como cve_usuarios
                                variables: {
                                    paciente: paciente.nombrecompletopaciente || 'Paciente',
                                    fecha: fechaFormateada,
                                    hora: horaFormateada
                                }
                            }
                        };

                        const resMedico = {
                            status: (code) => ({
                                json: (data) => {
                                    if (code !== 200) {
                                        console.error('❌ Error en notificación médico:', data);
                                        throw new Error(`Notificación médico falló: ${JSON.stringify(data)}`);
                                    }
                                    return data;
                                }
                            }),
                            json: (data) => {
                                console.log('✅ Respuesta notificación médico:', data);
                                return data;
                            }
                        };

                        await NotificacionesController.enviarNotificacion(reqMedico, resMedico);
                        console.log('✅ NOTIFICACIÓN MÉDICO: ENVIADA CORRECTAMENTE');
                        notificacionesExitosas++;
                        
                    } catch (medicoErr) {
                        console.error('❌ NOTIFICACIÓN MÉDICO: ERROR');
                        console.error('   Error específico:', medicoErr.message);
                        
                        // Verificar si es problema de dispositivo no registrado
                        if (medicoErr.message.includes('player_id') || 
                            medicoErr.message.includes('dispositivo') ||
                            medicoErr.message.includes('usuario no encontrado')) {
                            console.error('   🔍 POSIBLE CAUSA: Médico sin dispositivo móvil registrado');
                            console.error('   💡 SOLUCIÓN: El médico debe instalar la app y permitir notificaciones');
                        }
                        
                        notificacionesFallidas++;
                    }
                } else {
                    console.log('⚠️ NOTIFICACIÓN MÉDICO: Sin datos válidos para enviar');
                    console.log('   disponibilidad existe:', !!disponibilidad);
                    console.log('   disponibilidad.cve_medicos:', disponibilidad?.cve_medicos);
                }

                // 📊 RESUMEN FINAL DE NOTIFICACIONES
                console.log('');
                console.log('📊 RESUMEN DE NOTIFICACIONES PUSH:');
                console.log(`   ✅ Exitosas: ${notificacionesExitosas}`);
                console.log(`   ❌ Fallidas: ${notificacionesFallidas}`);
                console.log(`   📱 Total procesadas: ${notificacionesExitosas + notificacionesFallidas}`);
                
                if (notificacionesExitosas > 0) {
                    console.log('🎉 Al menos una notificación fue enviada correctamente');
                }
                
                if (notificacionesFallidas > 0) {
                    console.log('⚠️ Algunas notificaciones fallaron - revisar si usuarios tienen dispositivos registrados');
                }

            } catch (notifErr) {
                console.error('❌ ERROR GENERAL EN SISTEMA DE NOTIFICACIONES:', notifErr);
                console.error('Stack completo:', notifErr.stack);
                // No detener el flujo principal, continuar con Google Calendar
            }
        }

        // ➕ CREAR EVENTO EN GOOGLE CALENDAR
        try {
            const googleDisponible = await servicioDisponible();
            if (!googleDisponible) {
                console.log('⚠️ Google Calendar no disponible');
                return res.status(201).json({
                    success: true,
                    data: nuevaCita,
                    warning: 'Cita creada, pero sin evento en Google Calendar'
                });
            }

            if (!paciente || !disponibilidad || !paciente.email || !disponibilidad.email) {
                return res.status(201).json({
                    success: true,
                    data: nuevaCita,
                    warning: 'Faltan datos para crear evento en Google Calendar'
                });
            }

            const horaFin = calcularHoraFin(disponibilidad.fecha_hora_inicio, disponibilidad.duracion_minutos);

            const eventoData = {
                summary: `Cita con el Dr. ${disponibilidad.nombrecompletomedico}`,
                description: `
                CITA CONFIRMADA Y AGENDADA
                
                Paciente: ${paciente.nombrecompletopaciente || 'N/A'}
                Médico: Dr. ${disponibilidad.nombrecompletomedico}
                Motivo: ${disponibilidad.motivocita || 'Consulta médica'}
                
                Esta cita está CONFIRMADA. No es necesario responder a esta invitación.
                Para cambios o cancelaciones, contacte a la clínica.
                `,
                start: disponibilidad.fecha_hora_inicio,
                end: horaFin,
                location: `${disponibilidad.nombresucursal || ''}, Piso ${disponibilidad.nombrepiso || ''}, Consultorio ${disponibilidad.nombreconsultorio || ''} #${disponibilidad.numeroconsultorio || ''}`
            };

            const eventoGoogle = await crearEvento(eventoData);
            console.log('✅ Evento Google Calendar creado con ID:', eventoGoogle.id);

            let citaId;
            if (Array.isArray(nuevaCita) && nuevaCita.length > 0) {
                citaId = nuevaCita[0].cve_citas;
            } else if (nuevaCita && nuevaCita.cve_citas) {
                citaId = nuevaCita.cve_citas;
            }

            if (citaId) {
                await CitasModel.actualizarGoogleEventId(citaId, eventoGoogle.id);
            }

            return res.status(201).json({
                success: true,
                data: nuevaCita,
                googleCalendar: {
                    eventId: eventoGoogle.id,
                    status: 'created'
                },
                notifications: {
                    status: 'sent',
                    message: 'Notificaciones push enviadas a paciente y médico'
                }
            });

        } catch (googleErr) {
            console.error('❌ Error al crear evento en Google Calendar:', googleErr.message);

            return res.status(201).json({
                success: true,
                data: nuevaCita,
                warning: 'Cita creada, pero no se pudo sincronizar con Google Calendar',
                googleCalendar: {
                    status: 'failed',
                    error: googleErr.message
                },
                notifications: {
                    status: 'sent',
                    message: 'Notificaciones push enviadas correctamente'
                }
            });
        }

    } catch (error) {
        console.error('Error en CitasController.crear:', error);
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Registro duplicado',
                message: 'La cita ya existe en el sistema'
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
                
                const result = validarPartialCitas(req.body);

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

                const updateCitas= await CitasModel.update({ 
                    cve: Number(cve),
                    input: result.data 
                });

                if (!updateCitas) {
                    return res.status(404).json({ 
                        error: 'citas no encontrada',
                        message: `No existe una citas con CVE: ${cve}`
                    });
                }

                return res.json({
                    success: true,
                    message: 'citas actualizado correctamente',
                    data: updateCitas
                });

            } catch (error) {
                console.error('Error en citasController.update:', error);
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
        static async cancelar(req, res) {
            try {
                const { cveCita } = req.params;
                
                console.log(`=== INICIANDO CANCELACIÓN DE CITA ${cveCita} ===`);

                // Validar que cveCita sea un número válido
                if (!cveCita || isNaN(cveCita)) {
                    return res.status(400).json({
                        error: 'Clave de cita inválida'
                    });
                }

                // 1. Obtener los datos de la cita
                const cita = await CitasModel.obtenerConGoogleEventId(cveCita);
                
                if (!cita) {
                    return res.status(404).json({
                        error: 'Cita no encontrada o ya cancelada'
                    });
                }

                console.log('📋 Datos de la cita:', {
                    cveCita: cita.cve_citas,
                    googleEventId: cita.google_event_id,
                    fechaHora: cita.fecha_hora_inicio,
                    cancelada: cita.cancelada
                            });

                // Verificar si ya está cancelada
                if (cita.cancelada) {
                    return res.status(400).json({
                        error: 'La cita ya se encuentra cancelada'
                    });
                }

                // 2. Cancelar en Google Calendar (si tiene evento asociado)
                let googleCalendarStatus = 'no_event';
                
                if (cita.google_event_id) {
                    try {
                        const googleDisponible = await servicioDisponible();
                        
                        if (googleDisponible) {
                            console.log('🗑️ Eliminando evento de Google Calendar:', cita.google_event_id);
                            await eliminarEvento(cita.google_event_id);
                            googleCalendarStatus = 'deleted';
                            console.log('✅ Evento eliminado de Google Calendar');
                        } else {
                            console.log('⚠️ Google Calendar no disponible');
                            googleCalendarStatus = 'service_unavailable';
                        }
                    } catch (googleErr) {
                        console.error('❌ Error eliminando evento de Google:', googleErr.message);
                        googleCalendarStatus = 'delete_failed';
                        // No fallar la cancelación por esto
                    }
                }

                // 3. Marcar como cancelada en la base de datos
                const citaCancelada = await CitasModel.cancelar(cveCita);
                
                if (!citaCancelada) {
                    return res.status(400).json({
                        error: 'No se pudo cancelar la cita'
                    });
                }

                console.log('✅ Cita cancelada exitosamente');

                return res.status(200).json({
                    success: true,
                    message: 'Cita cancelada exitosamente',
                    data: {
                        cveCita: citaCancelada.cve_citas,
                        cancelada: citaCancelada.cancelada,
                        fechaCancelacion: citaCancelada.fecha_cancelacion
                    },
                    googleCalendar: {
                        status: googleCalendarStatus,
                        eventId: cita.google_event_id || null
                    }
                });

            } catch (error) {
                console.error('❌ Error cancelando cita:', error);
                return res.status(500).json({
                    error: 'Error interno del servidor',
                    message: error.message
                });
            }
        }

        static async getCitasPacientes(req, res) {
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

                console.log('Llamando a CitasModel.getCitasPacientes con:', { cve }); 
                const citas = await CitasModel.getCitasPacientes({ cve });
                console.log('Resultado del modelo:', citas); 
                
                if (!citas) {
                    return res.status(404).json({ 
                        error: 'No encontrado',
                        message: 'citas de pacinetes no encontrado' 
                    });
                }

                return res.json({
                    success: true,
                    data: citas
                });

            } catch (error) {
                console.error('Error completo en CitasController.getCitasPacientes:', error);
                console.error('Stack trace:', error.stack); // Más detalles del error
                
                return res.status(500).json({
                    error: 'Error interno del servidor',
                    message: error.message
                });
        }

        
        }

        static async contarNoShows(req, res) {
        try {
            const { cve } = req.params; // cve_paciente
            
            const noShowCount = await CitasModel.contarNoShows({ cve });
            
            res.status(200).json({
                success: true,
                data: {
                    no_shows: noShowCount,
                    debe_pagar: noShowCount >= 3,
                    mensaje: noShowCount >= 3 
                        ? `Tienes ${noShowCount} faltas. Debes pagar $500 en recepción.`
                        : noShowCount >= 2
                        ? 'Tienes faltas registradas. La próxima tendrá cargo.'
                        : null
                }
            });
            
        } catch (error) {
            console.error('Error al contar No-Shows:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    static async getCitasMedicos(req, res) {
    try {
        console.log('req.params:', req.params); 
        const { cveMedic, cveSucursales } = req.params;

        console.log('CVE Medic:', cveMedic); 
        console.log('CVE Sucursales:', cveSucursales); 
        
        // Validaciones
        if (!cveMedic || isNaN(Number(cveMedic)) || !cveSucursales || isNaN(Number(cveSucursales))) {
            return res.status(400).json({
                error: 'ID inválido',
                message: 'Los identificadores deben ser números válidos'
            });
        }

        console.log('Llamando a CitasModel.getCitasMedicos con:', { cveMedic, cveSucursales }); 
        const citas = await CitasModel.getCitasMedicos({ cveMedic, cveSucursales });
        console.log('Resultado del modelo:', citas); 
        
        if (!citas || citas.length === 0) {
            return res.status(404).json({ 
                error: 'No encontrado',
                message: 'Citas de pacientes no encontradas' 
            });
        }

        return res.json({
            success: true,
            data: citas
        });

    } catch (error) {
        console.error('Error completo en CitasController.getCitasMedicos:', error);
        console.error('Stack trace:', error.stack);
        
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
}

static async cancelarMedicos(req, res) {
    try {
        const { cveCita } = req.params;
        const { motivo_cancelacion } = req.body;

        console.log(`=== INICIANDO CANCELACIÓN DE CITA ${cveCita} ===`);

        if (!cveCita || isNaN(cveCita)) {
            return res.status(400).json({ error: 'Clave de cita inválida' });
        }

        if (!motivo_cancelacion || motivo_cancelacion.trim() === '') {
            return res.status(400).json({ error: 'Debe proporcionar un motivo de cancelación' });
        }

        const cita = await CitasModel.obtenerConGoogleEventId(cveCita);
        if (!cita) {
            return res.status(404).json({ error: 'Cita no encontrada o ya cancelada' });
        }

        if (cita.cancelada) {
            return res.status(400).json({ error: 'La cita ya se encuentra cancelada' });
        }

        // Cancelar evento Google Calendar si existe
        let googleCalendarStatus = 'no_event';
        if (cita.google_event_id) {
            try {
                const googleDisponible = await servicioDisponible();
                if (googleDisponible) {
                    console.log('🗑️ Eliminando evento de Google Calendar:', cita.google_event_id);
                    await eliminarEvento(cita.google_event_id);
                    googleCalendarStatus = 'deleted';
                    console.log('✅ Evento eliminado de Google Calendar');
                } else {
                    console.log('⚠️ Google Calendar no disponible');
                    googleCalendarStatus = 'service_unavailable';
                }
            } catch (googleErr) {
                console.error('❌ Error eliminando evento de Google:', googleErr.message);
                googleCalendarStatus = 'delete_failed';
            }
        }

        // Cancelar cita en BD, pasando motivo
        const citaCancelada = await CitasModel.cancelar(cveCita, motivo_cancelacion);

        if (!citaCancelada) {
            return res.status(400).json({ error: 'No se pudo cancelar la cita' });
        }

        // --- INICIO ENVÍO DE NOTIFICACIONES ---
        try {
            // Datos para la plantilla
            const fechaCita = new Date(cita.fecha_hora_inicio).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
            const horaCita = new Date(cita.fecha_hora_inicio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
            const doctorNombre = cita.nombrecompletomedico || 'Dr.';

            // Objeto res mock para las notificaciones
            const resMock = {
                status: () => ({ json: (data) => data }),
                json: (data) => data
            };

            // Notificación para paciente (por cve_usuarios)
            const reqPaciente = {
                body: {
                    tipo: 'cita_cancelada_paciente',
                    cve_usuarios: cita.cve_pacientes, // id usuario paciente
                    variables: {
                        fecha: fechaCita,
                        hora: horaCita,
                        motivo: motivo_cancelacion,
                        doctor: doctorNombre
                    }
                }
            };

            // Enviar notificación solo al paciente
            await NotificacionesController.enviarNotificacion(reqPaciente, resMock);
            console.log('✅ Notificación de cancelación enviada al paciente');

        } catch (notifErr) {
            console.error('❌ Error enviando notificación de cancelación:', notifErr);
            // No bloqueamos la respuesta por fallo en notificaciones
        }
        // --- FIN ENVÍO DE NOTIFICACIONES ---

        console.log('✅ Cita cancelada exitosamente');

        return res.status(200).json({
            success: true,
            message: 'Cita cancelada exitosamente',
            data: {
                cveCita: citaCancelada.cve_citas,
                cancelada: citaCancelada.cancelada,
                motivo_cancelacion: citaCancelada.motivo_cancelacion
            },
            googleCalendar: {
                status: googleCalendarStatus,
                eventId: cita.google_event_id || null
            }
        });

    } catch (error) {
        console.error('❌ Error cancelando cita:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
}





    }
