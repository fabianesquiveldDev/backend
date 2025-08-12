
import { Router } from "express";
const medicosespecialidadesRoute = Router();
import { MedicosEspecialidadesController } from "../controller/medicos_especialidades.controller.js";

medicosespecialidadesRoute.post ('/', MedicosEspecialidadesController.crear);
medicosespecialidadesRoute.delete('/:cve_medicos/:cve_especialidad', MedicosEspecialidadesController.eliminar);
medicosespecialidadesRoute.get('/noAsiganda/:cve', MedicosEspecialidadesController.noAsignada); 
medicosespecialidadesRoute.get('/Asiganda/:cve', MedicosEspecialidadesController.Asignada);    



export { medicosespecialidadesRoute }; 