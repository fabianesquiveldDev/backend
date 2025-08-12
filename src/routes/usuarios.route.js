import { Router } from "express";
const usuariosRoute = Router();
import { UsuariosController } from "../controller/usuarios.controller.js";


// Rutas más específicas primero
usuariosRoute.get('/admin/:cve', UsuariosController.getAdmin);
usuariosRoute.get('/persona/:cve', UsuariosController.getUserPeroson);
usuariosRoute.get('/sucursal/:cve', UsuariosController.getSucursal);
usuariosRoute.get('/medico/local/:cve', UsuariosController.getSucursallocal);   

// Rutas generales al final
usuariosRoute.get('/:cve', UsuariosController.getOne);  
usuariosRoute.post('/', UsuariosController.crear);
usuariosRoute.get('/', UsuariosController.getAll); 
usuariosRoute.patch('/:cve', UsuariosController.update);

usuariosRoute.get('/check-username/:username', UsuariosController.checkUsername);





export { usuariosRoute };  