import { SucursalServiciosModel } from '../models/sucursal_servicios.model.js';
import { validarSucursalServicios, validarPartialSucursalServicios } from '../schemas/sucursal_servicios.schemas.js';
import { validationResult } from 'express-validator';
import { NotificacionesController } from '../controller/notificaciones.controller.js';

export class SucursalServiciosController {
    /**
     * Crea una nueva relación sucursal-servicios
     */
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
            const nuevaSucursalServicios = await SucursalServiciosModel.crear({ input: result.data });
            
            return res.status(201).json({
                success: true,
                data: nuevaSucursalServicios
            });

        } catch (error) {
            console.error('Error en SucursalServiciosController.crear:', error);
            
            // Manejo específico para errores de duplicados
            if (error.code === '23505') {
                return res.status(409).json({
                    error: 'Registro duplicado',
                    message: 'La relación sucursal-servicio ya existe en el sistema'
                });
            }

            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }

    /**
     * Actualiza una relación sucursal-servicios existente
     */
    static async update(req, res) {
        try {
            const result = validarPartialSucursalServicios(req.body);

            if (!result.success) {
                return res.status(400).json({ 
                    error: 'Datos de validación incorrectos',
                    details: result.error.errors
                });
            }

            const { cve } = req.params;
            
            // Validar que cve sea un número válido
            if (!cve || isNaN(Number(cve))) {
                return res.status(400).json({
                    error: 'CVE inválido',
                    message: 'El CVE debe ser un número válido'
                });
            }

            const updatedSucursalServicios = await SucursalServiciosModel.update({ 
                cve: Number(cve),
                input: result.data 
            });

            if (!updatedSucursalServicios) {
                return res.status(404).json({ 
                    error: 'Sucursal-servicio no encontrada',
                    message: `No existe una relación sucursal-servicio con CVE: ${cve}`
                });
            }

            return res.json({
                success: true,
                message: 'Relación sucursal-servicio actualizada correctamente',
                data: updatedSucursalServicios
            });

        } catch (error) {
            console.error('Error en SucursalServiciosController.update:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }

    /**
     * Obtiene todas las relaciones sucursal-servicios por CVE de sucursal
     */
    static async getAll(req, res) { 
        try {
            const { cve } = req.params;
            
            if (!cve || isNaN(Number(cve))) {
                return res.status(400).json({
                    error: 'CVE inválido',
                    message: 'El CVE debe ser un número válido'
                });
            }

            const sucursalesServicios = await SucursalServiciosModel.getAll({ cve: Number(cve) });
            
            return res.json({
                success: true,
                data: sucursalesServicios
            });

        } catch (error) { 
            console.error("Error en SucursalServiciosController.getAll:", error);
            return res.status(500).json({ 
                error: "Error interno del servidor",
                message: error.message || "Error al obtener sucursales-servicios"
            });
        }
    }

    /**
     * Crea o actualiza una relación sucursal-servicios (upsert)
     */
    static async upsert(req, res) {
        try {
            // Validar errores de entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { cve_servicios, cve_sucursales, active } = req.body;

            // Validar que los campos requeridos estén presentes
            if (!cve_servicios || !cve_sucursales || active === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos requeridos: cve_servicios, cve_sucursales, active'
                });
            }

            // Validar que sean números válidos y positivos
            const serviciosNum = parseInt(cve_servicios);
            const sucursalesNum = parseInt(cve_sucursales);
            
            if (isNaN(serviciosNum) || isNaN(sucursalesNum) || serviciosNum <= 0 || sucursalesNum <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'cve_servicios y cve_sucursales deben ser números válidos y positivos'
                });
            }

            // Realizar el upsert
            const result = await SucursalServiciosModel.upsert({
                cve_servicios: serviciosNum,
                cve_sucursales: sucursalesNum,
                active: Boolean(active)
            });

            // Enviar notificaciones a usuarios móviles
            await this._enviarNotificacionesMoviles();

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
            console.error('Error en SucursalServiciosController.upsert:', error);
            
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtiene todas las relaciones sucursal-servicios
     */
    static async getSucursalesServicios(req, res) { 
        try {
            const sucursalesServicios = await SucursalServiciosModel.getSucursalesServicios();
            
            return res.json({
                success: true,
                data: sucursalesServicios
            });

        } catch (error) { 
            console.error("Error en SucursalServiciosController.getSucursalesServicios:", error);
            return res.status(500).json({ 
                error: "Error interno del servidor",
                message: error.message || "Error al obtener sucursales-servicios"
            });
        }
    }

    /**
     * Método privado para enviar notificaciones a usuarios móviles
     */
    static async _enviarNotificacionesMoviles() {
        try {
            const playerIds = await SucursalServiciosModel.obtenerTodosPlayerIdsMoviles();

            if (!playerIds || playerIds.length === 0) {
                console.log('No hay usuarios móviles para enviar notificación');
                return;
            }

            console.log(`Enviando notificación a ${playerIds.length} usuarios móviles...`);

            const notificacionesPromesas = playerIds.map(async (dispositivo) => {
                try {
                    const reqNotificacion = {
                        body: {
                            tipo: 'nuevo_servicio_disponible',
                            player_id: dispositivo.player_id,
                            cve_usuarios: dispositivo.cve_usuarios
                        }
                    };
                    
                    const resNotificacion = {
                        status: () => ({ json: (data) => data }),
                        json: (data) => data
                    };

                    await NotificacionesController.enviarNotificacion(reqNotificacion, resNotificacion);
                } catch (notifError) {
                    console.error(`Error enviando notificación a usuario ${dispositivo.cve_usuarios}:`, notifError);
                }
            });

            await Promise.allSettled(notificacionesPromesas);
            console.log('Proceso de notificaciones completado');

        } catch (error) {
            console.error('Error en el proceso de notificaciones:', error);
            // No lanzamos el error para no afectar el flujo principal
        }
    }
}