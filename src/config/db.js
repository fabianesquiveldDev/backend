import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

<<<<<<< HEAD
// Configuración del pool usando DATABASE_URL de Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // obligatorio para conectarse desde local
  },
});

// Función de verificación
=======
// Configuración del pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Función mejorada de verificación
>>>>>>> 24914752ac825107d34852571f8363ada74da35c
async function verifyConnection() {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query('SELECT NOW()');
<<<<<<< HEAD
    console.log('✅ Conexión exitosa a PostgreSQL (Railway)');
=======
    console.log('✅ Conexión exitosa a PostgreSQL');
>>>>>>> 24914752ac825107d34852571f8363ada74da35c
    console.log('⏱️  Hora del servidor:', res.rows[0].now);
    return { success: true, timestamp: res.rows[0].now };
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
<<<<<<< HEAD
    throw err;
=======
    throw err; // Propaga el error para manejo superior
>>>>>>> 24914752ac825107d34852571f8363ada74da35c
  } finally {
    if (client) client.release();
  }
}

<<<<<<< HEAD
// Exportación
export const db = {
  pool,
  verifyConnection
};
=======
// Exportación explícita
export const db = {
  pool,
  verifyConnection
};
>>>>>>> 24914752ac825107d34852571f8363ada74da35c
