    // controllers/eventos.controller.js
    import {
    crearEvento,
    listarEventos,
    eliminarEvento,
    obtenerEstadoInvitados,
    } from '../services/googleCalendarService.js';

    
    export class EventosController {
    
        static async  crearEventoController(req, res) {
            try {
            const { titulo, descripcion, inicio, fin, invitadosEmails } = req.body;

            const evento = await crearEvento({
            titulo,
            descripcion,
            inicio,
            fin,
            invitadosEmails,
            });

                res.status(201).json({ ok: true, evento });
            } catch (error) {
                console.error('❌ Error al crear evento:', error);
                res.status(400).json({ ok: false, mensaje: error.message });
            }
        }

        static async  listarEventosController(req, res) {
        try {
            const eventos = await listarEventos();
            res.json({ ok: true, eventos });
        } catch (error) {
            console.error('❌ Error al listar eventos:', error);
            res.status(500).json({ ok: false, mensaje: 'Error al listar eventos' });
        }
        }

        static async  eliminarEventoController(req, res) {
        try {
            const { eventId } = req.params;
            await eliminarEvento(eventId);
            res.json({ ok: true, mensaje: 'Evento eliminado correctamente' });
        } catch (error) {
            console.error('❌ Error al eliminar evento:', error);
            res.status(500).json({ ok: false, mensaje: 'Error al eliminar evento' });
        }
        }

        
        static async  obtenerEstadoInvitadosController(req, res) {
            try {
                const { eventId } = req.params;
                const asistentes = await obtenerEstadoInvitados(eventId);
                res.json({ ok: true, asistentes });
            } catch (error) {
                console.error('❌ Error al obtener estado de asistentes:', error);
                res.status(500).json({ ok: false, mensaje: 'Error al obtener estado de asistentes' });
            }
        }
            
    }

