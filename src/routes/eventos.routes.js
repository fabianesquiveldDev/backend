    // routes/eventos.routes.js
    import { Router } from "express";
    import {  EventosController  } from '../controller/eventos.controller.js';

    const eventosRouter = Router();

    eventosRouter.post('/', EventosController.crearEventoController);
    eventosRouter.get('/',EventosController.listarEventosController);
    eventosRouter.delete('/:eventId', EventosController.eliminarEventoController);
    eventosRouter.get('/:eventId/asistentes', EventosController.obtenerEstadoInvitadosController);

    export {eventosRouter};
