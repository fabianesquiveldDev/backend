import { z } from 'zod';

const sucursalesSchemas = z.object ({
    cve_ciudades : z.number().int(),
    cve_estados : z.number().int(),
    nombre : z.string({
    invalid_type_error: 'El nombre debe ser una cadena de texto (string).',
    required_error: 'El nombre es requerida.'
    })
    .max(50),
    latitud: z.number().optional(),
    longitud: z.number().optional()
})



export function validarSucursales(object) {
    return sucursalesSchemas.safeParse(object);
}

export function validarPartialSucursales(object) {
    return sucursalesSchemas.partial().safeParse(object);
}