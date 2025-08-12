
import { Router } from "express";
import { ConsultoriosController } from "../controller/consultorios.controller.js";
const consultoriosRoute = Router();


consultoriosRoute.post ('/', ConsultoriosController.crear);
consultoriosRoute.get('/', ConsultoriosController.getAll);               
consultoriosRoute.get('/:cve', ConsultoriosController.getOne);
consultoriosRoute.get('/sucursales/:cve', ConsultoriosController.getByCveSucursal); 
consultoriosRoute.patch('/:cve', ConsultoriosController.update);


export { consultoriosRoute }; 