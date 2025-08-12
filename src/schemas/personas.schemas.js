import { z } from 'zod';

const personaSchemas = z.object({
  cve_situacion_conyugal: z.preprocess(
    val => (typeof val === 'string' ? Number(val) : val),
    z.number().int()
  ),

  nombre: z.string({
    invalid_type_error: 'El nombre no es un string',
    required_error: 'Se requiere un nombre',
  }),

  paterno: z.string({
    invalid_type_error: 'El apellido paterno no es un string',
    required_error: 'Se requiere un apellido paterno',
  }),

  materno: z.string({
    invalid_type_error: 'El apellido materno no es un string',
    required_error: 'Se requiere un apellido materno',
  }),

  curp: z.string({
    invalid_type_error: 'La CURP debe ser una cadena de texto (string).',
    required_error: 'Se requiere la CURP.',
  })
    .length(18, { message: 'La CURP debe tener exactamente 18 caracteres.' })
    .regex(/^[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/, {
      message: 'El formato de la CURP es inválido.',
    }),

  direccion: z.string({
    invalid_type_error: 'La dirección debe ser una cadena de texto.',
    required_error: 'Se requiere la dirección.',
  })
    .min(10, { message: 'La dirección es demasiado corta (mínimo 10 caracteres).' })
    .max(250, { message: 'La dirección es demasiado larga (máximo 250 caracteres).' }),

  rfc: z.string({
    invalid_type_error: 'El RFC debe ser una cadena de texto (string).',
    required_error: 'Se requiere el RFC.',
  })
    .min(12, { message: 'El RFC debe tener al menos 12 caracteres.' })
    .max(13, { message: 'El RFC no debe exceder los 13 caracteres.' })
    .regex(/^([A-ZÑ&]{3,4})?(\d{6})([A-Z0-9]{3})?$/, {
      message: 'El formato del RFC es inválido.',
    }).optional(),

  telefonos: z.string({
    invalid_type_error: 'El teléfono debe ser una cadena de texto.',
    required_error: 'El teléfono es un campo requerido.',
  })
    .trim()
    .min(10, { message: 'El teléfono debe tener al menos 10 dígitos.' })
    .max(20, { message: 'El teléfono no debe exceder los 20 caracteres.' })
    .regex(/^\+?\d{10,19}$/, {
      message: 'El formato del teléfono es inválido. Solo se permiten dígitos y opcionalmente un "+" al inicio.',
    }),

  fecha_nacimiento: z.preprocess(
  val => (typeof val === 'string' ? val : undefined),
  z.string({
    invalid_type_error: 'La fecha de nacimiento debe ser una cadena de texto.',
    required_error: 'La fecha de nacimiento es requerida.',
  }).refine(dateString => {
    // Acepta "YYYY-MM-DD" como válido
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const fechaNacimiento = new Date(dateString);
    const hoy = new Date();

    if (isNaN(fechaNacimiento.getTime())) return false;
    if (fechaNacimiento > hoy) return false;

    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mesActual = hoy.getMonth();
    const diaActual = hoy.getDate();
    const mesNacimiento = fechaNacimiento.getMonth();
    const diaNacimiento = fechaNacimiento.getDate();

    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
      edad--;
    }

    return edad >= 18 && edad <= 120;
  }, { message: 'La persona debe tener entre 18 y 120 años y usar el formato YYYY-MM-DD.' })
),

sexo: z.preprocess(val => {
  // Acepta booleanos
  if (typeof val === 'boolean') return val ? 1 : 0;
  // Acepta strings (como '0', '1')
  if (typeof val === 'string') return Number(val);
  // Deja pasar números como están
  return val;
},
z.number({
  invalid_type_error: 'El sexo debe ser un número (0 o 1).',
  required_error: 'El sexo es un campo requerido.',
})
  .int()
  .refine(val => val === 0 || val === 1, {
    message: 'El sexo debe ser 0 (Femenino) o 1 (Masculino).',
})),
  email: z.string({
    invalid_type_error: 'El email debe ser una cadena de texto.',
    required_error: 'El email es requerido.',
  })
    .trim()
    .email({ message: 'El formato del email es inválido.' })
    .min(5, { message: 'El email es demasiado corto.' })
    .max(255, { message: 'El email es demasiado largo.' }),
});

// Validación normal
export function validarPersona(object) {
  return personaSchemas.safeParse(object);
}

// Validación parcial (para updates parciales)
export function validarPartialPersona(object) {
  return personaSchemas.partial().safeParse(object);
}
