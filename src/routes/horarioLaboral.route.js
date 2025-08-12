
import { Router } from "express";
import { HorarioLaboralController } from "../controller/horarioLaboral.controller.js";
const horarioLaboralRoute = Router();



horarioLaboralRoute.get('/', HorarioLaboralController.getAll);
horarioLaboralRoute.post ('/upsert', HorarioLaboralController.upsert);
horarioLaboralRoute.get('/dias', HorarioLaboralController.getAllDias);  

horarioLaboralRoute.get('/:cve', HorarioLaboralController.getOne);


export { horarioLaboralRoute };  