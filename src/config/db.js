import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Configuración del pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Función mejorada de verificación
async function verifyConnection() {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a PostgreSQL');
    console.log('⏱️  Hora del servidor:', res.rows[0].now);
    return { success: true, timestamp: res.rows[0].now };
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    throw err; // Propaga el error para manejo superior
  } finally {
    if (client) client.release();
  }
}

// Exportación explícita
export const db = {
  pool,
  verifyConnection
};