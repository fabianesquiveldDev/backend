    // src/utils/fechas.js

    /**
     * Calcula la hora de fin a partir de una fecha de inicio y duración en minutos.
     * @param {string} fechaInicioStr - Fecha y hora de inicio en formato ISO string.
     * @param {number} duracionMin - Duración en minutos (por defecto 30).
     * @returns {string} Fecha y hora de fin en formato ISO string.
     */
    export function calcularHoraFin(fechaInicioStr, duracionMin = 30) {
    const fechaInicio = new Date(fechaInicioStr);
    return new Date(fechaInicio.getTime() + duracionMin * 60000).toISOString();
    }

    /**
     * Formatea una fecha ISO string a formato legible dd/mm/yyyy hh:mm.
     * @param {string} fechaISO - Fecha en formato ISO string.
     * @returns {string} Fecha formateada.
     */
    export function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    const hora = fecha.getHours().toString().padStart(2, '0');
    const min = fecha.getMinutes().toString().padStart(2, '0');

    return `${dia}/${mes}/${año} ${hora}:${min}`;
    }

    /**
     * Verifica si una fecha es válida y mayor a la fecha actual.
     * @param {string} fechaISO - Fecha en formato ISO string.
     * @returns {boolean} True si es válida y futura, false si no.
     */
    export function esFechaValidaYFutura(fechaISO) {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    return !isNaN(fecha) && fecha > ahora;
    }
