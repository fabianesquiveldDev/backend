import { z } from 'zod';

const perfilMedicosSchemas = z.object({
     cve_perfil_medico: z.number().int({ message: 'La clave de perfil debe ser un número entero.' }).optional(), // SERIAL es opcional en la inserción
    cve_pacientes: z.number().int({ message: 'La clave del paciente debe ser un número entero.' }),

    // Información médica básica
    tipo_sangre: z.string().max(5, { message: 'El tipo de sangre no debe exceder los 5 caracteres.' }).nullable().optional(),
    peso: z.number().max(999.99, { message: 'El peso no debe exceder de 999.99 kg.' }).nullable().optional(),
    altura: z.number().max(9.99, { message: 'La altura no debe exceder de 9.99 metros.' }).nullable().optional(),
    imc: z.number().optional(), // Es un campo generado, se puede omitir en la validación de entrada
    presion_arterial_sistolica: z.number().int({ message: 'La presión sistólica debe ser un número entero.' }).nullable().optional(),
    presion_arterial_diastolica: z.number().int({ message: 'La presión diastólica debe ser un número entero.' }).nullable().optional(),

    // Alergias
    alergias_medicamentos: z.string().nullable().optional(),
    alergias_alimentos: z.string().nullable().optional(),
    alergias_otras: z.string().nullable().optional(),

    // Condiciones médicas actuales
    enfermedades_cronicas: z.string().nullable().optional(),
    condiciones_especiales: z.string().nullable().optional(),

    // Medicación actual
    medicamentos_actuales: z.string().nullable().optional(),

    // Antecedentes médicos
    cirugias_previas: z.string().nullable().optional(),
    hospitalizaciones_recientes: z.string().nullable().optional(),
    antecedentes_familiares: z.string().nullable().optional(),

    // Información para el sistema de citas
    motivo_consulta_frecuente: z.string().max(200, { message: 'El motivo no debe exceder los 200 caracteres.' }).nullable().optional(),
    especialista_habitual: z.string().max(100, { message: 'El nombre del especialista no debe exceder los 100 caracteres.' }).nullable().optional(),
    restricciones_especiales: z.string().nullable().optional(),
    preferencias_horario: z.string().max(100, { message: 'Las preferencias no deben exceder los 100 caracteres.' }).nullable().optional(),

    // Información de emergencia
    contacto_emergencia: z.string().max(100, { message: 'El contacto de emergencia no debe exceder los 100 caracteres.' }).nullable().optional(),
    telefono_emergencia: z.string().max(20, { message: 'El teléfono de emergencia no debe exceder los 20 caracteres.' }).nullable().optional(),
    condiciones_criticas: z.string().nullable().optional(),

    // Notas adicionales
    notas_especiales: z.string().nullable().optional(),
    observaciones_personal_medico: z.string().nullable().optional(),

    // Campos de auditoría
    fecha_creacion: z.string().datetime({ message: 'La fecha de creación debe ser un datetime ISO 8601.' }).optional(),
    fecha_ultima_actualizacion: z.string().datetime({ message: 'La fecha de actualización debe ser un datetime ISO 8601.' }).optional(),
    creado_por: z.string().max(50, { message: 'El campo "creado_por" no debe exceder los 50 caracteres.' }).optional(),
    actualizado_por: z.string().max(50, { message: 'El campo "actualizado_por" no debe exceder los 50 caracteres.' }).optional()
});

export function validarPerfilMedico(object) {
    return perfilMedicosSchemas.safeParse(object);
}

export function validarPartialPerfilMedico(object) {
    return perfilMedicosSchemas.partial().safeParse(object);
}