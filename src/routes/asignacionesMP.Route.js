import { Router } from "express";
const asignacionesRoute = Router();
import { AsignacionesController } from "../controller/asignacionesMP.controller.js";

// Crear o actualizar asignación (UPSERT)
asignacionesRoute.post('/', AsignacionesController.upsert);

// Obtener todas las asignaciones
asignacionesRoute.get('/', AsignacionesController.getAll);

// Obtener asignación por ID
asignacionesRoute.get('/:cve', AsignacionesController.getOne);

// Obtener asignaciones por paciente
asignacionesRoute.get('/paciente/:cvePaciente', AsignacionesController.getByPaciente);

// Obtener asignaciones por médico
asignacionesRoute.get('/medico/:cveMedico', AsignacionesController.getByMedico);

// Desactivar una asignación
asignacionesRoute.patch('/:cve/desactivar', AsignacionesController.desactivar);

export { asignacionesRoute };
