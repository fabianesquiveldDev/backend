// ❌ Remover estas líneas para Railway
// import { config } from "dotenv";
// config();

// ✅ Solo cargar dotenv en desarrollo local
if (process.env.NODE_ENV !== 'production' && !process.env.RAILWAY_ENVIRONMENT) {
  try {
    const { config } = await import('dotenv');
    config();
  } catch (e) {
    // dotenv no está disponible en producción, ignorar
  }
}

import { Resend } from 'resend';

// 🔍 DEBUG: Verificar la API key
console.log('🔑 RESEND_API_KEY existe:', process.env.RESEND_API_KEY ? 'SÍ' : 'NO');
console.log('🔑 RESEND_API_KEY empieza con re_:', process.env.RESEND_API_KEY?.startsWith('re_'));

if (!process.env.RESEND_API_KEY) {
    throw new Error('❌ RESEND_API_KEY no está definida en las variables de entorno');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const enviarCorreo = async ({ para, asunto, textoPlano, html, attachments = [] }) => {
    try {
        // 🔍 DEBUG: Verificar qué estamos recibiendo
        console.log('🔍 DEBUG CORREO:');
        console.log('   para (tipo):', typeof para);
        console.log('   para (valor):', JSON.stringify(para));
        console.log('   para (length):', para?.length);
        console.log('   para (trim):', para?.trim ? para.trim() : 'No tiene trim()');
        
        // 🧹 LIMPIAR EMAIL: quitar espacios y caracteres raros
        let emailLimpio = para;
        if (typeof para === 'string') {
            emailLimpio = para.trim();
        }
        
        // 🔍 Verificar que sea un email válido
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailLimpio)) {
            throw new Error(`Email inválido: "${emailLimpio}"`);
        }
        
        console.log('   📧 Email limpio:', emailLimpio);

        const emailData = {
            from: 'MediCitas <citas@medicitas.site>',
            to: emailLimpio, // ✅ Usar email limpio
            subject: asunto,
            text: textoPlano,
            html: html,
        };

        // Solo agregar attachments si existen
        if (attachments && attachments.length > 0) {
            emailData.attachments = attachments;
            console.log(`   📎 Adjuntos: ${attachments.length}`);
        }

        // 🔍 DEBUG: Mostrar el objeto final que se enviará
        console.log('📤 OBJETO FINAL PARA RESEND:');
        console.log('   from:', emailData.from);
        console.log('   to:', emailData.to);
        console.log('   subject:', emailData.subject);
        console.log('   attachments:', emailData.attachments ? emailData.attachments.length : 0);

        const { data, error } = await resend.emails.send(emailData);

        if (error) {
            console.error('❌ Error completo de Resend:', JSON.stringify(error, null, 2));
            throw new Error(error.message);
        }

        console.log(`✅ Correo enviado con éxito a ${emailLimpio}. ID: ${data.id}`);
        return data;
    } catch (error) {
        console.error("❌ Error al enviar correo:", error.message);
        console.error("❌ Stack:", error.stack);
        throw error;
    }
};