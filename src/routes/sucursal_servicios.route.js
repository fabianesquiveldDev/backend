
import { Router } from "express";
import { SucursalServiciosController } from "../controller/sucursal_servicios.controller.js";
const serviciosSucursalesRoute = Router();


serviciosSucursalesRoute.post ('/', SucursalServiciosController.crear);
serviciosSucursalesRoute.get('/todos/:cve', SucursalServiciosController.getAll);
serviciosSucursalesRoute.get('/sucursalesServiciosAll', SucursalServiciosController.getSucusalesServicios);
serviciosSucursalesRoute.patch('/:cve', SucursalServiciosController.update);
serviciosSucursalesRoute.post('/upsert', SucursalServiciosController.upsert);




export { serviciosSucursalesRoute }; 