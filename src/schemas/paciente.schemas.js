import { z } from 'zod';

const pacientesSchemas = z.object ({
    cve_pacientes : z.number().int(),
    fecha_ingreso : z.string({
    invalid_type_error: 'La fecha de ingreso debe ser una cadena de texto.',
    required_error: 'La fecha de ingreso es requerida.'
    })
    .datetime({ message: 'El formato de la fecha de ingreso es inválido (debe ser ISO 8601, ej. "YYYY-MM-DDTHH:mm:ssZ").' })
    .refine((dateString) => {
        const fechaIngreso = new Date(dateString);
        const hoy = new Date(); // Fecha actual: viernes, 21 de junio de 2025

        // Asegura que la fecha de ingreso no sea en el futuro
        return fechaIngreso <= hoy;
    }, { message: 'La fecha de ingreso no puede ser en el futuro.' }),
    activo: z.number({
        invalid_type_error: 'El activo debe ser un número (0 o 1).',
        required_error: 'El activo es un campo requerido.'
    })
    .int("El activo debe ser un número entero.") 
    .refine(val => val === 0 || val === 1, { 
        message: "El activo debe ser 0 (desactivado) o 1 (activado)."
    })
})



export function validarPacientes(object) {
    return pacientesSchemas.safeParse(object);
}

export function validarPartialPacientes(object) {
    return pacientesSchemas.partial().safeParse(object);
}