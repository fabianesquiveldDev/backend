// routes/auth.js
import { Router } from 'express';
import { AuthController } from '../controller/auth.controller.js';

const authRouter = Router();

// 🔑 Login original - ahora con soporte para OneSignal
authRouter.post('/login', AuthController.login);

// 🆕 Ruta adicional - actualizar dispositivo sin hacer login
authRouter.put('/dispositivo', AuthController.actualizarDispositivo);

authRouter.post('/forgot-password', AuthController.forgotPassword);
authRouter.post('/reset-password', AuthController.resetPassword);

export default authRouter;