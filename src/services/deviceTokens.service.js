// src/services/deviceTokens.service.js

import { db } from '../config/db.js'; // Ajusta la ruta si es necesario
const { pool } = db;

import fetch from 'node-fetch';

/**
 * Guarda o actualiza el token FCM de un usuario en la base de datos
 * @param {number} userId - ID del usuario
 * @param {string} fcmToken - Token FCM del dispositivo
 */
export async function saveDeviceToken(userId, fcmToken) {
  const querySelect = 'SELECT * FROM dispositivos_desktop_usuarios WHERE fcm_token = $1';
  const result = await pool.query(querySelect, [fcmToken]);

  if (result.rowCount > 0) {
    // Actualizar userId y fecha
    const queryUpdate = `
      UPDATE dispositivos_desktop_usuarios 
      SET cve_usuarios = $1, updated_at = NOW()
      WHERE fcm_token = $2
    `;
    await pool.query(queryUpdate, [userId, fcmToken]);
  } else {
    // Insertar nuevo registro
    const queryInsert = `
      INSERT INTO dispositivos_desktop_usuarios (cve_usuarios, fcm_token, device_type, created_at, updated_at)
      VALUES ($1, $2, 'desktop', NOW(), NOW())
    `;
    await pool.query(queryInsert, [userId, fcmToken]);
  }
}

/**
 * Envía una notificación push FCM a todos los dispositivos de un usuario
 * @param {number} userId - ID del usuario
 * @param {string} title - Título de la notificación
 * @param {string} body - Cuerpo de la notificación
 * @returns {Promise<number[]>} - Array con códigos de status HTTP de cada envío
 */
export async function sendFCMNotification(userId, title, body) {
  const query = 'SELECT fcm_token FROM dispositivos_desktop_usuarios WHERE cve_usuarios = $1';
  const result = await pool.query(query, [userId]);

  if (result.rowCount === 0) {
    throw new Error('No hay tokens FCM para ese usuario');
  }

  const serverKey = process.env.FIREBASE_SERVER_KEY;
  if (!serverKey) throw new Error('FIREBASE_SERVER_KEY no configurada');

  const notifications = result.rows.map(row => {
    const message = {
      to: row.fcm_token,
      notification: { title, body },
    };

    return fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        Authorization: `key=${serverKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  });

  const responses = await Promise.all(notifications);
  return responses.map(res => res.status);
}
