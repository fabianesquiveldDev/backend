import { z } from 'zod';

const usuariosSucursalesSchemas = z.object ({
    cve_usuarios : z.number().int(),
    cve_sucursales : z.number().int(),
    
    active: z.union([z.boolean(), z.number()])
    .transform((val) => {
        if (typeof val === 'boolean') {
            return val ? 1 : 0;
        }
        return val;
    })
    .refine(val => val === 0 || val === 1, { 
        message: "El activo debe ser 0 (desactivado) o 1 (activado)."
    })
})

export function validarUsuariosSucursales(object) {
    return usuariosSucursalesSchemas.safeParse(object);
}

export function validarPartialUsuariosSucursales(object) {
    return usuariosSucursalesSchemas.partial().safeParse(object);
}