import { Router } from "express";
const sucursalesRoute = Router();
import { SucursalesController } from "../controller/sucursales.controller.js";


sucursalesRoute.post('/', SucursalesController.crear);
sucursalesRoute.get('/search', SucursalesController.getsearch); 
sucursalesRoute.get('/distribucion/:cve', SucursalesController.distribucion); 
sucursalesRoute.get('/', SucursalesController.getAll);
sucursalesRoute.get('/:cve', SucursalesController.getOne); 
sucursalesRoute.patch('/:cve', SucursalesController.update);




export { sucursalesRoute }; 