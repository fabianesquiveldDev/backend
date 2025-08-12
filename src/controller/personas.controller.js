import { PersonaModel } from '../models/personas.model.js';
import { validarPartialPersona, validarPersona } from '../schemas/personas.schemas.js';
import { uploadToS3,deleteImageByUrl,getSignedUrlFromS3,extractS3KeyFromUrl  } from '../services/s3Services.js'; 
import { v4 as uuidv4 } from 'uuid';

export class PersonasController {

static async crear(req, res) {
    try {
        const result = validarPersona(req.body);

        if (!result.success) {
            return res.status(400).json({ 
                error: 'Datos inválidos',
                details: JSON.parse(result.error.message) 
            });
        }

        const personaData = { ...result.data };
        const bucketName = process.env.AWS_S3_BUCKET;

        if (req.file) {
            const fileName = `perfil/${uuidv4()}-${req.file.originalname}`;
            const fotoUrl = await uploadToS3(
                bucketName,
                fileName,
                req.file.buffer,
                req.file.mimetype
            );
            personaData.fotografia = fotoUrl;
        }

        const nuevaPersona = await PersonaModel.crear({ input: personaData });

        return res.status(201).json({
            success: true,
            data: nuevaPersona
        });

    } catch (error) {
        console.error('Error en PersonasController.crear:', error);

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Registro duplicado',
                message: 'La persona ya existe en el sistema'
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
            console.log('req.params:', req.params); // Debug
            const { cve } = req.params;
            console.log('CVE extraído:', cve); // Debug
            
            if (!cve || isNaN(Number(cve))) {
                console.log('CVE inválido:', cve); // Debug
                return res.status(400).json({
                    error: 'ID inválido',
                    message: 'El identificador debe ser un número válido'
                });
            }

            console.log('Llamando a PersonaModel.getOne con:', { cve }); // Debug
            const persona = await PersonaModel.getOne({ cve });
            console.log('Resultado del modelo:', persona); // Debug
            
            if (!persona) {
                return res.status(404).json({ 
                    error: 'No encontrado',
                    message: 'Persona no encontrada' 
                });
            }

            return res.json({
                success: true,
                data: persona
            });

        } catch (error) {
            console.error('Error completo en PersonasController.getOne:', error);
            console.error('Stack trace:', error.stack); // Más detalles del error
            
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
        console.log('Archivo recibido:', req.file?.originalname);

        // Validar los datos parciales recibidos en req.body
        const result = validarPartialPersona(req.body);
        if (!result.success) {
            return res.status(400).json({ 
                error: 'Datos de validación incorrectos',
                details: result.error.errors
            });
        }

        const { cve } = req.params;
        if (!cve || isNaN(Number(cve))) {
            return res.status(400).json({
                error: 'CVE inválido',
                message: 'El CVE debe ser un número válido'
            });
        }

        // Datos validados listos para actualizar
        const updateData = { ...result.data };

        // 🔥 NUEVA LÓGICA: Si hay archivo, obtener imagen anterior y eliminarla
        if (req.file) {
            try {
                // 1. Obtener la imagen actual antes de actualizar
                const currentImage = await PersonaModel.getCurrentImage(Number(cve));
                console.log('Imagen actual encontrada:', currentImage);

                // 2. Subir nueva imagen a S3
                const bucketName = process.env.AWS_S3_BUCKET;
                const fileName = `perfil/${uuidv4()}-${req.file.originalname}`;
                const fotoUrl = await uploadToS3(
                    bucketName,
                    fileName,
                    req.file.buffer,
                    req.file.mimetype
                );
                
                console.log('Nueva imagen subida:', fotoUrl);
                updateData.fotografia = fotoUrl;

                // 3. Eliminar imagen anterior (si existe)
                if (currentImage) {
                    console.log('Eliminando imagen anterior...');
                    await deleteImageByUrl(currentImage);
                    console.log('✅ Imagen anterior eliminada exitosamente');
                } else {
                    console.log('No había imagen anterior para eliminar');
                }

            } catch (imageError) {
                console.error('Error manejando imágenes:', imageError);
                // Continuar con la actualización aunque falle la eliminación
                // La nueva imagen ya se subió exitosamente
            }
        }

        // Actualizar persona en base de datos
        const updatedPersona = await PersonaModel.update({ 
            cve: Number(cve),
            input: updateData
        });

        if (!updatedPersona) {
            return res.status(404).json({ 
                error: 'Persona no encontrada',
                message: `No existe una persona con CVE: ${cve}`
            });
        }

        return res.json({
            success: true,
            message: 'Persona actualizada correctamente',
            data: updatedPersona
        });

    } catch (error) {
        console.error('Error en PersonasController.update:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
}

static async getImagenFirmada(req, res) {
    try {
        const { cve } = req.params;

        if (!cve || isNaN(Number(cve))) {
            return res.status(400).json({
                error: 'CVE inválido',
                message: 'El CVE debe ser un número válido'
            });
        }

        // Obtener solo la URL de la foto de esa persona
        const persona = await PersonaModel.getOne({ cve: Number(cve) });

        if (!persona) {
            return res.status(404).json({
                error: 'Persona no encontrada'
            });
        }

        const fotoUrl = persona.fotografia;

        if (!fotoUrl) {
            return res.status(404).json({
                error: 'Esta persona no tiene imagen'
            });
        }

        const key = extractS3KeyFromUrl(fotoUrl);
        const bucket = process.env.AWS_S3_BUCKET;

        const signedUrl = await getSignedUrlFromS3(bucket, key, 60 * 5); // 5 min por defecto

        return res.json({ url: signedUrl });

    } catch (error) {
        console.error('❌ Error al obtener imagen firmada:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
}

static async checkCurp(req, res) {
    try {
        console.log('req.params:', req.params); // Debug
        const { curp } = req.params;
        console.log('CURP extraído:', curp); // Debug
        
        if (!curp || curp.trim() === '') {
            console.log('CURP inválido:', curp); // Debug
            return res.status(400).json({
                error: 'CURP inválido',
                message: 'El CURP es requerido'
            });
        }

        console.log('Llamando a PersonaModel.checkCurp con:', { curp }); // Debug
        const exists = await PersonaModel.checkCurp({ curp });
        console.log('Resultado del modelo (CURP exists):', exists); // Debug
        
        return res.json({
            success: true,
            exists: exists
        });

    } catch (error) {
        console.error('Error completo en PersonasController.checkCurp:', error);
        console.error('Stack trace:', error.stack);
        
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
}

static async checkRfc(req, res) {
    try {
        console.log('req.params:', req.params); // Debug
        const { rfc } = req.params;
        console.log('RFC extraído:', rfc); // Debug
        
        if (!rfc || rfc.trim() === '') {
            console.log('RFC inválido:', rfc); // Debug
            return res.status(400).json({
                error: 'RFC inválido',
                message: 'El RFC es requerido'
            });
        }

        console.log('Llamando a PersonaModel.checkRfc con:', { rfc }); // Debug
        const exists = await PersonaModel.checkRfc({ rfc });
        console.log('Resultado del modelo (RFC exists):', exists); // Debug
        
        return res.json({
            success: true,
            exists: exists
        });

    } catch (error) {
        console.error('Error completo en PersonasController.checkRfc:', error);
        console.error('Stack trace:', error.stack);
        
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
}

static async checkEmail(req, res) {
    try {
        console.log('req.params:', req.params); // Debug
        const { email } = req.params;
        console.log('Email extraído:', email); // Debug
        
        if (!email || email.trim() === '') {
            console.log('Email inválido:', email); // Debug
            return res.status(400).json({
                error: 'Email inválido',
                message: 'El email es requerido'
            });
        }

        console.log('Llamando a PersonaModel.checkEmail con:', { email }); // Debug
        const exists = await PersonaModel.checkEmail({ email });
        console.log('Resultado del modelo (Email exists):', exists); // Debug
        
        return res.json({
            success: true,
            exists: exists
        });

    } catch (error) {
        console.error('Error completo en PersonasController.checkEmail:', error);
        console.error('Stack trace:', error.stack);
        
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
}

static async checkTelefono(req, res) {
    try {
        console.log('req.params:', req.params); // Debug
        const { telefono } = req.params;
        console.log('Teléfono extraído:', telefono); // Debug
        
        if (!telefono || telefono.trim() === '') {
            console.log('Teléfono inválido:', telefono); // Debug
            return res.status(400).json({
                error: 'Teléfono inválido',
                message: 'El teléfono es requerido'
            });
        }

        console.log('Llamando a PersonaModel.checkTelefono con:', { telefono }); // Debug
        const exists = await PersonaModel.checkTelefono({ telefono });
        console.log('Resultado del modelo (Teléfono exists):', exists); // Debug
        
        return res.json({
            success: true,
            exists: exists
        });

    } catch (error) {
        console.error('Error completo en PersonasController.checkTelefono:', error);
        console.error('Stack trace:', error.stack);
        
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
}

}