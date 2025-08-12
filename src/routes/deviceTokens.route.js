import { Router } from 'express';
import { DeviceTokensController } from '../controller/deviceTokens.controller.js';

const router = Router();

router.post('/fcm-token', DeviceTokensController.saveToken);
router.post('/send-notification', DeviceTokensController.sendNotification);

export { router as DeviceTokensRoute };
