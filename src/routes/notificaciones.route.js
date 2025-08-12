import { Router } from "express";
import { NotificacionesController } from "../controller/notificaciones.controller.js";

const notificacionesRoute = Router();

// ==========================================
// ENDPOINTS PARA LAS 14 NOTIFICACIONES
// ==========================================

// 🔧 BÁSICOS (Obligatorios)
notificacionesRoute.post('/enviar', NotificacionesController.enviarNotificacion); // Enviar cualquiera de las 14
notificacionesRoute.post('/enviar-personalizada', NotificacionesController.enviarNotificacionPersonalizada); // Nueva ruta para notificación personalizada
notificacionesRoute.get('/tipos', NotificacionesController.obtenerTiposNotificaciones); // Listar los 14 tipos
notificacionesRoute.get('/historial/:cve_usuarios', NotificacionesController.obtenerHistorialUsuario); // Ver enviadas

// ⚙️ CONFIGURACIÓN (Opcional)
notificacionesRoute.get('/configuracion/:cve_usuarios', NotificacionesController.obtenerConfiguracionUsuario);
notificacionesRoute.put('/configuracion/:cve_usuarios', NotificacionesController.actualizarConfiguracionUsuario);

export { notificacionesRoute };
