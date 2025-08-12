import { z } from 'zod';

const pisosSchemas = z.object ({
    cve_sucursales : z.number().int(),
    nombre : z.string({
    invalid_type_error: 'El nombre debe ser una cadena de texto (string).',
    required_error: 'El nombre es requerida.'
    })
    .max(20),
    numero: z.number().int().min(0)
})



export function validarPisos(object) {
    return pisosSchemas.safeParse(object);
}

export function validarPartialPisos(object) {
    return pisosSchemas.partial().safeParse(object);
}