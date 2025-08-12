
import { Router } from "express";
import { CiudadesController } from "../controller/ciudades.controller.js";
const ciudadesRoute = Router();


ciudadesRoute.get('/', CiudadesController.getAll);


export { ciudadesRoute }; 