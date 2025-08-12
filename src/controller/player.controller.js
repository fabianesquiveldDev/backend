// player.controller.js
import { guardarPlayerIdEnBD } from '../services/player.service.js';

export class PlayerController {
    static async guardarPlayerId(req, res) {
        const { player_id, plataforma = 'mobile' } = req.body;
        
        // ✅ Obtener usuario desde el middleware auth
        const usuarioId = req.usuarioId || req.user?.cve_usuario || req.user?.cve_usuarios;

        // Validaciones mejoradas
        if (!player_id || typeof player_id !== 'string') {
            return res.status(400).json({ 
                success: false,
                message: 'player_id es requerido y debe ser una cadena válida' 
            });
        }

        if (!usuarioId) {
            return res.status(401).json({ 
                success: false,
                message: 'Usuario no autenticado correctamente' 
            });
        }

        // Validar plataforma
        const plataformasValidas = ['mobile', 'web', 'desktop', 'expo'];
        if (!plataformasValidas.includes(plataforma)) {
            return res.status(400).json({
                success: false,
                message: `Plataforma no válida. Opciones: ${plataformasValidas.join(', ')}`
            });
        }

        try {
            // ✅ Pasar los 3 parámetros
            const resultado = await guardarPlayerIdEnBD(usuarioId, player_id, plataforma);
            
            res.json({ 
                success: true,
                message: 'Player ID registrado correctamente',
                data: {
                    usuario_id: usuarioId,
                    player_id: player_id,
                    plataforma: plataforma,
                    accion: resultado.accion || 'registrado'
                }
            });
        } catch (error) {
            console.error('Error al guardar player_id:', error);
            
            // ✅ Diferentes tipos de error
            if (error.code === '23505') { // Constraint violation
                return res.status(409).json({
                    success: false,
                    message: 'Conflicto al registrar dispositivo'
                });
            }
            
            res.status(500).json({ 
                success: false,
                message: 'Error interno del servidor',
                ...(process.env.NODE_ENV === 'development' && { error: error.message })
            });
        }
    }
}