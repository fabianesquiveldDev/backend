import { SucursalServiciosModel } from '../models/sucursal_servicios.model.js';
import { validarSucursalServicios, validarPartialSucursalServicios } from '../schemas/sucursal_servicios.schemas.js';
import { validationResult } from 'express-validator'
import { NotificacionesController } from '../controller/notificaciones.controller.js';

export class SucursalServiciosController {
    static async crear(req, res) {
        try {
            // Validación de datos
            const result = validarSucursalServicios(req.body);
            
            if (!result.success) {
                return res.status(400).json({ 
                    error: 'Datos inválidos',
                    details: JSON.parse(result.error.message) 
                });
            }

            // Creación en la base de datos
            const nuevaSucursales_Serivicios = await SucursalServiciosModel.crear({ input: result.data });
            
            return res.status(201).json({
                success: true,
                data: nuevaSucursales_Serivicios
            });

        } catch (error) {
            console.error('Error en SucursalesSeriviciosController.crear:', error);
            
            // Manejo específico para errores de duplicados
            if (error.code === '23505') { // Código de violación de única restricción en PostgreSQL
                return res.status(409).json({
                    error: 'Registro duplicado',
                    message: 'La SucursalesSerivicios  ya existe en el sistema'
                });
            }

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
            
            const result = validarPartialSucursalServicios(req.body);

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

            const updatedSucursales = await SucursalServiciosModel.update({ 
                cve: Number(cve),
                input: result.data 
            });

            if (!updatedSucursales) {
                return res.status(404).json({ 
                    error: 'sucursal servicios no encontrada',
                    message: `No existe una sucursal servicios  con CVE: ${cve}`
                });
            }

            return res.json({
                success: true,
                message: 'sucursal actualizado correctamente',
                data: updatedSucursales
            });

        } catch (error) {
            console.error('Error en SucursalesController.update:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }

    static async getAll(req, res) { 
            console.log('Entró a getAll con cve:', req.params.cve);

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

            console.log('Llamando a SucursalServiciosModel.sucursales_servicios con:', { cve }); 
                const sucursales_servicios = await SucursalServiciosModel.getAll({cve});
                res.json(sucursales_servicios);
            } catch (error) { 
                console.error("Error en el controlador al obtener sucursales_servicios (true false):", error);
                const errorMessage = error && typeof error === 'object' && 'message' in error
                                ? error.message
                                : "Error interno del servidor al obtener sucursales_servicios.";
                res.status(500).json({ message: errorMessage });
            }
    }

   static async upsert(req, res) {
    try {
        console.log('=== INICIO CONTROLADOR ===');
        console.log('req.body:', req.body);
        
        // Validar errores de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Errores de validación:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Errores de validación',
                errors: errors.array()
            });
        }

        const { cve_servicios, cve_sucursales, active } = req.body;
        
        console.log('Datos extraídos:', { cve_servicios, cve_sucursales, active });

        // Validar que los campos requeridos estén presentes
        if (!cve_servicios || !cve_sucursales || active === undefined) {
            console.log('Campos faltantes');
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: cve_servicios, cve_sucursales, active'
            });
        }

        // Validar que sean números válidos Y positivos
        const serviciosNum = parseInt(cve_servicios);
        const sucursalesNum = parseInt(cve_sucursales);
        
        if (isNaN(serviciosNum) || isNaN(sucursalesNum) || serviciosNum <= 0 || sucursalesNum <= 0) {
            console.log('Números inválidos:', { serviciosNum, sucursalesNum });
            return res.status(400).json({
                success: false,
                message: 'cve_servicios y cve_sucursales deben ser números válidos y positivos'
            });
        }

        console.log('Llamando al modelo con:', {
            cve_servicios: serviciosNum,
            cve_sucursales: sucursalesNum,
            active: Boolean(active)
        });

        // Llamar al modelo para hacer el upsert
        const result = await SucursalServiciosModel.upsert({
            cve_servicios: serviciosNum,
            cve_sucursales: sucursalesNum,
            active: Boolean(active)
        });

        console.log('Resultado del modelo:', result);

        // Enviar notificación a todos los usuarios móviles
        const playerIds = await SucursalServiciosModel.obtenerTodosPlayerIdsMoviles();

        if (playerIds && playerIds.length > 0) {
            console.log(`Enviando notificación a ${playerIds.length} usuarios móviles...`);
            for (const disp of playerIds) {
                try {
                    // Construir request simulado para la función enviarNotificacion
                    const reqNotificacion = {
                        body: {
                            tipo: 'nuevo_servicio_disponible', // Usa el tipo que tengas configurado en la BD
                            player_id: disp.player_id,    // para OneSignal
                            cve_usuarios: disp.cve_usuarios // para registro en BD, debe ser entero
                        }
                    };
                    const resNotificacion = {
                        status: () => ({ json: (data) => data }),
                        json: (data) => data
                    };
                    // Aquí asumo que tienes un controlador NotificacionesController con método enviarNotificacion
                    await NotificacionesController.enviarNotificacion(reqNotificacion, resNotificacion);
                } catch (notifError) {
                    console.error(`Error enviando notificación a usuario ${pid}:`, notifError);
                }
            }
            console.log('Notificaciones enviadas exitosamente');
        } else {
            console.log('No hay usuarios móviles para enviar notificación');
        }

        console.log('=== FIN CONTROLADOR EXITOSO ===');

        return res.status(200).json({
            success: true,
            message: result.wasCreated ? 'Relación creada exitosamente' : 'Relación actualizada exitosamente',
            data: {
                cve_servicios: result.cve_servicios,
                cve_sucursales: result.cve_sucursales,
                active: result.active,
                wasCreated: result.wasCreated
            }
        });

    } catch (error) {
        console.error('=== ERROR EN CONTROLADOR ===');
        console.error('Error completo:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('=== FIN ERROR CONTROLADOR ===');
        
        // TEMPORALMENTE devolver el error completo
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor (upsert)',
            error: error.message, // Mostrar el error real temporalmente
            stack: error.stack, // Y el stack trace
            details: {
                code: error.code,
                detail: error.detail,
                hint: error.hint
            }
        });
    }
}


    static async getSucusalesServicios(req, res) { 
            try {
<<<<<<< HEAD
                const sucursales_servicios = await SucursalServiciosModel.getSucusalesServicios();
=======
                const sucursales_servicios = await SucursalServiciosModel.getAll();
>>>>>>> 24914752ac825107d34852571f8363ada74da35c
                res.json(sucursales_servicios);
            } catch (error) { 
                console.error("Error en el controlador al obtener sucursales_servicios:", error);
                const errorMessage = error && typeof error === 'object' && 'message' in error
                                ? error.message
                                : "Error interno del servidor al obtener sucursales_servicios.";
                res.status(500).json({ message: errorMessage });
            }
    }



}