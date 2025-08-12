
import { Router } from "express";
import { EspecialidadesController } from "../controller/especialidades.controller.js";
const especialidadesRoute = Router();


especialidadesRoute.post ('/', EspecialidadesController.crear);
especialidadesRoute.get('/', EspecialidadesController.getAll);   
especialidadesRoute.get('/:cve', EspecialidadesController.getOne);
especialidadesRoute.patch('/:cve', EspecialidadesController.update);


export { especialidadesRoute }; 