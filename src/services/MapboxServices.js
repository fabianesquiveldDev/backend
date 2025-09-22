import axios from 'axios';

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

// ✅ NO HACER CRASH - Solo warning
if (!MAPBOX_TOKEN) {
    console.warn('⚠️ MAPBOX_TOKEN no definido - funcionalidades de mapa deshabilitadas');
}

export async function obtenerCoordenadas(direccion) {
    if (!MAPBOX_TOKEN) {
        console.warn('Mapbox no configurado, retornando null');
        return null;
    }
    
    try {
        const encodedAddress = encodeURIComponent(direccion);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}`;

        const response = await axios.get(url);

        console.log(`Respuesta de Mapbox para ${direccion}:`);
        console.dir(response.data, { depth: null });

        if (
            response.data &&
            response.data.features &&
            response.data.features.length > 0
        ) {
            // Mapbox regresa coordenadas en formato [lng, lat]
            const [lng, lat] = response.data.features[0].center;
            return { latitud: lat, longitud: lng };
        } else {
            console.error('Mapbox API error: No se encontraron resultados');
            return null;
        }
    } catch (error) {
        console.error('Error en obtenerCoordenadas:', error);
        return null;
    }
}

export async function obtenerDireccionInversa(latitud, longitud) {
    if (!MAPBOX_TOKEN) {
        console.warn('Mapbox no configurado, retornando null');
        return null;
    }
    
    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitud},${latitud}.json?access_token=${MAPBOX_TOKEN}&language=es`;
        const response = await axios.get(url);
        const feature = response.data.features?.[0];

        if (!feature) return null;

        const context = feature.context || [];

        const ciudad = context.find(c => c.id.includes('place'))?.text || null;
        const estado = context.find(c => c.id.includes('region'))?.text || null;
        const pais = context.find(c => c.id.includes('country'))?.text || null;
        const codigo_postal = context.find(c => c.id.includes('postcode'))?.text || null;

        return {
            direccion_completa: feature.place_name,
            ciudad,
            estado,
            pais,
            codigo_postal,
            latitud: parseFloat(latitud),
            longitud: parseFloat(longitud)
        };
    } catch (error) {
        console.error('Error en obtenerDireccionInversa:', error);
        return null;
    }
}