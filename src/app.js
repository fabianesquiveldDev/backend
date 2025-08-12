import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import {corsMiddleware } from './middlewares/cors.js' 

import { personasRoute } from './routes/personas.routes.js'; 
import {usuariosRoute } from  './routes/usuarios.route.js';
import authRouter from './routes/auth.routes.js';
import {pacientesRoute } from  './routes/pacientes.route.js';
import {medicosRoute } from  './routes/medicos.route.js';
import {sucursalesRoute } from  './routes/sucursales.route.js';
import { pisosRoute } from './routes/pisos.route.js';
import { consultoriosRoute } from './routes/consultorios.route.js';
import { serviciosRoute } from './routes/servicios.routes.js';
import { especialidadesRoute } from './routes/especialidades.route.js';
import { ciudadesRoute } from './routes/ciudades.route.js';
import { usuariosSucursalesRoute } from './routes/usuariosSucursales.route.js';
import { situacionConyugalRoute } from './routes/sutuacionConyugal.route.js';
import { serviciosSucursalesRoute } from './routes/sucursal_servicios.route.js';
import { medicosespecialidadesRoute } from './routes/medicos_especialidades.routes.js';
import { mapsRoute } from './routes/maps.routes.js';
import { medicosConsultoriosRoute } from './routes/medicos_consultorios.route.js';
import { horarioLaboralRoute } from './routes/horarioLaboral.route.js';
import { disponibilidadcitaRoute } from './routes/disponibilidad.citas.js';
import {eventosRouter} from './routes/eventos.routes.js';
import { CitasRoute } from './routes/citas.route.js';
import { programarTareaLimpieza } from './jobs/limpiarCitas.js';
import { notificacionesRoute } from './routes/notificaciones.route.js';
import { DeviceTokensRoute } from './routes/deviceTokens.route.js';
import { recetasRoute } from './routes/recetas.route.js';
import { asignacionesRoute } from './routes/asignacionesMP.Route.js';
import { medicosPerfilRoute } from './routes/perfilMedico.routes.js';
import { reportesRoute } from './routes/reportes.route.js';
import { graficasRoute } from './routes/graficas.route.js';
import { auditoriaRoute } from './routes/auditoria.route.js';
import './jobs/recordatorioCitas.js';



const app = express();
app.disable('x-powered-by');
dotenv.config();
app.use(corsMiddleware())

// Middlewares
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl} - Body:`, req.body);
  next();
});

programarTareaLimpieza();

// Ruta corregida (falta el / antes de api)
try {
    app.use('/api/personas', personasRoute);
    app.use('/api/usuarios', usuariosRoute);
    app.use('/api/auth', authRouter);
    app.use('/api/pacientes', pacientesRoute);
    app.use('/api/medicos', medicosRoute);
    app.use('/api/sucursales', sucursalesRoute);
    app.use('/api/pisos', pisosRoute);
    app.use('/api/consultorios', consultoriosRoute);
    app.use('/api/servicios', serviciosRoute);
    app.use('/api/especialidades', especialidadesRoute);
    app.use('/api/medicosEspecialidades', medicosespecialidadesRoute);
    app.use('/api/ciudades', ciudadesRoute);
    app.use('/api/usuariosSucursales',usuariosSucursalesRoute );
    app.use('/api/sutuacionconyugal',situacionConyugalRoute );
    app.use('/api/sucursalesServicios',serviciosSucursalesRoute)
    app.use('/api/maps', mapsRoute)
    app.use('/api/medicosConsultorios', medicosConsultoriosRoute);
    app.use('/api/horarioLaboral', horarioLaboralRoute);
    app.use('/api/disponibilidad',disponibilidadcitaRoute);
    app.use('/api/eventos', eventosRouter);
    app.use('/api/citas', CitasRoute);
    app.use('/api/notificaciones', notificacionesRoute);
    app.use('/api/device-tokens', DeviceTokensRoute);
    app.use('/api/recetas', recetasRoute);
    app.use('/api/asignacionMP', asignacionesRoute);
    app.use('/api/perfilMedicos', medicosPerfilRoute);
    app.use('/api/reportes', reportesRoute);
    app.use('/api/graficas', graficasRoute);
    app.use('/api/auditoria', auditoriaRoute);
    } catch (err) {
    console.error("ðŸ”¥ Error al cargar rutas:", err);
    }


// Health check endpoint para Docker
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Endpoint raíz
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'MediCitas Backend API',
        version: '1.0.0',
        status: 'running'
    });
});
export default app;
