
import { Router } from "express";
const medicosPerfilRoute = Router();
import { MedicosPerfilController } from "../controller/perfilMedicos.controller.js";

medicosPerfilRoute.post ('/', MedicosPerfilController.crear);
medicosPerfilRoute.get('/', MedicosPerfilController.getAll);   

// 🔥 RUTAS ESPECÍFICAS PRIMERO (antes de /:cve genérico)
// Generar PDF de receta - ESTA ES LA CLAVE PARA EL PDF
medicosPerfilRoute.post('/:cve/pdf', MedicosPerfilController.generarPDF);

medicosPerfilRoute.get('/:cve', MedicosPerfilController.getOne);
medicosPerfilRoute.patch('/:cve', MedicosPerfilController.update);


export { medicosPerfilRoute }; 

