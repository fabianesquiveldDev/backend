import { Router } from "express";
const usuariosSucursalesRoute = Router();
import { UsuariosSucursalesController } from "../controller/usuariosSucursales.controller.js";


usuariosSucursalesRoute.post('/', UsuariosSucursalesController.crear);
usuariosSucursalesRoute.patch('/:cve', UsuariosSucursalesController.update);



export { usuariosSucursalesRoute };  