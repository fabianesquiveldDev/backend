import PDFDocument from 'pdfkit';
import { ReporteModel } from '../models/reporte.model.js';

export class ReporteController {
  static async generarPDFAdmin(req, res) {
    try {
      const { cve } = req.params;

      // Obtener datos del reporte desde el modelo
      const cveSucursales = await ReporteModel.obtenercvesucursal(cve);
      console.log('✅ Generando reporte para sucursal:', cveSucursales);

      const datosReporte = await ReporteModel.generarPDFCompletoadmin(cveSucursales);

      if (!datosReporte) {
        return res.status(404).json({ message: 'No se encontró información para el reporte' });
      }

      const doc = new PDFDocument({ 
        bufferPages: true,
        margin: 50,
        size: 'A4'
      });
      const chunks = [];

      // Guardar chunks para armar buffer final
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=reporte_medicitas_${cve}_${new Date().toISOString().split('T')[0]}.pdf`);
        res.end(pdfBuffer);
      });

      // Encabezado profesional
      ReporteController.crearEncabezado(doc, cve);
      
      // Información general del reporte
      ReporteController.crearInfoGeneral(doc);
      
      // Contenido del reporte por secciones
      ReporteController.crearResumenSucursal(doc, datosReporte.resumenSucursal);
      ReporteController.crearResumenMedicos(doc, datosReporte.resumenMedicos);
      ReporteController.crearResumenMensual(doc, datosReporte.resumenMensual);
      ReporteController.crearResumenEspecialidades(doc, datosReporte.resumenEspecialidades);
      
      // Pie de página
      ReporteController.crearPiePagina(doc);

      doc.end();
    } catch (error) {
      console.error('Error generando reporte PDF:', error);
      res.status(500).json({ message: 'Error interno al generar el reporte' });
    }
  }

  static crearEncabezado(doc, cve) {
    // Fondo del encabezado
    doc.rect(0, 0, 612, 180)
       .fillAndStroke('#2E86AB', '#2E86AB');

    // Logo y título principal
    doc.fillColor('#FFFFFF')
       .fontSize(32)
       .font('Helvetica-Bold')
       .text('MEDICITAS', 50, 30);
    
    // Icono médico simulado
    doc.circle(500, 50, 25)
       .fillAndStroke('#FFFFFF', '#FFFFFF');
    
    doc.fillColor('#2E86AB')
       .fontSize(20)
       .text('+', 495, 42);
    
    doc.fillColor('#FFFFFF')
       .fontSize(14)
       .font('Helvetica')
       .text('Sistema de Gestión de Citas Médicas', 50, 70)
       .text('Reporte Administrativo Completo', 50, 90);

    // Información de la sucursal en recuadro
    doc.rect(50, 110, 500, 50)
       .fillAndStroke('#FFFFFF', '#FFFFFF');
    
    doc.fillColor('#2E86AB')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text(`SUCURSAL ${cve}`, 60, 125);
    
    doc.fillColor('#666666')
       .fontSize(12)
       .font('Helvetica')
       .text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 60, 145)
       .text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, 350, 145);

    // Asegurar espacio después del encabezado
    doc.y = 220;
  }

  static crearInfoGeneral(doc) {
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Espacio antes del cuadro
    const startY = doc.y;
    
    // Cuadro de información general con sombra
    doc.rect(52, startY + 2, 500, 80)
       .fillAndStroke('#e0e0e0', '#e0e0e0');
    
    doc.rect(50, startY, 500, 80)
       .fillAndStroke('#f8f9fa', '#2E86AB');

    doc.fillColor('#2E86AB')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN GENERAL DEL REPORTE', 60, startY + 10);

    // Línea separadora
    doc.strokeColor('#2E86AB')
       .lineWidth(1)
       .moveTo(60, startY + 30)
       .lineTo(540, startY + 30)
       .stroke();

    doc.fillColor('#333333')
       .font('Helvetica')
       .fontSize(11)
       .text(`Fecha de generación: ${fechaActual}`, 60, startY + 40)
       .text(`Tipo de reporte: Administrativo Completo`, 60, startY + 55)
       .text(`Generado por: Sistema MediCitas`, 60, startY + 70);

    // Asegurar espacio después
    doc.y = startY + 100;
  }

  static crearResumenSucursal(doc, resumenSucursal) {
    ReporteController.crearSeccionTitulo(doc, 'RESUMEN POR SUCURSAL', '#2E86AB');

    // Espacio después del título
    const tableStartY = doc.y + 10;

    // Encabezados de tabla
    const headers = ['Sucursal', 'Total Citas', 'Atendidas', 'Canceladas', 'No Show', 'Efectividad'];
    const colWidths = [80, 70, 70, 70, 60, 70];
    let startX = 50;
    
    // Dibujar encabezados
    doc.rect(startX, tableStartY, 420, 25)
       .fillAndStroke('#2E86AB', '#2E86AB');
    
    doc.fillColor('#ffffff')
       .fontSize(10)
       .font('Helvetica-Bold');
    
    headers.forEach((header, i) => {
      doc.text(header, startX + 5, tableStartY + 8, {
        width: colWidths[i] - 10,
        align: 'center'
      });
      startX += colWidths[i];
    });

    let currentY = tableStartY + 25;

    // Datos de la tabla
    resumenSucursal.forEach((item, index) => {
      startX = 50;
      
      // Alternar colores de fila
      const fillColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
      doc.rect(startX, currentY, 420, 25)
         .fillAndStroke(fillColor, '#dee2e6');

      doc.fillColor('#333333')
         .fontSize(9)
         .font('Helvetica');

      const valores = [
        item.sucursal,
        item.total_citas_programadas,
        item.citas_atendidas,
        item.citas_canceladas,
        item.no_show,
        `${item.porcentaje_efectividad}%`
      ];

      valores.forEach((valor, i) => {
        doc.text(String(valor), startX + 5, currentY + 8, {
          width: colWidths[i] - 10,
          align: 'center'
        });
        startX += colWidths[i];
      });

      currentY += 25;
    });

    // Asegurar espacio después de la tabla
    doc.y = currentY + 30;
  }

  static crearResumenMedicos(doc, resumenMedicos) {
    ReporteController.verificarEspacio(doc, 150);
    ReporteController.crearSeccionTitulo(doc, 'RESUMEN POR MÉDICOS', '#28a745');

    resumenMedicos.forEach((item, index) => {
      if (index > 0 && index % 3 === 0) {
        ReporteController.verificarEspacio(doc, 120);
      }

      const cardStartY = doc.y + 10;

      // Tarjeta por médico con sombra
      doc.rect(52, cardStartY + 2, 500, 70)
         .fillAndStroke('#e0e0e0', '#e0e0e0');
         
      doc.rect(50, cardStartY, 500, 70)
         .fillAndStroke('#ffffff', '#28a745');

      // Información del médico
      doc.fillColor('#333333')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(`Dr. ${item.nombre_medico}`, 60, cardStartY + 10);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#666666')
         .text(`Cédula Professional: ${item.cedulas_profesionales}`, 60, cardStartY + 25);

      // Estadísticas en grid organizado
      const stats = [
        { label: 'Total Citas:', valor: item.total_citas, x: 60, y: cardStartY + 45 },
        { label: 'Atendidas:', valor: item.citas_atendidas, x: 180, y: cardStartY + 45 },
        { label: 'Canceladas:', valor: item.citas_canceladas, x: 300, y: cardStartY + 45 },
        { label: 'No Show:', valor: item.no_show, x: 420, y: cardStartY + 45 },
        { label: 'Efectividad:', valor: `${item.porcentaje_atencion}%`, x: 300, y: cardStartY + 25 }
      ];

      doc.fillColor('#28a745')
         .fontSize(9)
         .font('Helvetica-Bold');

      stats.forEach(stat => {
        doc.text(stat.label, stat.x, stat.y);
        doc.fillColor('#333333')
           .font('Helvetica')
           .text(String(stat.valor), stat.x + 45, stat.y);
        doc.fillColor('#28a745')
           .font('Helvetica-Bold');
      });

      // Espacio después de cada tarjeta
      doc.y = cardStartY + 90;
    });

    // Espacio extra después de la sección
    doc.y += 20;
  }

  static crearResumenMensual(doc, resumenMensual) {
    ReporteController.verificarEspacio(doc, 100);
    ReporteController.crearSeccionTitulo(doc, 'ANÁLISIS MENSUAL', '#dc3545');

    resumenMensual.forEach((item, index) => {
      const cardStartY = doc.y + 10;
      
      // Barra de progreso visual para efectividad
      const efectividad = parseFloat(item.porcentaje_efectividad);
      const barWidth = (efectividad / 100) * 200;

      doc.rect(52, cardStartY + 2, 500, 45)
         .fillAndStroke('#e0e0e0', '#e0e0e0');

      doc.rect(50, cardStartY, 500, 45)
         .fillAndStroke('#ffffff', '#dc3545');

      doc.fillColor('#333333')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(item.periodo.trim(), 60, cardStartY + 8);

      doc.fontSize(9)
         .font('Helvetica')
         .text(`Total: ${item.total_citas} | Atendidas: ${item.citas_atendidas} | Canceladas: ${item.citas_canceladas}`, 60, cardStartY + 25);

      // Barra de efectividad
      doc.rect(350, cardStartY + 8, 200, 12)
         .fillAndStroke('#f8f9fa', '#dee2e6');
      
      if (barWidth > 0) {
        doc.rect(350, cardStartY + 8, barWidth, 12)
           .fillAndStroke('#28a745', '#28a745');
      }

      doc.fillColor('#333333')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(`${efectividad}%`, 460, cardStartY + 25);

      // Espacio después de cada elemento
      doc.y = cardStartY + 65;
    });

    // Espacio extra después de la sección
    doc.y += 20;
  }

  static crearResumenEspecialidades(doc, resumenEspecialidades) {
    ReporteController.verificarEspacio(doc, 150);
    ReporteController.crearSeccionTitulo(doc, 'RESUMEN POR ESPECIALIDADES', '#6f42c1');

    resumenEspecialidades.forEach((item, index) => {
      if (index > 0 && index % 2 === 0) {
        ReporteController.verificarEspacio(doc, 100);
      }

      const cardStartY = doc.y + 10;

      // Tarjeta con sombra para especialidad
      doc.rect(52, cardStartY + 2, 500, 60)
         .fillAndStroke('#e0e0e0', '#e0e0e0');

      doc.rect(50, cardStartY, 500, 60)
         .fillAndStroke('#ffffff', '#6f42c1');

      // Título de especialidad
      doc.fillColor('#6f42c1')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(item.especialidad, 60, cardStartY + 10);

      // Información organizada en dos filas
      doc.fillColor('#666666')
         .fontSize(9)
         .font('Helvetica')
         .text(`Consultorio: ${item.consultorio}`, 60, cardStartY + 28);

      // Primera fila - Estadísticas básicas
      doc.fillColor('#333333')
         .text(`Total Citas: ${item.total_citas}`, 60, cardStartY + 45);
      
      doc.text(`Atendidas: ${item.citas_atendidas}`, 200, cardStartY + 45);
      
      // Segunda columna - Métricas avanzadas
      doc.text(`Efectividad: ${item.porcentaje_atencion}%`, 350, cardStartY + 28);
      
      doc.text(`Pacientes Únicos: ${item.pacientes_unicos}`, 350, cardStartY + 45);

      // Espacio después de cada tarjeta
      doc.y = cardStartY + 80;
    });

    // Espacio extra después de la sección
    doc.y += 20;
  }

  static crearSeccionTitulo(doc, titulo, color) {
    // Espacio antes del título
    const titleStartY = doc.y + 15;
    
    // Sombra del título
    doc.rect(52, titleStartY + 2, 500, 30)
       .fillAndStroke('#e0e0e0', '#e0e0e0');

    doc.rect(50, titleStartY, 500, 30)
       .fillAndStroke(color, color);

    doc.fillColor('#ffffff')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text(titulo, 50, titleStartY + 10, {
         width: 500,
         align: 'center'
       });

    // Espacio después del título
    doc.y = titleStartY + 40;
  }

  static crearPiePagina(doc) {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Fondo del pie de página
      doc.rect(0, 740, 612, 60)
         .fillAndStroke('#f8f9fa', '#f8f9fa');
      
      // Línea superior decorativa
      doc.strokeColor('#2E86AB')
         .lineWidth(2)
         .moveTo(50, 745)
         .lineTo(550, 745)
         .stroke();

      // Información del pie organizada
      doc.fillColor('#2E86AB')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(`MediCitas`, 50, 755);
         
      doc.fillColor('#666666')
         .fontSize(8)
         .font('Helvetica')
         .text('Sistema de Gestión de Citas Médicas', 50, 770)
         .text(`Generado el ${new Date().toLocaleString('es-ES')}`, 50, 780);

      // Información de página y confidencialidad
      doc.text(`Página ${i + 1} de ${pages.count}`, 450, 755)
         .text('Documento Confidencial', 450, 770)
         .text('© 2025 MediCitas', 450, 780);
    }
  }

  static verificarEspacio(doc, espacioNecesario) {
    if (doc.y + espacioNecesario > 700) {
      doc.addPage();
    }
  }
}
