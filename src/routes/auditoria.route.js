
import { Router } from "express";
import { AuditoriaRouteController } from "../controller/auditoria.controller.js";
const auditoriaRoute = Router();



auditoriaRoute.post('/', AuditoriaRouteController.crear);
auditoriaRoute.get('/', AuditoriaRouteController.getAll);

export { auditoriaRoute };  