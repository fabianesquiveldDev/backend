// routes/player.route.js
import { Router } from 'express';
import { PlayerController } from '../controller/player.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const playerRoute = Router();

playerRoute.post('/playerid', authMiddleware, PlayerController.guardarPlayerId);

export { playerRoute };
