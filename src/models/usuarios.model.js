    // src/models/UsuarioModel.js
    import { db } from '../config/db.js';
    const { pool } = db;
    import bcrypt from 'bcryptjs';


    export class UsuariosModel {
        static async crear({ input }) {
            const {
            cve_usuarios,
            nombre_usuario,
            contrasena,
            activo,
            cve_roles // Este es el ID del rol a asignar
            } = input;

            const client = await pool.connect();

            try {
            await client.query('BEGIN'); // Inicia transacción

            const hashedPassword = await bcrypt.hash(contrasena, 10);

            // 1. Insertar usuario
            const queryUsuario = `
                INSERT INTO usuarios (
                cve_usuarios, nombre_usuario, contrasena, activo
                ) VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const valuesUsuario = [
                cve_usuarios,
                nombre_usuario,
                hashedPassword,
                activo
            ];

            const { rows: usuarioRows } = await client.query(queryUsuario, valuesUsuario);
            const nuevoUsuario = usuarioRows[0];

            // 2. Asignar rol
            const queryRol = `
                INSERT INTO roles_usuarios (
                cve_usuarios, cve_roles
                ) VALUES ($1, $2)
                RETURNING *;
            `;

            const valuesRol = [
                nuevoUsuario.cve_usuarios,
                cve_roles
            ];

            const { rows: rolRows } = await client.query(queryRol, valuesRol);
            const asignacionRol = rolRows[0];

            await client.query('COMMIT'); // Si todo va bien, se confirma

            return {
                usuario: nuevoUsuario,
                rol: asignacionRol
            };

            } catch (error) {
            await client.query('ROLLBACK'); // Si algo falla, se revierte
            console.error("Error al crear usuario y rol:", error.message);
            throw error;
            } finally {
            client.release(); // Siempre liberar el cliente
            }
        }

        static async getOne({ cve }) {
            try {
                const query = 'SELECT * FROM usuarios WHERE cve_usuarios = $1';
                const { rows } = await pool.query(query, [cve]);
                
                if (rows.length === 0) {
                    return null; 
                }
                
                return rows[0];
            } catch (err) {
                console.error('Error al obtener usuarios:', err);
                throw new Error('Error al buscar persona en la base de datos');
            }
        }

        static async update({ cve, input }) {
            try {
                const fields = Object.keys(input);
                if (fields.length === 0) {
                    throw new Error('No hay campos para actualizar');
                }

                // 🔐 Si la contraseña está en los datos, la hasheamos antes de actualizar
                if (input.contrasena) {
                    const hash = await bcrypt.hash(input.contrasena, 10);
                    input.contrasena = hash;
                }

                // 2. Construir el query UPDATE dinámicamente
                const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
                
                const query = `
                    UPDATE usuarios 
                    SET ${setClause}
                    WHERE cve_usuarios = $${fields.length + 1}
                    RETURNING *;
                `;

                const values = [...Object.values(input), Number(cve)];

                console.log('Ejecutando UPDATE:');
                console.log('Query:', query);
                console.log('Values:', values);

                const result = await pool.query(query, values);

                if (result.rowCount === 0) {
                    console.log(`No se encontró usuario con CVE: ${cve}`);
                    return null;
                }

                console.log(`Usuario con CVE ${cve} actualizado exitosamente`);
                return result.rows[0];

            } catch (error) {
                console.error('Error ejecutando UPDATE en la base de datos:', error);
                throw error;
            }
        }

        
        static async getAdmin({ cve }) {
        try {
            const query = `
                SELECT
        U.*,
                        p.nombre as nombre_persona,

        P.*,
        S.nombre AS nombresucursal,
        S.*
    FROM
        USUARIOS AS U
    JOIN
        roles_usuarios AS RU ON U.cve_usuarios = RU.cve_usuarios
    JOIN
        PERSONAS AS P ON U.cve_usuarios = P.cve_personas
    JOIN
        usuarios_sucursales AS US ON U.cve_usuarios = US.cve_usuarios
    JOIN
        SUCURSALES AS S ON US.cve_sucursales = S.cve_sucursales
    WHERE
        RU.cve_roles = $1; `;
            const { rows } = await pool.query(query, [cve]);

            if (rows.length === 0) {
                return null;
            }

            return rows; 
        } catch (err) {
            console.error('Error al obtener usuarios:', err);
            throw new Error('Error al buscar usuarios en la base de datos');
        }
        }

        
        static async getUserPeroson({ cve }) {
            try {
                const query = `
                                    SELECT
                    U.*,
                    p.nombre as nombre_persona,
                    P.*,
                    US.*,
                    S.nombre AS nombreSucursal,
                    S.*,
                    C.nombre AS nombreCiudad,
                    E.nombre AS nombreEstado,
                    CONCAT('(', C.nombre, ', ', E.nombre, ')') AS ubicacion
                FROM
                    USUARIOS AS U
                JOIN
                    roles_usuarios AS RU ON U.cve_usuarios = RU.cve_usuarios
                JOIN
                    PERSONAS AS P ON U.cve_usuarios = P.cve_personas
                JOIN
                    usuarios_sucursales AS US ON U.cve_usuarios = US.cve_usuarios
                JOIN
                    SUCURSALES AS S ON US.cve_sucursales = S.cve_sucursales
                JOIN
                    CIUDADES AS C ON S.cve_ciudades = C.cve_ciudades
                JOIN
                    ESTADOS AS E ON S.cve_estados = E.cve_estados
                WHERE
                    U.cve_usuarios = $1;

                
                
                `;
                const { rows } = await pool.query(query, [cve]);
                
                if (rows.length === 0) {
                    return null; 
                }
                
                return rows[0];
            } catch (err) {
                console.error('Error al obtener usuarios:', err);
                throw new Error('Error al buscar persona en la base de datos');
            }
        }

        
        static async getAll() { 
            try {

                const query = `
                    select 
                        U.*,
                        CONCAT(p.nombre, ' ', p.paterno, ' ', p.materno) AS nombre_completo,
                        R.nombre as role_nombre
                        from usuarios as U
                        inner join personas as p on p.cve_personas = U.cve_usuarios
                        inner join roles_usuarios as RU on RU.cve_usuarios = U.cve_usuarios
                        inner join roles as R on R.cve_roles = RU.cve_roles
                `;

                const { rows } = await pool.query(query); 
                return rows;
            } catch (error) {
                console.error("Error al obtener las usuarios de la base de datos:", error);
                throw new Error("No se pudieron obtener las usuarios.");
            }
        }
        static async getSucursal({ cve }) {
            try {
                const query = `
                    SELECT
                        s.cve_sucursales,
                        s.nombre AS nombre_sucursal
                    FROM
                        sucursales AS s
                    INNER JOIN
                        usuarios_sucursales AS us ON s.cve_sucursales = us.cve_sucursales
                    WHERE
                        us.cve_usuarios = $1
                        AND us.active = TRUE 
                    ORDER BY
                        s.nombre;
                `;
                const { rows } = await pool.query(query, [cve]);
                
                if (rows.length === 0) {    
                    return null;
                }
                
                return rows;
            } catch (err) {
                console.error('Error al obtener sucursales del médico:', err);
                throw new Error('Error al buscar sucursales del médico en la base de datos');
            }
        }


    static async getSucursallocal({ cve }) {
    try {
        const query = `
         SELECT 
    (p.nombre || ' ' || p.paterno || ' ' || p.materno) AS nombre_doctor_completo,
    m.cve_medicos AS cve_medicos,
    STRING_AGG(DISTINCT e.nombre, ', ' ORDER BY e.nombre) AS especialidades,
    p.email,
    p.telefonos,
    CASE 
        WHEN active_mc.cve_medico_consultorio IS NOT NULL THEN TRUE 
        ELSE FALSE 
    END AS esta_activo_en_esta_sucursal,
    COALESCE(active_mc.cve_medico_consultorio, last_mc.cve_medico_consultorio) AS cve_medico_consultorio
FROM medicos AS m
INNER JOIN personas AS p ON p.cve_personas = m.cve_medicos
LEFT JOIN medicos_especialidades AS me ON m.cve_medicos = me.cve_medicos
LEFT JOIN especialidades AS e ON me.cve_especialidad = e.cve_especialidad
-- JOIN para consultorio activo
LEFT JOIN LATERAL (
    SELECT mc.cve_medico_consultorio
    FROM medicos_consultorios mc
    INNER JOIN consultorios c ON mc.cve_consultorios = c.cve_consultorios
    WHERE mc.cve_medicos = m.cve_medicos
      AND c.cve_sucursales = $1
      AND mc.activo = TRUE
      AND (mc.fecha_fin IS NULL OR mc.fecha_fin >= CURRENT_DATE)
    LIMIT 1
) AS active_mc ON true
-- JOIN para último consultorio asignado (incluso inactivo)
LEFT JOIN LATERAL (
    SELECT mc.cve_medico_consultorio
    FROM medicos_consultorios mc
    INNER JOIN consultorios c ON mc.cve_consultorios = c.cve_consultorios
    WHERE mc.cve_medicos = m.cve_medicos
      AND c.cve_sucursales = $1
    ORDER BY mc.fecha_inicio DESC
    LIMIT 1
) AS last_mc ON true
WHERE EXISTS (
    SELECT 1
    FROM medicos_consultorios mc
    INNER JOIN consultorios c ON mc.cve_consultorios = c.cve_consultorios
    WHERE mc.cve_medicos = m.cve_medicos
      AND c.cve_sucursales = $1
)
GROUP BY 
    m.cve_medicos,
    p.nombre,
    p.paterno,
    p.materno,
    p.email,
    p.telefonos,
    active_mc.cve_medico_consultorio,
    last_mc.cve_medico_consultorio
ORDER BY nombre_doctor_completo;
        `;

        const { rows } = await pool.query(query, [cve]);

        // Los resultados ya vienen con el formato correcto
        return rows;

    } catch (err) {
        console.error('Error al obtener médicos de la sucursal:', err);
        throw new Error('Error al buscar médicos de la sucursal en la base de datos');
    }
    }

    static async checkUsername({ rfc }) {
    try {
        const query = 'SELECT COUNT(*) as count FROM usuarios WHERE nombre_usuario = $1';
        const result = await pool.query(query, [rfc]);
        return result.rows[0].count > 0;
    } catch (error) {
        console.error('Error en UsuariosModel.checkUsername:', error);
        throw error;
    }
}


// En tu modelo, por ejemplo pacientes.model.js o donde manejes pacientes
static async obtenerCve_usuariosAdmin(cve_citas) {
    const query = `
        SELECT DISTINCT u.cve_usuarios
        FROM citas c
            INNER JOIN medicos_consultorios mc ON c.cve_medico_consultorio = mc.cve_medico_consultorio
            INNER JOIN consultorios cons ON mc.cve_consultorios = cons.cve_consultorios
            INNER JOIN usuarios_sucursales us ON cons.cve_sucursales = us.cve_sucursales
            INNER JOIN usuarios u ON us.cve_usuarios = u.cve_usuarios
            INNER JOIN roles_usuarios ru ON u.cve_usuarios = ru.cve_usuarios
            INNER JOIN roles r ON ru.cve_roles = r.cve_roles
        WHERE 
            c.cve_citas = $1
            AND u.activo = true
            AND us.active = true
            AND r.nombre = 'Administrador'
        LIMIT 1;  -- Opcional: si solo esperas un administrador por sucursal
    `;

    try {
        const result = await pool.query(query, [cve_citas]);
        return result.rows.length > 0 ? result.rows[0].cve_usuarios : null;
    } catch (error) {
        console.error('Error obteniendo cve_usuarios del administrador:', error);
        throw error;
    }
}


// En tu modelo, por ejemplo pacientes.model.js o donde manejes pacientes
static async obtenerPlayerIdPorUsuario(cve_usuarios) {
    const query = `
        SELECT player_id
        FROM dispositivos_usuarios
        WHERE cve_usuarios = $1
        LIMIT 1;
    `;

    try {
        const result = await pool.query(query, [cve_usuarios]);
        if (result.rows.length === 0) return null;
        return result.rows[0].player_id;
    } catch (error) {
        console.error('Error obteniendo player_id:', error);
        throw error;
    }
}

    }