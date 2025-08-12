import { Router } from "express";
const pisosRoute = Router();
import { PisosController } from "../controller/pisos.controller.js";

pisosRoute.post('/', PisosController.crear);                             // 
pisosRoute.get('/sucursales/:cve', PisosController.getByCveSucursal);   
pisosRoute.get('/', PisosController.getAll);                             // 
pisosRoute.get('/:cve', PisosController.getOne);                         // 👈 después rutas dinámicas
pisosRoute.patch('/:cve', PisosController.update);                       // ✔️



export { pisosRoute }; 