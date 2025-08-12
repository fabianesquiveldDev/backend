import { UsuariosSucursalesModel } from '../models/usuariosSucursales.model.js';
import { validarUsuariosSucursales,validarPartialUsuariosSucursales } from '../schemas/usuariosSucursales.schemas.js';
export class UsuariosSucursalesController {
    
        static async crear(req, res) {
            try {
                const result = validarUsuariosSucursales(req.body);
                if (!result.success) {
                    return res.status(400).json({ 
                        error: 'Datos inválidos',
                        details: JSON.parse(result.error.message) 
                    });
                }

                const nuevaUsuariosSucursales = await UsuariosSucursalesModel.crear({ input: result.data })
                return res.status(201).json({
                    success: true,
                    data: nuevaUsuariosSucursales
            });

            } catch (error) {
                console.error('Error UsuariosController.crear:', error)

                if (error.code === '23505') {
                return res.status(409).json({
                    error: 'Registro duplicado',
                    message: 'El nombre de usuario ya está en uso.'
                });
                }

                
                return res.status(500).json({
                    error: 'Error interno del servidor',
                    message: error.message
                });
            }
            
        }


            static async update(req, res) {
                    try {
                        console.log('req.params:', req.params);
                        console.log('req.body:', req.body);
                        
                        const result = validarPartialUsuariosSucursales(req.body);
            
                        if (!result.success) {
                            return res.status(400).json({ 
                                error: 'Datos de validación incorrectos',
                                details: result.error.errors 
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

                        const updatedUsuarios = await UsuariosSucursalesModel.update({ 
                            cve: Number(cve), // Convertir a número
                            input: result.data 
                        });
            
                        if (!updatedUsuarios) {
                            return res.status(404).json({ 
                                error: 'usuarios_sucursales no encontrada',
                                message: `No existe una usuarios_sucursales con CVE: ${cve}`
                            });
                        }
            
                        return res.json({
                            success: true,
                            message: 'usuarios_sucursales actualizada correctamente',
                            data: updatedUsuarios
                        });
            
                    } catch (error) {
                        console.error('Error en usuarios_sucursalesController.update:', error);
                        return res.status(500).json({
                            error: 'Error interno del servidor',
                            message: error.message
                        });
                    }
                }
        
    }

