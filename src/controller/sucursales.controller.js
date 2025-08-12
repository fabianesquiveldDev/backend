import { SucursalesModel } from '../models/sucursales.model.js';
import { validarSucursales, validarPartialSucursales } from '../schemas/sucursales.schemas.js';
import { obtenerCoordenadas } from '../services/MapboxServices.js';

export class SucursalesController {
static async crear(req, res) {
    try {
        console.log('Body recibido:', req.body);  
        const result = validarSucursales(req.body);

        if (!result.success) {
            return res.status(400).json({
                error: 'Datos inválidos',
                details: JSON.parse(result.error.message)
            });
        }

        const input = result.data;

        // 🔄 Convertir lat/lng a número si vienen como string
        input.latitud = input.latitud !== undefined ? Number(input.latitud) : undefined;
        input.longitud = input.longitud !== undefined ? Number(input.longitud) : undefined;

        // 👉 Si lat/lng no vienen o son inválidos, obtener desde dirección
        if (isNaN(input.latitud) || isNaN(input.longitud)) {
            const direccionCompleta = `${input.direccion}, ${input.cve_ciudades}, ${input.cve_estados}`;
            const coordenadas = await obtenerCoordenadas(direccionCompleta);

            if (!coordenadas) {
                return res.status(400).json({
                    error: 'Ubicación inválida',
                    message: 'No se pudieron obtener las coordenadas con la dirección proporcionada.'
                });
            }

            input.latitud = coordenadas.latitud;
            input.longitud = coordenadas.longitud;
        }

        // 🔐 Guardar en base de datos
        console.log('Input recibido en modelo:', input);
        const nuevaSucursal = await SucursalesModel.crear({ input });

        return res.status(201).json({
            success: true,
            data: nuevaSucursal
        });

    } catch (error) {
        console.error('Error en SucursalesController.crear:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Registro duplicado',
                message: 'La sucursal ya existe en el sistema'
            });
        }

        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
}


    static async getOne(req, res) {
        try {
            console.log('req.params:', req.params); 
            const { cve } = req.params;
            console.log('CVE extraído:', cve); 
            
            if (!cve || isNaN(Number(cve))) {
                console.log('CVE inválido:', cve); 
                return res.status(400).json({
                    error: 'ID inválido',
                    message: 'El identificador debe ser un número válido'
                });
            }

            console.log('Llamando a SucursalesModel.getOne con:', { cve }); 
            const sucursales = await SucursalesModel.getOne({ cve });
            console.log('Resultado del modelo:', sucursales); 
            
            if (!sucursales) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'paciente no encontrado' 
                });
            }

            return res.json({
                success: true,
                data: sucursales
            });

        } catch (error) {
            console.error('Error completo en SucursalesController.getOne:', error);
            console.error('Stack trace:', error.stack); // Más detalles del error
            
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
    }

    
    }

    static async update(req, res) {
        try {
            console.log('req.params:', req.params); // Para debug
            console.log('req.body:', req.body); // Para debug
            
            const result = validarPartialSucursales(req.body);

            if (!result.success) {
                return res.status(400).json({ 
                    error: 'Datos de validación incorrectos',
                    details: result.error.errors // Mostrar errores de Zod correctamente
                });
            }

            const { cve } = req.params;
            
            // Validar que cve sea un número
            if (!cve || isNaN(Number(cve))) {
                return res.status(400).json({
                    error: 'CVE inválido',
                    message: 'El CVE debe ser un número válido'
                });
            }

            const updatedSucursales = await SucursalesModel.update({ 
                cve: Number(cve),
                input: result.data 
            });

            if (!updatedSucursales) {
                return res.status(404).json({ 
                    error: 'paciente no encontrada',
                    message: `No existe una persona con CVE: ${cve}`
                });
            }

            return res.json({
                success: true,
                message: 'sucursal actualizado correctamente',
                data: updatedSucursales
            });

        } catch (error) {
            console.error('Error en SucursalesController.update:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }

    static async getAll(req, res) { 
            try {
                const sucursales = await SucursalesModel.getAll();
                res.json(sucursales);
            } catch (error) { 
                console.error("Error en el controlador al obtener sucursales:", error);
                const errorMessage = error && typeof error === 'object' && 'message' in error
                                ? error.message
                                : "Error interno del servidor al obtener sucursales.";
                res.status(500).json({ message: errorMessage });
            }
    }

    static async getsearch(req, res) {
        console.log('🚀 LLEGÓ AL CONTROLLER');
        console.log('Query params:', req.query);
        try {
            const { name } = req.query;
            
            console.log('Parámetro recibido:', name);
            
            // Validar que el parámetro name existe y tiene al menos 2 caracteres
            if (!name || name.trim().length < 2) {
                return res.status(400).json({ 
                    message: 'El término de búsqueda debe tener al menos 2 caracteres' 
                });
            }
            
            // Obtener sucursales del modelo
            const sucursales = await SucursalesModel.getsearch({ name });
            
            console.log('Resultados encontrados:', sucursales.length);
            
            // Renderizar respuesta
            res.json({
                query: name.trim(),
                total: sucursales.length,
                results: sucursales
            });
            
        } catch (error) {
            console.error('❌ Error detallado:', error);
    res.status(500).json({ 
        message: 'Error interno del servidor',
        debug: error.message  // 👈 agrega esta línea solo para depurar
            });
        }
    }

    static async distribucion(req, res) {
            try {
                console.log('req.params:', req.params); 
                const { cve } = req.params;
                console.log('CVE extraído:', cve); 
                
                if (!cve || isNaN(Number(cve))) {
                    console.log('CVE inválido:', cve); 
                    return res.status(400).json({
                        error: 'ID inválido',
                        message: 'El identificador debe ser un número válido'
                    });
                }
    
                console.log('Llamando a sucursalModel.distribucion con:', { cve }); 
                const sucursaldistribucion = await SucursalesModel.distribucion({ cve });
                console.log('Resultado del modelo:', sucursaldistribucion); 
                
                if (!sucursaldistribucion) {
                    return res.status(404).json({ 
                        error: 'No encontrado',
                        message: 'admin no encontrado' 
                    });
                }
    
                return res.json({
                    success: true,
                    data: sucursaldistribucion
                });
    
            } catch (error) {
                console.error('Error completo en sucursalController.distribucion:', error);
                console.error('Stack trace:', error.stack); // Más detalles del error
                
                return res.status(500).json({
                    error: 'Error interno del servidor',
                    message: error.message
                });
        }
    
        
        }
}