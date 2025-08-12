
import { Router } from "express";
import { DisponibilidadCitasController } from "../controller/disponibilidad.citas.controller.js";
const disponibilidadcitaRoute = Router();


disponibilidadcitaRoute.post ('/', DisponibilidadCitasController.crear);
disponibilidadcitaRoute.get('/', DisponibilidadCitasController.getAll);   
disponibilidadcitaRoute.get('/:cve', DisponibilidadCitasController.getOne);
disponibilidadcitaRoute.patch('/:cve', DisponibilidadCitasController.update);

disponibilidadcitaRoute.delete('/:cve', DisponibilidadCitasController.eliminar);

export { disponibilidadcitaRoute }; 