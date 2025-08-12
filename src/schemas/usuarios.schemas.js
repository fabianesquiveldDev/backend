import { z } from 'zod';

const usuariosSchemas = z.object ({
    cve_usuarios : z.number().int(),
    nombre_usuario : z.string({
    invalid_type_error: 'El nombre de usuario debe ser una cadena de texto.',
    required_error: 'Se requiere un nombre de usuario.'
    })
    .trim() // Elimina espacios en blanco al inicio y al final
    .min(6, { message: 'El nombre de usuario debe tener al menos 6 caracteres.' }) 
    .max(20, { message: 'El nombre de usuario tiene un máximo de 20 caracteres.' }) 
    .regex(/^[a-zA-Z0-9]+$/, { // Permite solo letras (mayúsculas/minúsculas) y números
        message: 'El nombre de usuario solo puede contener letras y números, sin espacios ni caracteres especiales.'
    }),
    contrasena : z.string({
    invalid_type_error: 'La contraseña debe ser una cadena de texto (string).',
    required_error: 'La contraseña es requerida.'
    })
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }) // Longitud mínima recomendada
    .max(20, { message: 'La contraseña no debe exceder los 20 caracteres.' }) // Longitud máxima razonable
    .regex(/[A-Z]/, { message: 'La contraseña debe contener al menos una letra mayúscula.' }) // Al menos una mayúscula
    .regex(/[a-z]/, { message: 'La contraseña debe contener al menos una letra minúscula.' }) // Al menos una minúscula
    .regex(/\d/, { message: 'La contraseña debe contener al menos un número.' }) // Al menos un número
    .regex(/[^a-zA-Z0-9]/, { message: 'La contraseña debe contener al menos un caracter especial (ej. !@#$%^&*).' }),// Al menos un caracter especial
    
    activo: z.preprocess(
        val => {
            if (typeof val === 'boolean') return val ? 1 : 0;
            if (typeof val === 'string') return Number(val); // por si llega como string "1" o "0"
            return val; // si ya es número
        },
        z.number({
            invalid_type_error: 'El activo debe ser un número (0 o 1).',
            required_error: 'El activo es un campo requerido.',
        })
            .int('El activo debe ser un número entero.')
            .refine(val => val === 0 || val === 1, {
            message: 'El activo debe ser 0 (desactivado) o 1 (activado).',
            })
        ),
    cve_roles: z.number().int()
})



export function validarUsuarios(object) {
    return usuariosSchemas.safeParse(object);
}

export function validarPartialUsuarios(object) {
    return usuariosSchemas.partial().safeParse(object);
}