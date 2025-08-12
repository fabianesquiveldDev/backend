import { Router } from "express";
const reportesRoute = Router();
import { ReporteController } from "../controller/reportes.controller.js";

//generar reporte para admin
reportesRoute.get('/:cve/pdf/admin', ReporteController.generarPDFAdmin);



export { reportesRoute };