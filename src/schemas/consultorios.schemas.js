import { z } from 'zod';

const consultoriosSchemas = z.object ({
    cve_sucursales : z.number().int(),
    cve_pisos : z.number().int(),
    nombre : z.string({
    invalid_type_error: 'El nombre debe ser una cadena de texto (string).',
    required_error: 'El nombre es requerida.'
    })
    .max(30),
    numero: z.number().int().min(1),
    activo: z.number({
        invalid_type_error: 'El activo debe ser un número (0 o 1).',
        required_error: 'El activo es un campo requerido.'
    })
    .int("El activo debe ser un número entero.") 
    .refine(val => val === 0 || val === 1, { 
        message: "El activo debe ser 0 (desactivado) o 1 (activado)."
    })
})



export function validarConsultorios(object) {
    return consultoriosSchemas.safeParse(object);
}

export function validarPartialConsultorios(object) {
    return consultoriosSchemas.partial().safeParse(object);
}