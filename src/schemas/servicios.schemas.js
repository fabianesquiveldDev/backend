import { z } from 'zod';

const serviciosSchemas = z.object ({
    nombre : z.string({
    invalid_type_error: 'El nombre debe ser una cadena de texto (string).',
    required_error: 'El nombre es requerida.'
    })
    .max(50),
    precios: z.number({
        invalid_type_error: 'El apreciosctivo debe ser un número ',
        required_error: 'El precio es requerido'
    })
})



export function validarServicios(object) {
    return serviciosSchemas.safeParse(object);
}

export function validarPartialServicios(object) {
    return serviciosSchemas.partial().safeParse(object);
}