
import { Router } from "express";
import { ServiciosController } from "../controller/servicios.controller.js";
const serviciosRoute = Router();


serviciosRoute.post ('/', ServiciosController.crear);
serviciosRoute.get('/todos', ServiciosController.getAll);
serviciosRoute.get('/:cve', ServiciosController.getOne);
serviciosRoute.patch('/:cve', ServiciosController.update);



export { serviciosRoute }; 