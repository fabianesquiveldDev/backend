import { Router } from "express";
const medicosConsultoriosRoute = Router();
import { MedicosConsultoriosController } from "../controller/medicos_consultorios.controller.js";

// Rutas generales (sin parámetros)
medicosConsultoriosRoute.post('/', MedicosConsultoriosController.crear);
medicosConsultoriosRoute.get('/', MedicosConsultoriosController.getAll);

// Rutas con prefijos específicos (deben ir antes que las genéricas)
medicosConsultoriosRoute.get('/localAdmin/:cve', MedicosConsultoriosController.getAllAdmin);  
medicosConsultoriosRoute.get('/consultorioAasignados/:cve', MedicosConsultoriosController.Asignada);
medicosConsultoriosRoute.get('/consultorioAsignadosLocal/:cveSucursal/:cveMedico', MedicosConsultoriosController.AsignadaAdmin);

// Ruta con parámetro + ruta fija (debe ir antes que la genérica)
medicosConsultoriosRoute.get('/:cve/asignar-consultorios', MedicosConsultoriosController.AsignarConsultorios);

// Rutas genéricas con parámetros (deben ir al final)
medicosConsultoriosRoute.get('/:cve', MedicosConsultoriosController.getOne);
medicosConsultoriosRoute.patch('/:cve', MedicosConsultoriosController.update);

export { medicosConsultoriosRoute };