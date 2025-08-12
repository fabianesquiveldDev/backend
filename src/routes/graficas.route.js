
import { Router } from "express";
import { graficasController } from "../controller/graficas.controller.js";
const graficasRoute = Router();



graficasRoute.get('/uno', graficasController.getUno);
graficasRoute.get('/dos', graficasController.getDos);
graficasRoute.get('/tres', graficasController.getTres);
graficasRoute.get('/cuatro', graficasController.getCuatro);

// Nuevas rutas para gráficas por sucursal
graficasRoute.get('/sucursal/:cve/uno', graficasController.getSucursalUno);
graficasRoute.get('/sucursal/:cve/dos', graficasController.getSucursalDos);
graficasRoute.get('/sucursal/:cve/tres', graficasController.getSucursalTres);
graficasRoute.get('/sucursal/:cve/cuatro', graficasController.getSucursalCuatro);



export { graficasRoute };  