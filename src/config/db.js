import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Configuración del pool usando DATABASE_URL de Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // obligatorio para conectarse desde Railway
  },
});

// Función de verificación de la conexión
async function verifyConnection() {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a PostgreSQL (Railway)');
    console.log('⏱️ Hora del servidor:', res.rows[0].now);
    return { success: true, timestamp: res.rows[0].now };
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    throw err; // Propaga el error para manejo superior
  } finally {
    if (client) client.release();
  }
}

// Exportación
export const db = {
  pool,
  verifyConnection,
};
