import { z } from 'zod';

const disponibilidadcitasSchemas = z.object({
    cve_medico_consultorio: z.number().int().positive(),
    fecha_hora_inicio: z
    .string()
    .refine(val => !isNaN(Date.parse(val)), { message: 'fecha inválida' })
    .transform(val => new Date(val)),
    duracion_minutos: z.number().int().positive().min(1),
    ocupado: z.boolean(),
    cancelado: z.boolean(),
    nota: z.string().max(500).optional(),
    motivoconsulta: z.string().optional()
});


export { disponibilidadcitasSchemas };



export function validarDisponibilidadCitas(object) {
    return disponibilidadcitasSchemas.safeParse(object);
}

export function validarPartialDisponibilidadCitas(object) {
    return disponibilidadcitasSchemas.partial().safeParse(object);
}