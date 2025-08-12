import { Router } from "express";
import { CitasController } from "../controller/citas.controller.js";
const CitasRoute = Router();

// ===== ORDEN CORRECTO: RUTAS ESPECÍFICAS PRIMERO =====

// 1. Rutas POST específicas
CitasRoute.post('/', CitasController.crear);

// 2. Rutas GET específicas (las más específicas primero)
CitasRoute.get('/obtenerCitaspacinetes/:cve', CitasController.getCitasPacientes);
CitasRoute.get('/obtenerCitasmedicoSucursal/:cveMedic/:cveSucursales', CitasController.getCitasMedicos);
CitasRoute.get('/contarNoShows/:cve', CitasController.contarNoShows);

// 3. Rutas PATCH específicas (ANTES de las genéricas)
CitasRoute.patch('/cancelarCITAS/:cveCita', CitasController.cancelar);
CitasRoute.patch('/cancelarMedicos/:cveCita', CitasController.cancelarMedicos); // ✅ Esta debe ir antes

// 4. Rutas genéricas AL FINAL (estas pueden interceptar cualquier cosa)
CitasRoute.get('/', CitasController.getAll);
CitasRoute.get('/:cve', CitasController.getOne);        // ⚠️ GENÉRICA - va al final
CitasRoute.patch('/:cve', CitasController.update);      // ⚠️ GENÉRICA - va al final

export { CitasRoute };