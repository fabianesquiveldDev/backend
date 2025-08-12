
import { Router } from "express";
const medicosRoute = Router();
import { MedicosController } from "../controller/medicos.controller.js";

medicosRoute.post ('/', MedicosController.crear);
medicosRoute.get('/', MedicosController.getAll);   
medicosRoute.get('/login/sucursal/:cve', MedicosController.getSucursal);   
medicosRoute.get('/:cve', MedicosController.getOne);
medicosRoute.patch('/:cve', MedicosController.update);


export { medicosRoute }; 