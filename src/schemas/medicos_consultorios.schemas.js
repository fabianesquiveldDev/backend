    import { z } from 'zod';

    const activoSchema = z.union([
    z.number({
        invalid_type_error: 'El activo debe ser un número (0 o 1) o un booleano (true/false).',
        required_error: 'El activo es un campo requerido.'
    })
        .int("El activo debe ser un número entero.") 
        .refine(val => val === 0 || val === 1, { 
        message: "Si es un número, el activo debe ser 0 (desactivado) o 1 (activado)."
        }),
    z.boolean({
        invalid_type_error: 'El activo debe ser un booleano (true/false) o un número (0 o 1).',
        required_error: 'El activo es un campo requerido.'
    })
    ]);

    const medicosConsultoriosSchema = z.object({
    cve_medicos: z.number().int(),
    cve_consultorios: z.number().int(),
    fecha_inicio: z.string({
        invalid_type_error: 'La fecha de ingreso debe ser una cadena de texto.',
        required_error: 'La fecha de ingreso es requerida.'
    })
        .datetime({
        message: 'El formato de la fecha de ingreso es inválido (debe ser ISO 8601, ej. "YYYY-MM-DDTHH:mm:ssZ").'
        })
        .refine((dateString) => {
        const fecha = new Date(dateString);
        const hoy = new Date();
        return fecha <= hoy;
        }, { message: 'La fecha de ingreso no puede ser en el futuro.' }),

    activo: activoSchema, // ✅ ahora el campo se llama correctamente

    fecha_fin: z.string({
        invalid_type_error: 'La fecha de ingreso debe ser una cadena de texto.',
        required_error: 'La fecha de ingreso es requerida.'
    })
        .datetime({
        message: 'El formato de la fecha de ingreso es inválido (debe ser ISO 8601, ej. "YYYY-MM-DDTHH:mm:ssZ").'
        })
        .refine((dateString) => {
        const fecha = new Date(dateString);
        const hoy = new Date();
        return fecha <= hoy;
        }, { message: 'La fecha de ingreso no puede ser en el futuro.' })
        .optional() // ✅ con paréntesis
    });

    export function validarMedicosConsultorios(object) {
    return medicosConsultoriosSchema.safeParse(object);
    }

    export function validarPartialMedicosConsultorios(object) {
    return medicosConsultoriosSchema.partial().safeParse(object);
    }
