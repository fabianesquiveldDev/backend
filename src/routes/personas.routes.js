import { Router } from "express";
import { PersonasController } from "../controller/personas.controller.js";
import { upload } from "../middlewares/upload.js";

const personasRoute = Router();

// Rutas existentes
personasRoute.post('/', upload.single('foto'), PersonasController.crear);
personasRoute.get('/:cve', PersonasController.getOne);
personasRoute.patch('/:cve', upload.single('foto'), PersonasController.update);
personasRoute.get('/imagen-firmada/:cve', PersonasController.getImagenFirmada);

// 🆕 Nuevas rutas para validación
personasRoute.get('/check-curp/:curp', PersonasController.checkCurp);
personasRoute.get('/check-rfc/:rfc', PersonasController.checkRfc);
personasRoute.get('/check-email/:email', PersonasController.checkEmail);
personasRoute.get('/check-telefono/:telefono', PersonasController.checkTelefono);

export { personasRoute };