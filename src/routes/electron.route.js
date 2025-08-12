// routes/electronNotifications.js
import { Router } from "express";
import { 
    registrarDispositivoElectron,
    sendElectronNotification,
    obtenerPlayerIdsPorUsuario,
    obtenerEstadisticasDispositivos 
} from '../services/onesignalService.js';

const ElectronNotificationsRoute = Router();

// ✅ ENDPOINT 1: Registrar dispositivo Electron
ElectronNotificationsRoute.post('/register-device', async (req, res) => {
    try {
        const { cve_usuarios, playerId } = req.body;

        // Validaciones
        if (!cve_usuarios || !playerId) {
            return res.status(400).json({
                success: false,
                message: 'cve_usuarios y playerId son requeridos'
            });
        }

        // Registrar dispositivo
        const result = await registrarDispositivoElectron(cve_usuarios, playerId);

        res.json({
            success: true,
            message: 'Dispositivo registrado exitosamente',
            data: result
        });

    } catch (error) {
        console.error('❌ Error registrando dispositivo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// ✅ ENDPOINT 2: Enviar notificación a usuario específico
ElectronNotificationsRoute.post('/send-notification', async (req, res) => {
    try {
        const { 
            cve_usuarios, 
            title, 
            message, 
            actionData = null,
            priority = 'normal' 
        } = req.body;

        // Validaciones
        if (!cve_usuarios || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'cve_usuarios, title y message son requeridos'
            });
        }

        // Enviar notificación
        const result = await sendElectronNotification({
            cve_usuarios,
            title,
            message,
            actionData,
            priority
        });

        res.json(result);

    } catch (error) {
        console.error('❌ Error enviando notificación:', error);
        res.status(500).json({
            success: false,
            message: 'Error enviando notificación',
            error: error.message
        });
    }
});

// ✅ ENDPOINT 3: Obtener dispositivos de un usuario
ElectronNotificationsRoute.get('/user-devices/:cve_usuarios', async (req, res) => {
    try {
        const { cve_usuarios } = req.params;

        const devices = await obtenerPlayerIdsPorUsuario(cve_usuarios);

        res.json({
            success: true,
            data: {
                cve_usuarios,
                total_devices: devices.length,
                devices
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo dispositivos:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo dispositivos',
            error: error.message
        });
    }
});

// ✅ ENDPOINT 4: Estadísticas de dispositivos (opcional)
ElectronNotificationsRoute.get('/stats', async (req, res) => {
    try {
        const stats = await obtenerEstadisticasDispositivos();

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas',
            error: error.message
        });
    }
});

// ✅ ENDPOINT 5: Test de notificación (para pruebas)
ElectronNotificationsRoute.post('/test-notification', async (req, res) => {
    try {
        const { cve_usuarios } = req.body;

        if (!cve_usuarios) {
            return res.status(400).json({
                success: false,
                message: 'cve_usuarios es requerido'
            });
        }

        const result = await sendElectronNotification({
            cve_usuarios,
            title: '🧪 Prueba de Notificación',
            message: 'Esta es una notificación de prueba desde tu backend',
            actionData: {
                type: 'test',
                timestamp: new Date().toISOString()
            },
            priority: 'high'
        });

        res.json({
            success: true,
            message: 'Notificación de prueba enviada',
            result
        });

    } catch (error) {
        console.error('❌ Error en prueba:', error);
        res.status(500).json({
            success: false,
            message: 'Error en notificación de prueba',
            error: error.message
        });
    }
});

export { ElectronNotificationsRoute };