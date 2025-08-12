import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import validator from 'validator';

// Ruta compatible con ES Modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CREDENTIALS_PATH = path.join(__dirname, './credenciales/google-calendar-creds.json');

let calendar = null;
let auth = null;

// Inicializar servicio
async function inicializarServicio() {
  try {
    // Verificar que el archivo existe
    console.log('🔍 Buscando credenciales en:', CREDENTIALS_PATH);
    
    await fs.access(CREDENTIALS_PATH);
    console.log('✅ Archivo de credenciales encontrado');

    // Leer y cargar credenciales
    const raw = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(raw);

    console.log('📧 Client email:', credentials.client_email);
    console.log('🔑 Private key existe:', !!credentials.private_key);

    // Reemplazar los saltos de línea en la clave privada
    const privateKey = credentials.private_key.replace(/\\n/g, '\n');

    // Configurar autenticación con clave corregida
    const SCOPES = ['https://www.googleapis.com/auth/calendar'];
    auth = new google.auth.JWT({
      email: credentials.client_email,
      key: privateKey,
      scopes: SCOPES
    });

    // Probar autenticación
    await auth.authorize();
    console.log('✅ Autenticación con Google Calendar exitosa');

    calendar = google.calendar({ version: 'v3', auth });
    return true;

  } catch (error) {
    console.error('❌ Error inicializando Google Calendar:', error.message);
    return false;
  }
}

// Probar autenticación
export async function probarAutenticacion() {
  if (!auth) {
    return await inicializarServicio();
  }
  
  try {
    await auth.authorize();
    console.log('✅ Autenticación verificada');
    return true;
  } catch (error) {
    console.error('❌ Error de autenticación:', error.message);
    return false;
  }
}

// Validación de evento
function validarEvento({ summary, description, start, end, attendees }) {
  if (!summary || summary.trim() === '') {
    throw new Error('Summary es requerido');
  }

  if (!start || !end) {
    throw new Error('Fechas de inicio y fin son requeridas');
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Fechas inválidas');
  }

  if (startDate >= endDate) {
    throw new Error('La fecha de inicio debe ser anterior a la de fin');
  }

  if (attendees && Array.isArray(attendees)) {
    for (const attendee of attendees) {
      if (!attendee.email || !validator.isEmail(attendee.email)) {
        throw new Error(`Email inválido: ${attendee.email}`);
      }
    }
  }
}

// Crear evento
export async function crearEvento(eventoData) {
  try {
    // Verificar autenticación primero
    const authOk = await probarAutenticacion();
    if (!authOk) {
      throw new Error('No se pudo autenticar con Google Calendar');
    }

    // Validar datos del evento
    validarEvento(eventoData);

    const calendarId = 'medicitascentral@gmail.com'; // tu calendario central

    const evento = {
      summary: eventoData.summary,
      description: eventoData.description,
      start: { 
        dateTime: eventoData.start, 
        timeZone: 'America/Mexico_City' 
      },
      end: { 
        dateTime: eventoData.end, 
        timeZone: 'America/Mexico_City' 
      },
      // NO incluir attendees para evitar el error de Domain-Wide Delegation
      // attendees: eventoData.attendees || [],
      location: eventoData.location || '',
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      guestsCanSeeOtherGuests: false,
    };

    console.log('📅 Creando evento en Google Calendar...');
    
    const respuesta = await calendar.events.insert({
      calendarId,
      resource: evento,
      // NO enviar invitaciones automáticas
      sendUpdates: 'none',
    });

    console.log('✅ Evento creado exitosamente:', respuesta.data.id);
    return respuesta.data;

  } catch (error) {
    console.error('❌ Error creando evento:', error.message);
    throw error;
  }
}

// Listar eventos próximos
export async function listarEventos(proximoDias = 30) {
  try {
    const authOk = await probarAutenticacion();
    if (!authOk) {
      throw new Error('No se pudo autenticar con Google Calendar');
    }

    const calendarId = 'medicitascentral@gmail.com';
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + proximoDias);

    const respuesta = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return respuesta.data.items;
  } catch (error) {
    console.error('❌ Error listando eventos:', error.message);
    throw error;
  }
}

// Eliminar evento
export async function eliminarEvento(eventId) {
  try {
    const authOk = await probarAutenticacion();
    if (!authOk) {
      throw new Error('No se pudo autenticar con Google Calendar');
    }

    const calendarId = 'medicitascentral@gmail.com';
    
    await calendar.events.delete({
      calendarId,
      eventId,
    });

    console.log('✅ Evento eliminado:', eventId);
  } catch (error) {
    console.error('❌ Error eliminando evento:', error.message);
    throw error;
  }
}

// Obtener estado de invitados
export async function obtenerEstadoInvitados(eventId) {
  try {
    const authOk = await probarAutenticacion();
    if (!authOk) {
      throw new Error('No se pudo autenticar con Google Calendar');
    }

    const calendarId = 'medicitascentral@gmail.com';
    
    const res = await calendar.events.get({
      calendarId,
      eventId,
    });

    return res.data.attendees?.map(a => ({
      email: a.email,
      respuesta: a.responseStatus,
    })) || [];
  } catch (error) {
    console.error('❌ Error obteniendo estado de invitados:', error.message);
    throw error;
  }
}

// Función de utilidad para verificar si el servicio está disponible
export async function servicioDisponible() {
  return await probarAutenticacion();
}