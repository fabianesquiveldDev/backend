import { Router } from "express";
const recetasRoute = Router();
import { RecetasController } from "../controller/recetas.controller.js";

// Crear nueva receta
recetasRoute.post('/', RecetasController.crear);

// Obtener todas las recetas (con filtros opcionales)
recetasRoute.get('/', RecetasController.getAll);

// 🔥 RUTAS ESPECÍFICAS PRIMERO (antes de /:cve genérico)
// Generar PDF de receta - ESTA ES LA CLAVE PARA EL PDF
recetasRoute.get('/:cve/pdf', RecetasController.generarPDF);

// Obtener recetas por cita (útil para ver si ya existe receta)
recetasRoute.get('/cita/:cveCita', RecetasController.getByCita);

// Obtener recetas por paciente (historial médico)
recetasRoute.get('/paciente/:cvePaciente', RecetasController.getByPaciente);

// Obtener recetas por médico
recetasRoute.get('/medico/:cveMedico', RecetasController.getByMedico);

// 🔥 RUTA GENÉRICA AL FINAL (captura todo lo demás)
// Obtener receta por ID
recetasRoute.get('/:cve', RecetasController.getOne);

// Actualizar receta (por si necesitas editar)
recetasRoute.patch('/:cve', RecetasController.update);

export { recetasRoute };