import { z } from 'zod';

const especialidadesSchemas = z.object ({
    nombre : z.string({
    invalid_type_error: 'El nombre debe ser una cadena de texto (string).',
    required_error: 'El nombre es requerida.'
    })
    .max(30)
})



export function validarEspecialidades(object) {
    return especialidadesSchemas.safeParse(object);
}

export function validarPartialEspecialidades(object) {
    return especialidadesSchemas.partial().safeParse(object);
}