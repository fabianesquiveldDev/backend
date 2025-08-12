import { db } from '../config/db.js';
const { pool } = db;

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { enviarCorreo } from '../services/ResendServices.js'; 
import { guardarPlayerIdEnBD } from '../models/player.model.js';

export class AuthController {
  static async login(req, res) {
    const { 
      nombre_usuario, 
      contrasena, 
      player_id,
      plataforma = 'web'  // 🔧 MEJORA: Valor por defecto
    } = req.body;

    try {
      // ✅ VALIDACIONES BÁSICAS
      if (!nombre_usuario || !contrasena) {
        return res.status(400).json({ 
          error: 'Nombre de usuario y contraseña son requeridos' 
        });
      }

      // 🔧 MEJORA: Validación más específica
      const plataformasValidas = ['mobile', 'desktop', 'web', 'android', 'ios'];
      if (plataforma && !plataformasValidas.includes(plataforma)) {
        return res.status(400).json({
          error: `Plataforma debe ser: ${plataformasValidas.join(', ')}`
        });
      }

      // 🔧 MEJORA: Validar formato de player_id
      if (player_id && (typeof player_id !== 'string' || player_id.length < 10)) {
        return res.status(400).json({
          error: 'player_id debe ser una cadena válida de OneSignal'
        });
      }

      // 🔍 CONSULTA DE USUARIO
      const query = `
        SELECT u.*, r.nombre AS rol
        FROM usuarios u
        JOIN roles_usuarios ru ON u.cve_usuarios = ru.cve_usuarios
        JOIN roles r ON ru.cve_roles = r.cve_roles
        WHERE u.nombre_usuario = $1 AND u.activo = true
      `;

      const { rows } = await pool.query(query, [nombre_usuario]);

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' }); // 🔧 MEJORA: Mensaje genérico por seguridad
      }

      const usuario = rows[0];

      // 🔐 VALIDACIÓN DE CONTRASEÑA
      const passwordValida = await bcrypt.compare(contrasena, usuario.contrasena);
      if (!passwordValida) {
        return res.status(401).json({ error: 'Credenciales inválidas' }); // 🔧 MEJORA: Mensaje genérico
      }

      // 🎯 REGISTRAR DISPOSITIVO ONESIGNAL
      let dispositivoInfo = null;
      if (player_id) { // 🔧 MEJORA: Solo verificar player_id
        try {
          dispositivoInfo = await guardarPlayerIdEnBD(
            usuario.cve_usuarios, 
            player_id, 
            plataforma
          );
          console.log(`📱 Dispositivo ${dispositivoInfo.accion} para ${usuario.nombre_usuario}`);
        } catch (error) {
          console.error('❌ Error registrando dispositivo OneSignal:', error);
          // 🔧 MEJORA: Logging más detallado pero sin exponer al cliente
          dispositivoInfo = { success: false, error: 'Error de registro de dispositivo' };
        }
      }

      // 🔑 GENERAR TOKEN JWT
      const tokenPayload = {
        cve_usuario: usuario.cve_usuarios,
        nombre_usuario: usuario.nombre_usuario,
        rol: usuario.rol,
        // 🔧 MEJORA: Agregar timestamp para mejor control
        iat: Math.floor(Date.now() / 1000)
      };

      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      // 📤 RESPUESTA MEJORADA
      const response = {
        success: true, // 🔧 MEJORA: Flag de éxito consistente
        message: 'Login exitoso',
        token,
        usuario: {
          cve_usuario: usuario.cve_usuarios,
          nombre_usuario: usuario.nombre_usuario,
          rol: usuario.rol
        }
      };

      // 📱 Agregar info del dispositivo si se registró
      if (dispositivoInfo?.success) {
        response.dispositivo = {
          registrado: true,
          accion: dispositivoInfo.accion,
          plataforma: plataforma,
          player_id: player_id // 🔧 MEJORA: Confirmar player_id registrado
        };
      } else if (player_id && !dispositivoInfo?.success) {
        // 🔧 MEJORA: Informar si hubo problema con dispositivo
        response.dispositivo = {
          registrado: false,
          mensaje: 'Login exitoso, pero hubo un problema registrando el dispositivo'
        };
      }

      // 🔧 MEJORA: Header de seguridad
      res.set('X-Content-Type-Options', 'nosniff');
      res.json(response);

    } catch (error) {
      console.error('Error en login:', error);
      
      // 🔧 MEJORA: Manejo específico de errores de JWT
      if (error.name === 'JsonWebTokenError') {
        return res.status(500).json({ 
          success: false,
          error: 'Error de configuración del sistema' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }

  // 🆕 MÉTODO ADICIONAL - Actualizar solo el dispositivo
  static async actualizarDispositivo(req, res) {
    const { player_id, plataforma = 'web' } = req.body; // 🔧 MEJORA: Valor por defecto
    
    try {
      // 🔧 MEJORA: Extraer función para obtener usuario del token
      const usuario = await AuthController._obtenerUsuarioDeToken(req);
      
      if (!player_id) {
        return res.status(400).json({
          success: false,
          error: 'player_id es requerido'
        });
      }

      const resultado = await guardarPlayerIdEnBD(
        usuario.cve_usuario, 
        player_id, 
        plataforma
      );

      res.json({
        success: true,
        message: 'Dispositivo actualizado exitosamente',
        dispositivo: {
          ...resultado,
          player_id
        }
      });

    } catch (error) {
      console.error('Error actualizando dispositivo:', error);
      
      if (error.message === 'TOKEN_INVALID') {
        return res.status(401).json({ 
          success: false,
          error: 'Token inválido' 
        });
      }
      
      if (error.message === 'TOKEN_MISSING') {
        return res.status(401).json({ 
          success: false,
          error: 'Token requerido' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }

  // 🔧 MEJORA: Función auxiliar para extraer usuario del token
  static async _obtenerUsuarioDeToken(req) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('TOKEN_MISSING');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new Error('TOKEN_INVALID');
    }
  }

  // 🆕 BONUS: Método para logout (limpiar dispositivo)
  static async logout(req, res) {
    const { player_id } = req.body;
    
    try {
      const usuario = await AuthController._obtenerUsuarioDeToken(req);
      
      if (player_id) {
        // Aquí podrías marcar el dispositivo como inactivo
        // await desactivarDispositivo(usuario.cve_usuario, player_id);
        console.log(`📱 Logout - Usuario: ${usuario.nombre_usuario}, Player: ${player_id}`);
      }

      res.json({
        success: true,
        message: 'Logout exitoso'
      });

    } catch (error) {
      // Para logout, no es crítico si hay errores
      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    }
  }

  static async forgotPassword(req, res) {
    const { email } = req.body;

    try {
      // ✅ VALIDACIÓN BÁSICA
      if (!email) {
        return res.status(400).json({ 
          success: false,
          error: 'Email es requerido' 
        });
      }

      // 🔍 BUSCAR USUARIO POR EMAIL
      const query = `
        SELECT 
        u.cve_usuarios, 
        u.nombre_usuario, 
        p.email, 
        u.activo
    FROM usuarios u
    JOIN personas p ON u.cve_usuarios = p.cve_personas
    WHERE p.email = $1 
        AND u.activo = true;
      `;

      const { rows } = await pool.query(query, [email.toLowerCase()]);

      // 🔧 RESPUESTA GENÉRICA POR SEGURIDAD
      const response = {
        success: true,
        message: 'Si el email está registrado, recibirás las instrucciones de recuperación'
      };

      if (rows.length === 0) {
        return res.status(200).json(response);
      }

      const usuario = rows[0];

      // 🔑 GENERAR TOKEN SEGURO
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      // 💾 GUARDAR TOKEN EN BD
      const expiracion = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

      const updateQuery = `
        UPDATE usuarios 
        SET password_reset_token = $1, 
            password_reset_expires = $2
        WHERE cve_usuarios = $3
        RETURNING *
      `;

      await pool.query(updateQuery, [resetTokenHash, expiracion, usuario.cve_usuarios]);

      const resetUrl = `${process.env.FRONTEND_URL}/recuperar-contrasena?token=${resetToken}`;  // 👈 Corregido
      try {
        await AuthController._sendResetEmail(usuario.email, resetUrl, usuario.nombre_usuario);
        console.log(`📧 Email de recuperación enviado a: ${usuario.email}`);
      } catch (emailError) {
        console.error('❌ Error enviando email:', emailError);
        // No exponer error de email al usuario
      }

      res.status(200).json(response);

    } catch (error) {
      console.error('Error en forgotPassword:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  }


static async resetPassword(req, res) {
  const { token, newPassword } = req.body;

  try {
    // 🔍 DEBUG: Agregar estos logs
    console.log('🔍 Token recibido:', token);
    console.log('🔍 Token length:', token ? token.length : 'undefined');
    console.log('🔍 newPassword recibido:', newPassword ? 'SÍ' : 'NO');
    
    // ✅ VALIDACIONES BÁSICAS
    if (!token || !newPassword) {
      console.log('❌ Faltan datos: token=' + !!token + ', newPassword=' + !!newPassword);
      return res.status(400).json({ 
        success: false, 
        error: 'Token y nueva contraseña son requeridos' 
      });
    }

    if (newPassword.length < 6) {
      console.log('❌ Contraseña muy corta:', newPassword.length);
      return res.status(400).json({ 
        success: false, 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // 🔍 VERIFICAR TOKEN
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    console.log('🔍 Hash generado para buscar:', resetTokenHash);
    
    const query = `
      SELECT 
        u.cve_usuarios, 
        u.nombre_usuario, 
        p.email,
        u.password_reset_token,
        u.password_reset_expires
    FROM usuarios u
    JOIN personas p ON u.cve_usuarios = p.cve_personas
    WHERE u.password_reset_token = $1 
        AND u.password_reset_expires > CURRENT_TIMESTAMP 
        AND u.activo = true;
    `;

    console.log('🔍 Ejecutando query con hash:', resetTokenHash);
    const { rows } = await pool.query(query, [resetTokenHash]);
    console.log('🔍 Resultados encontrados:', rows.length);
    
    if (rows.length > 0) {
      console.log('🔍 Usuario encontrado:', rows[0].nombre_usuario);
      console.log('🔍 Token en BD:', rows[0].password_reset_token);
      console.log('🔍 Expira en:', rows[0].password_reset_expires);
      console.log('🔍 Fecha actual:', new Date());
    } else {
      // Buscar si existe el usuario con token (sin importar expiración)
      const debugQuery = `
        SELECT 
          u.cve_usuarios, 
          u.nombre_usuario,
          u.password_reset_token,
          u.password_reset_expires,
          u.activo,
          CASE 
            WHEN u.password_reset_expires <= CURRENT_TIMESTAMP THEN 'EXPIRADO'
            WHEN u.activo = false THEN 'USUARIO_INACTIVO'
            ELSE 'OK'
          END as estado
        FROM usuarios u
        WHERE u.password_reset_token = $1;
      `;
      
      const debugResult = await pool.query(debugQuery, [resetTokenHash]);
      console.log('🔍 DEBUG - Tokens en BD:', debugResult.rows);
      
      if (debugResult.rows.length === 0) {
        console.log('❌ No se encontró ningún usuario con este token');
      } else {
        console.log('❌ Token encontrado pero:', debugResult.rows[0].estado);
      }
    }

    if (rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token inválido o expirado' 
      });
    }

    const usuario = rows[0];

    // 🔐 HASHEAR NUEVA CONTRASEÑA
    console.log('🔐 Hasheando nueva contraseña...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log('✅ Contraseña hasheada exitosamente');
    
    // 💾 ACTUALIZAR CONTRASEÑA Y LIMPIAR TOKEN
    const updateQuery = `
      UPDATE usuarios 
      SET contrasena = $1, 
          password_reset_token = NULL, 
          password_reset_expires = NULL
      WHERE cve_usuarios = $2
      RETURNING cve_usuarios, nombre_usuario;
    `;

    console.log('💾 Actualizando contraseña para usuario ID:', usuario.cve_usuarios);
    const updateResult = await pool.query(updateQuery, [hashedPassword, usuario.cve_usuarios]);
    
    if (updateResult.rows.length > 0) {
      console.log(`🔐 Contraseña actualizada exitosamente para usuario: ${usuario.nombre_usuario}`);
    } else {
      console.log('❌ No se pudo actualizar la contraseña');
      return res.status(500).json({ 
        success: false, 
        error: 'No se pudo actualizar la contraseña' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error completo en resetPassword:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Errores específicos
    if (error.code === '23505') { // Duplicate key
      return res.status(500).json({ 
        success: false, 
        error: 'Error de duplicación en base de datos' 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Error de validación: ' + error.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
}

 static async _sendResetEmail(email, resetUrl, userName) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Recuperación de Contraseña</h1>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Hola <strong>${userName || ''}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 30px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>MediCitas</strong>.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 35px; 
                      text-decoration: none; 
                      border-radius: 50px; 
                      display: inline-block;
                      font-weight: bold;
                      font-size: 16px;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                      transition: all 0.3s ease;">
              🔓 Restablecer Contraseña
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="margin: 0; color: #856404; font-weight: bold;">
              ⏰ <strong>Importante:</strong> Este enlace expirará en 30 minutos por seguridad.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #888; margin-bottom: 10px;">
            Si no solicitaste este cambio, puedes ignorar este email de forma segura.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <p style="font-size: 12px; color: #666; margin: 0;">
              <strong>¿El botón no funciona?</strong> Copia y pega este enlace en tu navegador:
            </p>
            <p style="font-size: 12px; word-break: break-all; margin: 10px 0 0 0;">
              <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              © ${new Date().getFullYear()} MediCitas - Sistema de Gestión Médica
            </p>
          </div>
        </div>
      </div>
    `;

    const textoPlano = `
      Recuperación de Contraseña - MediCitas
      
      Hola ${userName || ''},
      
      Recibimos una solicitud para restablecer tu contraseña.
      
      Para crear una nueva contraseña, visita el siguiente enlace:
      ${resetUrl}
      
      Este enlace expirará en 30 minutos.
      
      Si no solicitaste este cambio, puedes ignorar este email.
      
      © ${new Date().getFullYear()} MediCitas
    `;

    return await enviarCorreo({
      para: email,
      asunto: '🔐 Recuperación de Contraseña - MediCitas',
      textoPlano: textoPlano,
      html: htmlContent
    });
  }

}