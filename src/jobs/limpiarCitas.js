    import cron from 'node-cron';
    import { db } from '../config/db.js';

    async function limpiarNoShowViejos() {
    try {
        const res = await db.pool.query(`
        UPDATE citas
            SET no_show = FALSE
            WHERE no_show = TRUE AND fecha_hora_consulta < NOW() - INTERVAL '2 months';

        `);
        console.log(`🧹 Tarea limpieza no_show: ${res.rowCount} citas actualizadas a FALSE`);
    } catch (error) {
        console.error('❌ Error limpiando no_show viejos:', error);
    }
    }

    export function programarTareaLimpieza() {
    cron.schedule('0 0 * * *', () => {
        console.log('🕛 Ejecutando tarea programada: limpiar no_show viejos...');
        limpiarNoShowViejos();
    });
    }
