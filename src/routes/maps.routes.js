    import { Router } from 'express';
    import { obtenerCoordenadas,obtenerDireccionInversa } from '../services/MapboxServices.js';

    const mapsRoute = Router();

    mapsRoute.get('/coordenadas', async (req, res) => {
    const direccion = req.query.direccion;
    if (!direccion) return res.status(400).json({ error: 'Dirección requerida' });

    try {
        const coords = await obtenerCoordenadas(direccion);
        if (!coords) {
        console.error('No se pudieron obtener coordenadas para:', direccion);
        return res.status(500).json({ error: 'No se pudieron obtener coordenadas' });
        }
        res.json(coords);
    } catch (error) {
        console.error('Error en /coordenadas:', error);
        res.status(500).json({ error: 'Error al obtener coordenadas' });
    }
    });

    mapsRoute.get('/direccion-inversa', async (req, res) => {
    let { latitud, longitud } = req.query;

    console.log('Query params recibidos:', req.query);

    if (!latitud || !longitud) {
        return res.status(400).json({ error: 'Latitud y longitud son requeridas' });
    }

    latitud = parseFloat(latitud);
    longitud = parseFloat(longitud);

    if (isNaN(latitud) || isNaN(longitud)) {
        return res.status(400).json({ error: 'Latitud y longitud deben ser números válidos' });
    }

    try {
        const resultado = await obtenerDireccionInversa(latitud, longitud);

        if (!resultado) {
            return res.status(500).json({ error: 'No se pudo obtener la dirección' });
        }

        console.log('Respuesta JSON que se enviará:', resultado); // <--- Aquí imprimes el JSON

        res.json(resultado);
    } catch (error) {
        console.error('Error en /direccion-inversa:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});



    

    export { mapsRoute };
