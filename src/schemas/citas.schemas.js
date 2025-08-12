import e from 'express';
import { z } from 'zod';

const citasSchemas = z.object ({
    cve_medicos : z.number().int(),
    cve_pacientes : z.number().int(),
    cve_disponibilidad : z.number().int(),
    cve_medico_consultorio : z.number().int(),
    no_show : z.boolean().optional(),
    atendida : z.boolean().optional(),
    peso : z.number().optional(),
    estatura : z.number().optional(),
    temperatura : z.number().optional(),
    diagnostico : z.string().max(500).optional(),
    notas : z.string().max(500).optional(),
    presion_minima : z.number().optional(),
    presion_maxima : z.number().optional(),
    frecuencia_cardiaca : z.number().optional(),
    cancelada : z.boolean().optional(),
    motivo_cancelacion : z.string().max(500).optional(),
    fecha_hora_consulta : z.string()
    .refine(val => !isNaN(Date.parse(val)), { message: 'fecha inválida' })
    .transform(val => new Date(val)),
    es_para_familiar: z.boolean().optional(),
    nombre_familiar: z.string().max(100).optional()
})


export function validarPartialCitas(object) {
    return citasSchemas.partial().safeParse(object);
}