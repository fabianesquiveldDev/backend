import cron from 'node-cron';
import { CitasModel } from '../models/citas.model.js';
import { NotificacionesController } from '../controller/notificaciones.controller.js';

// Control para evitar spam de logs
let contadorEjecuciones = 0;

async function enviarNotificacionRecordatorio(cve_pacientes, mensaje, fecha, hora) {
    try {
        const dispositivos = await CitasModel.obtenerTodosPlayerIdsMoviles();
        const dispositivosPaciente = dispositivos.filter(d => d.cve_usuarios === cve_pacientes);

        if (dispositivosPaciente.length === 0) {
            console.log(`❌ No dispositivos para paciente ${cve_pacientes}`);
            return;
        }

        for (const dispositivo of dispositivosPaciente) {
            const req = {
                body: {
                    tipo: 'recordatorio_24h',
                    player_id: dispositivo.player_id,
                    cve_usuarios: cve_pacientes,
                    variables: { 
                        mensaje,
                        fecha,
                        hora
                    }
                }
            };
            const res = {
                status: () => ({ json: () => {} }),
                json: () => {}
            };
            await NotificacionesController.enviarNotificacion(req, res);
        }
    } catch (error) {
        console.error(`❌ Error enviando notificación:`, error);
    }
}

async function enviarRecordatorios() {
    contadorEjecuciones++;
    console.log(`\n=== EJECUCIÓN #${contadorEjecuciones} ===`);
    console.log(`⏰ ${new Date().toLocaleString('es-ES')} - Buscando citas para recordatorio 24h...`);
    
    try {
        // 🔍 DEBUG: Verificar primero que el método existe
        if (!CitasModel.getCitasParaRecordatorio) {
            console.error(`❌ ERROR: CitasModel.getCitasParaRecordatorio no existe`);
            return;
        }

        // 🔍 DEBUG: Mostrar el rango de fechas que estamos buscando
        const ahora = new Date();
        const en18horas = new Date(Date.now() + 18*60*60*1000);
        const en30horas = new Date(Date.now() + 30*60*60*1000);
        
        console.log(`📅 Hora actual: ${ahora.toLocaleString('es-ES')}`);
        console.log(`📅 Buscando citas desde: ${en18horas.toLocaleString('es-ES')}`);
        console.log(`📅 Hasta (no incluye): ${en30horas.toLocaleString('es-ES')}`);

        const citas = await CitasModel.getCitasParaRecordatorio();
        console.log(`📊 Se encontraron ${citas.length} citas para recordatorio`);
        
        if (citas.length === 0) {
            console.log(`ℹ️ No hay citas que requieran recordatorio en este momento`);
            return;
        }

        // Mostrar detalles de las citas encontradas
        console.log(`📋 Detalles de las citas:`);
        citas.forEach((cita, index) => {
            const fechaCita = new Date(cita.fecha_hora_inicio);
            const horasHasta = (fechaCita.getTime() - Date.now()) / (1000 * 60 * 60);
            console.log(`  ${index + 1}. Paciente: ${cita.cve_pacientes}, Fecha: ${fechaCita.toLocaleString('es-ES')}, En ${horasHasta.toFixed(1)} horas`);
        });

        for (const cita of citas) {
            const fechaCita = new Date(cita.fecha_hora_inicio);
            const fecha = fechaCita.toLocaleDateString('es-ES');
            const hora = fechaCita.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const mensaje = `Recordatorio: tiene una cita mañana {fecha} {hora}`;
            
            console.log(`\n🔄 Procesando paciente ${cita.cve_pacientes}`);
            console.log(`📝 Mensaje: ${mensaje}`);
            console.log(`📝 Variables: fecha=${fecha}, hora=${hora}`);
            
            await enviarNotificacionRecordatorio(cita.cve_pacientes, mensaje, fecha, hora);
        }

        console.log(`\n✅ Proceso completado - ${citas.length} recordatorios procesados`);
        
    } catch (error) {
        console.error(`❌ Error en enviarRecordatorios:`, error);
        console.error(`Stack trace:`, error.stack);
    }
    
    console.log(`=== FIN EJECUCIÓN #${contadorEjecuciones} ===\n`);
}

// Ejecutar todos los días a las 9:00 AM
cron.schedule('0 9 * * *', () => {
    enviarRecordatorios().catch(console.error);
});

console.log(`🚀 Cron job de recordatorios iniciado`);
console.log(`📅 Se ejecutará todos los días a las 9:00 AM`);
console.log(`📅 Fecha actual: ${new Date().toLocaleString('es-ES')}`);

// 🔧 También ejecutar una vez al iniciar para debug inmediato
console.log(`🔍 Ejecutando una vez al iniciar para debug...`);
enviarRecordatorios().catch(console.error);