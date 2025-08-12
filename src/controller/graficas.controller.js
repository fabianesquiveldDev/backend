// Importar los modelos necesarios
import { GraficasModel } from '../models/graficas.model.js';

export class graficasController {
  
  /**
   * Controlador para la primera gráfica - Estados de citas
   * GET /api/graficas/uno
   */
  static async getUno(req, res) {
    try {
      console.log('📊 Obteniendo datos para gráfica UNO - Estados de citas');
      
      const { cve } = req.params || {};
      
      // Si no viene cve en params, usar valor por defecto o del usuario
      let cve_sucursal = cve || 1;
      if (!cve && req.user?.cve_usuarios) {
        cve_sucursal = await GraficasModel.obtenercvesucursal(req.user.cve_usuarios);
      }
      
      const datos = await GraficasModel.consultaUno(cve_sucursal);
      
      // Formatear datos perfectos para Chart.js
      const datosFormateados = {
        title: "Estados de las Citas",
        labels: datos.map(item => item.estado_cita),
        datasets: [{
          data: datos.map(item => parseInt(item.total_citas)),
          backgroundColor: [
            '#28a745', // Verde para Atendidas
            '#dc3545', // Rojo para Canceladas  
            '#ffc107', // Amarillo para No Show
            '#6c757d'  // Gris para Pendientes
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }],
        details: datos.map(item => ({
          label: item.estado_cita,
          value: parseInt(item.total_citas),
          percentage: parseFloat(item.porcentaje)
        })),
        type: "doughnut"
      };

      res.status(200).json({
        success: true,
        message: "Datos de gráfica uno obtenidos correctamente",
        data: datosFormateados
      });

    } catch (error) {
      console.error('❌ Error en gráfica uno:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener gráfica uno',
        error: error.message
      });
    }
  }

