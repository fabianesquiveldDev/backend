import { UsuariosModel } from '../models/usuarios.model.js';
import { validarUsuarios,validarPartialUsuarios } from '../schemas/usuarios.schemas.js';
export class UsuariosController {
    
        static async crear(req, res) {
            try {
                const result = validarUsuarios(req.body);
                if (!result.success) {
                    return res.status(400).json({ 
                        error: 'Datos inválidos',
                        details: JSON.parse(result.error.message) 
                    });
                }

                const nuevoUsuario = await UsuariosModel.crear({ input: result.data })
                return res.status(201).json({
                    success: true,
                    data: nuevoUsuario
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
        
                    console.log('Llamando a UsuariosModel.getOne con:', { cve }); 
                    const usuarios = await UsuariosModel.getOne({ cve });
                    console.log('Resultado del modelo:', usuarios); 
                    
                    if (!usuarios) {
                        return res.status(404).json({ 
                            error: 'No encontrado',
                            message: 'USUARIOS no encontrada' 
                        });
                    }
        
                    return res.json({
                        success: true,
                        data: usuarios
                    });
        
                } catch (error) {
                    console.error('Error completo en UsuariosController.getOne:', error);
                    console.error('Stack trace:', error.stack);
                    
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
                        
                        const result = validarPartialUsuarios(req.body);
            
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
            
                        const updatedUsuarios = await UsuariosModel.update({ 
                            cve: Number(cve), // Convertir a número
                            input: result.data 
                        });
            
                        if (!updatedUsuarios) {
                            return res.status(404).json({ 
                                error: 'Persona no encontrada',
                                message: `No existe una persona con CVE: ${cve}`
                            });
                        }
            
                        return res.json({
                            success: true,
                            message: 'Persona actualizada correctamente',
                            data: updatedUsuarios
                        });
            
                    } catch (error) {
                        console.error('Error en UsuariosController.update:', error);
                        return res.status(500).json({
                            error: 'Error interno del servidor',
                            message: error.message
                        });
                    }
                }


                static async getAdmin(req, res) {
                    try {
                        const { cve } = req.params;
                
                        if (!cve || isNaN(Number(cve))) {
                            return res.status(400).json({
                                error: 'ID inválido',
                                message: 'El identificador debe ser un número válido'
                            });
                        }
                
                        const pisos = await UsuariosModel.getAdmin({ cve: Number(cve) });
                
                        if (!pisos || pisos.length === 0) {
                            return res.status(404).json({ 
                                error: 'No encontrado',
                                message: 'No se encontraron el usuario ' 
                            });
                        }
                
                        return res.json({
                            success: true,
                            data: pisos
                        });
                
                    } catch (error) {
                        console.error('Error en usuariosController.getUserPeroson:', error);
                        return res.status(500).json({
                            error: 'Error interno del servidor',
                            message: error.message
                        });
                    }
                }

            static async getUserPeroson(req, res) {
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
        
                    console.log('Llamando a UsuariosModel.getUserPeroson con:', { cve }); 
                    const usuarios = await UsuariosModel.getUserPeroson({ cve });
                    console.log('Resultado del modelo:', usuarios); 
                    
                    if (!usuarios) {
                        return res.status(404).json({ 
                            error: 'No encontrado',
                            message: 'USUARIOS no encontrada' 
                        });
                    }
        
                    return res.json({
                        success: true,
                        data: usuarios
                    });
        
                } catch (error) {
                    console.error('Error completo en UsuariosController.getUserPeroson:', error);
                    console.error('Stack trace:', error.stack);
                    
                    return res.status(500).json({
                        error: 'Error interno del servidor',
                        message: error.message
                    });
            }
        
            
            }

            static async getAll(req, res) { 
                        try {
                            const AllUser = await UsuariosModel.getAll();
                            res.json(AllUser);
                        } catch (error) { 
                            console.error("Error en el controlador al obtener usuarios:", error);
                            const errorMessage = error && typeof error === 'object' && 'message' in error
                                            ? error.message
                                            : "Error interno del servidor al obtener usuarios.";
                            res.status(500).json({ message: errorMessage });
                        }
                    }
            

    static async getSucursal(req, res) {
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

            console.log('Llamando a UsuariosModel.getSucursal con:', { cve }); 
            const usuariosHeader = await UsuariosModel.getSucursal({ cve });
            console.log('Resultado del modelo:', usuariosHeader); 
            
            if (!usuariosHeader) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'admin no encontrado' 
                });
            }

            return res.json({
                success: true,
                data: usuariosHeader
            });

        } catch (error) {
            console.error('Error completo en UsuariosController.getSucursal:', error);
            console.error('Stack trace:', error.stack); // Más detalles del error
            
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
    }

    
    }

    static async getSucursallocal(req, res) {
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

            console.log('Llamando a UsuariosModel.getSucursallocal con:', { cve }); 
            const usuariosHeader = await UsuariosModel.getSucursallocal({ cve });
            console.log('Resultado del modelo:', usuariosHeader); 
            
            if (!usuariosHeader) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'lista de medicos no encontrado' 
                });
            }

            return res.json({
                success: true,
                data: usuariosHeader
            });

        } catch (error) {
            console.error('Error completo en UsuariosController.getSucursallocal:', error);
            console.error('Stack trace:', error.stack); // Más detalles del error
            
            return res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
    }

    
    }

    static async checkUsername(req, res) {
    try {
        const { username } = req.params;
        if (!username || username.trim() === '') {
            return res.status(400).json({
                error: 'Username inválido',
                message: 'El nombre de usuario es requerido'
            });
        }

        const exists = await UsuariosModel.checkUsername({ username });
        return res.json({
            success: true,
            exists: exists
        });
    } catch (error) {
        console.error('Error en UsuariosController.checkUsername:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
}


        
    }

