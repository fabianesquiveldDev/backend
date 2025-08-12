import { AsignacionesModel } from "../models/asignacionesMP.model.js";

export class AsignacionesController {
    // Crear o actualizar asignación (UPSERT)
static async upsert(req, res) {
    try {
        const { cve_pacientes, cve_medicos, fecha_inicio } = req.body;
        
        // Validar campos requeridos
        if (!cve_pacientes || !cve_medicos) {
            return res.status(400).json({ 
                message: "Los campos cve_pacientes y cve_medicos son requeridos" 
            });
        }

        const asignacion = await AsignacionesModel.upsert({
            cve_pacientes,
            cve_medicos,
            fecha_inicio
        });
        
        res.json(asignacion);
    } catch (error) {
        console.error("Error en el controlador al crear/actualizar asignación:", error);
        const errorMessage =
            error && typeof error === "object" && "message" in error
                ? error.message
                : "Error interno del servidor al crear/actualizar asignación.";
        res.status(500).json({ message: errorMessage });
    }
}

    // Obtener todas las asignaciones
    static async getAll(req, res) {
        try {
            const asignaciones = await AsignacionesModel.getAll();
            res.json(asignaciones);
        } catch (error) {
            console.error("Error en el controlador al obtener asignaciones:", error);
            const errorMessage =
                error && typeof error === "object" && "message" in error
                    ? error.message
                    : "Error interno del servidor al obtener asignaciones.";
            res.status(500).json({ message: errorMessage });
        }
    }

    // Obtener asignación por ID
    static async getOne(req, res) {
        try {
            const { cve } = req.params;
            const asignacion = await AsignacionesModel.getOne(cve);
            res.json(asignacion);
        } catch (error) {
            console.error("Error en el controlador al obtener asignación:", error);
            const errorMessage =
                error && typeof error === "object" && "message" in error
                    ? error.message
                    : "Error interno del servidor al obtener asignación.";
            res.status(500).json({ message: errorMessage });
        }
    }

    // Obtener por paciente
    static async getByPaciente(req, res) {
        try {
            const { cvePaciente } = req.params;
            const asignaciones = await AsignacionesModel.getByPaciente(cvePaciente);
            res.json(asignaciones);
        } catch (error) {
            console.error("Error en el controlador al obtener asignaciones por paciente:", error);
            const errorMessage =
                error && typeof error === "object" && "message" in error
                    ? error.message
                    : "Error interno del servidor al obtener asignaciones por paciente.";
            res.status(500).json({ message: errorMessage });
        }
    }

    // Obtener por médico
    static async getByMedico(req, res) {
        try {
            const { cveMedico } = req.params;
            const asignaciones = await AsignacionesModel.getByMedico(cveMedico);
            res.json(asignaciones);
        } catch (error) {
            console.error("Error en el controlador al obtener asignaciones por médico:", error);
            const errorMessage =
                error && typeof error === "object" && "message" in error
                    ? error.message
                    : "Error interno del servidor al obtener asignaciones por médico.";
            res.status(500).json({ message: errorMessage });
        }
    }

    // Desactivar asignación
    static async desactivar(req, res) {
        try {
            const { cve } = req.params;
            const asignacion = await AsignacionesModel.desactivar(cve);
            res.json(asignacion);
        } catch (error) {
            console.error("Error en el controlador al desactivar asignación:", error);
            const errorMessage =
                error && typeof error === "object" && "message" in error
                    ? error.message
                    : "Error interno del servidor al desactivar asignación.";
            res.status(500).json({ message: errorMessage });
        }
    }
}