  /**
   * Controlador para la segunda gráfica - Top médicos con más citas
   * GET /api/graficas/dos
   */
  static async getDos(req, res) {
    try {
      console.log('📊 Obteniendo datos para gráfica DOS - Top médicos');
      
      const { cve } = req.params || {};
      let cve_sucursal = cve || 1;
      
      const datos = await GraficasModel.consultaDos(cve_sucursal);
      
      // Formatear datos para Chart.js (barras horizontales)
      const datosFormateados = {
        title: "Médicos con Más Citas Atendidas",
        labels: datos.map(item => item.medico),
        datasets: [{
          label: 'Citas Atendidas',
          data: datos.map(item => parseInt(item.citas_atendidas)),
          backgroundColor: '#2E86AB',
          borderColor: '#1E5A7A',
          borderWidth: 1
        }],
        details: datos.map(item => ({
          medico: item.medico,
          citas_atendidas: parseInt(item.citas_atendidas),
          cedula: item.cedulas_profesionales
        })),
        type: "horizontalBar"
      };

      res.status(200).json({
        success: true,
        message: "Datos de gráfica dos obtenidos correctamente",
        data: datosFormateados
      });

    } catch (error) {
      console.error('❌ Error en gráfica dos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener gráfica dos',
        error: error.message
      });
    }
  }

  /**
   * Controlador para la tercera gráfica - Tendencia mensual de citas
   * GET /api/graficas/tres  
   */
  static async getTres(req, res) {
    try {
      console.log('📊 Obteniendo datos para gráfica TRES - Tendencia mensual');
      
      const { cve } = req.params || {};
      let cve_sucursal = cve || 1;
      
      const datos = await GraficasModel.consultaTres(cve_sucursal);
      
      // Formatear datos para Chart.js (líneas)
      const datosFormateados = {
        title: "Tendencia de Citas por Mes",
        labels: datos.map(item => item.mes_nombre),
        datasets: [{
          label: 'Total de Citas',
          data: datos.map(item => parseInt(item.total_citas)),
          backgroundColor: 'rgba(46, 134, 171, 0.1)',
          borderColor: '#2E86AB',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }],
        details: datos.map(item => ({
          mes: item.mes_nombre,
          mes_numero: parseInt(item.mes),
          total_citas: parseInt(item.total_citas),
          promedio_diario: parseFloat((item.total_citas / 30).toFixed(1))
        })),
        type: "line"
      };

      res.status(200).json({
        success: true,
        message: "Datos de gráfica tres obtenidos correctamente",
        data: datosFormateados
      });

    } catch (error) {
      console.error('❌ Error en gráfica tres:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener gráfica tres',
        error: error.message
      });
    }
  }

  /**
   * Controlador para la cuarta gráfica - Especialidades más solicitadas
   * GET /api/graficas/cuatro
   */
  static async getCuatro(req, res) {
    try {
      console.log('📊 Obteniendo datos para gráfica CUATRO - Especialidades');
      
      const { cve } = req.params || {};
      let cve_sucursal = cve || 1;
      
      const datos = await GraficasModel.consultaCuatro(cve_sucursal);
      
      // Formatear datos para Chart.js (pie chart)
      const datosFormateados = {
        title: "Especialidades Más Solicitadas",
        labels: datos.map(item => item.especialidad),
        datasets: [{
          label: 'Total de Citas',
          data: datos.map(item => parseInt(item.total_citas)),
          backgroundColor: [
            '#FF6384',
            '#36A2EB', 
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#FF6384',
            '#C9CBCF'
          ],
          borderColor: '#fff',
          borderWidth: 2
        }],
        details: datos.map(item => ({
          especialidad: item.especialidad,
          total_citas: parseInt(item.total_citas),
          citas_atendidas: parseInt(item.citas_atendidas),
          porcentaje_atencion: parseFloat(item.porcentaje_atencion)
        })),
        type: "pie"
      };

      res.status(200).json({
        success: true,
        message: "Datos de gráfica cuatro obtenidos correctamente",
        data: datosFormateados
      });

    } catch (error) {
      console.error('❌ Error en gráfica cuatro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener gráfica cuatro',
        error: error.message
      });
    }
  }

  /**
   * Método adicional para obtener todas las gráficas de una vez
   * GET /api/graficas/todas
   */
  static async getTodas(req, res) {
    try {
      console.log('📊 Obteniendo datos para TODAS las gráficas');
      
      const { cve } = req.params || {};
      
      let cve_sucursal = cve;
      if (!cve_sucursal && req.user?.cve_usuarios) {
        cve_sucursal = await GraficasModel.obtenercvesucursal(req.user.cve_usuarios);
      }
      
      if (!cve_sucursal) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo determinar la sucursal'
        });
      }
      
      const todasLasGraficas = await GraficasModel.obtenerTodasLasGraficas(cve_sucursal);
      
      const datos = {
        citasPorMes: {
          title: "Citas por Mes",
          data: todasLasGraficas.citasPorMes.map(item => ({
            periodo: item.periodo.trim(),
            total_citas: parseInt(item.total_citas),
            citas_atendidas: parseInt(item.citas_atendidas),
            citas_canceladas: parseInt(item.citas_canceladas),
            no_show: parseInt(item.no_show)
          })),
          type: "bar"
        },
        especialidadesSolicitadas: {
          title: "Especialidades Más Solicitadas",
          data: todasLasGraficas.especialidadesSolicitadas.map(item => ({
            especialidad: item.especialidad,
            total_citas: parseInt(item.total_citas),
            porcentaje_atencion: parseFloat(item.porcentaje_atencion)
          })),
          type: "pie"
        },
        estadosCitas: {
          title: "Estados de las Citas",
          data: [
            { estado: "Completadas", cantidad: parseInt(todasLasGraficas.estadosCitas.completadas), porcentaje: parseFloat(todasLasGraficas.estadosCitas.porcentaje_completadas) },
            { estado: "Canceladas", cantidad: parseInt(todasLasGraficas.estadosCitas.canceladas), porcentaje: parseFloat(todasLasGraficas.estadosCitas.porcentaje_canceladas) },
            { estado: "No Show", cantidad: parseInt(todasLasGraficas.estadosCitas.no_show), porcentaje: parseFloat(todasLasGraficas.estadosCitas.porcentaje_no_show) },
            { estado: "Pendientes", cantidad: parseInt(todasLasGraficas.estadosCitas.pendientes), porcentaje: parseFloat(todasLasGraficas.estadosCitas.porcentaje_pendientes) }
          ],
          type: "donut"
        },
        medicosTopCitas: {
          title: "Médicos con Más Citas",
          data: todasLasGraficas.medicosTopCitas.map(item => ({
            nombre_medico: item.nombre_medico,
            total_citas: parseInt(item.total_citas),
            porcentaje_atencion: parseFloat(item.porcentaje_atencion)
          })),
          type: "horizontal-bar"
        }
      };

      res.status(200).json({
        success: true,
        message: "Todas las gráficas obtenidas correctamente",
        data: datos
      });

    } catch (error) {
      console.error('❌ Error obteniendo todas las gráficas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener todas las gráficas',
        error: error.message
      });
    }
  }

  /**
   * Controlador para la primera gráfica de sucursal - Citas por Mes
   * GET /api/graficas/sucursal/:cve/uno
   */
  static async getSucursalUno(req, res) {
    try {
      console.log('📊 Obteniendo datos de citas por mes para sucursal');
      
      const { cve } = req.params;
      
      if (!cve || isNaN(Number(cve))) {
        return res.status(400).json({
          success: false,
          message: 'CVE de sucursal inválido'
        });
      }

      const datos = await GraficasModel.consultaSucursalUno(Number(cve));
      
      // Formatear datos para Chart.js (líneas)
      const datosFormateados = {
        title: "Citas por Mes en la Sucursal",
        labels: datos.map(item => item.mes),
        datasets: [
          {
            label: 'Total de Citas',
            data: datos.map(item => parseInt(item.total_citas)),
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            borderColor: '#36A2EB',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Citas Atendidas',
            data: datos.map(item => parseInt(item.citas_atendidas)),
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderColor: '#4BC0C0',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }
        ],
        details: datos.map(item => ({
          mes: item.mes,
          total_citas: parseInt(item.total_citas),
          citas_atendidas: parseInt(item.citas_atendidas),
          porcentaje_atencion: parseFloat(((item.citas_atendidas / item.total_citas) * 100).toFixed(2))
        })),
        type: "line"
      };

      res.status(200).json({
        success: true,
        message: "Datos de citas por mes obtenidos correctamente",
        data: datosFormateados
      });

    } catch (error) {
      console.error('❌ Error en gráfica sucursal uno:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener gráfica de sucursal',
        error: error.message
      });
    }
  }

  /**
   * Controlador para la segunda gráfica de sucursal - Especialidades Más Demandadas
   * GET /api/graficas/sucursal/:cve/dos
   */
  static async getSucursalDos(req, res) {
    try {
      console.log('📊 Obteniendo especialidades más demandadas por sucursal');
      
      const { cve } = req.params;
      
      if (!cve || isNaN(Number(cve))) {
        return res.status(400).json({
          success: false,
          message: 'CVE de sucursal inválido'
        });
      }

      const datos = await GraficasModel.consultaSucursalDos(Number(cve));
      
      // Formatear datos para Chart.js (pie chart)
      const datosFormateados = {
        title: "Especialidades Más Demandadas",
        labels: datos.map(item => item.especialidad),
        datasets: [{
          label: 'Total de Citas',
          data: datos.map(item => parseInt(item.total_citas)),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ],
          borderColor: '#fff',
          borderWidth: 2
        }],
        details: datos.map(item => ({
          especialidad: item.especialidad,
          total_citas: parseInt(item.total_citas)
        })),
        type: "pie"
      };

      res.status(200).json({
        success: true,
        message: "Datos de especialidades demandadas obtenidos correctamente",
        data: datosFormateados
      });

    } catch (error) {
      console.error('❌ Error en gráfica sucursal dos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener especialidades',
        error: error.message
      });
    }
  }

  /**
   * Controlador para la tercera gráfica de sucursal - Médicos con Más Citas
   * GET /api/graficas/sucursal/:cve/tres
   */
  static async getSucursalTres(req, res) {
    try {
      console.log('📊 Obteniendo médicos con más citas por sucursal');
      
      const { cve } = req.params;
      
      if (!cve || isNaN(Number(cve))) {
        return res.status(400).json({
          success: false,
          message: 'CVE de sucursal inválido'
        });
      }

      const datos = await GraficasModel.consultaSucursalTres(Number(cve));
      
      // Formatear datos para Chart.js (barras horizontales)
      const datosFormateados = {
        title: "Médicos con Más Citas",
        labels: datos.map(item => item.medico),
        datasets: [{
          label: 'Total de Citas',
          data: datos.map(item => parseInt(item.total_citas)),
          backgroundColor: '#2E86AB',
          borderColor: '#1E5A7A',
          borderWidth: 1
        }],
        details: datos.map(item => ({
          medico: item.medico,
          total_citas: parseInt(item.total_citas),
          especialidad: item.especialidad
        })),
        type: "horizontalBar"
      };

      res.status(200).json({
        success: true,
        message: "Datos de médicos con más citas obtenidos correctamente",
        data: datosFormateados
      });

    } catch (error) {
      console.error('❌ Error en gráfica sucursal tres:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener médicos',
        error: error.message
      });
    }
  }

  /**
   * Controlador para la cuarta gráfica de sucursal - Horarios Más Solicitados
   * GET /api/graficas/sucursal/:cve/cuatro
   */
  static async getSucursalCuatro(req, res) {
    try {
      console.log('📊 Obteniendo horarios más solicitados por sucursal');
      
      const { cve } = req.params;
      
      if (!cve || isNaN(Number(cve))) {
        return res.status(400).json({
          success: false,
          message: 'CVE de sucursal inválido'
        });
      }

      const datos = await GraficasModel.consultaSucursalCuatro(Number(cve));
      
      // Formatear datos para Chart.js (barras)
      const datosFormateados = {
        title: "Horarios Más Solicitados",
        labels: datos.map(item => `${item.hora_del_dia}:00`),
        datasets: [{
          label: 'Total de Citas',
          data: datos.map(item => parseInt(item.total_citas)),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: '#FF6384',
          borderWidth: 1
        }],
        details: datos.map(item => ({
          hora: `${item.hora_del_dia}:00`,
          total_citas: parseInt(item.total_citas)
        })),
        type: "bar"
      };

      res.status(200).json({
        success: true,
        message: "Datos de horarios más solicitados obtenidos correctamente",
        data: datosFormateados
      });

    } catch (error) {
      console.error('❌ Error en gráfica sucursal cuatro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener horarios',
        error: error.message
      });
    }
  }

  
}
