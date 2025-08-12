
import { Router } from "express";
const pacientesRoute = Router();
import { PacientesController } from "../controller/pacientes.controller.js";

pacientesRoute.post ('/', PacientesController.crear);
pacientesRoute.get('/sucursal/:cve', PacientesController.getPorSucursal);
pacientesRoute.get('/:cve', PacientesController.getOne);
pacientesRoute.patch('/:cve', PacientesController.update);


export { pacientesRoute }; 