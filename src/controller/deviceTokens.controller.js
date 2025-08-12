    import { saveDeviceToken, sendFCMNotification } from '../services/deviceTokens.service.js';

    export const DeviceTokensController = {
    saveToken: async (req, res) => {
        try {
        const { userId, fcmToken } = req.body;
        if (!userId || !fcmToken) {
            return res.status(400).json({ error: 'userId y fcmToken son requeridos' });
        }

        await saveDeviceToken(userId, fcmToken);
        return res.json({ ok: true, message: 'Token guardado correctamente' });
        } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error guardando token' });
        }
    },

    sendNotification: async (req, res) => {
        try {
        const { userId, title, body } = req.body;
        if (!userId || !title || !body) {
            return res.status(400).json({ error: 'userId, title y body son requeridos' });
        }

        const result = await sendFCMNotification(userId, title, body);
        return res.json({ ok: true, result });
        } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error enviando notificación' });
        }
    },
    };
