import { z } from "zod";
import { textoCorto } from "./common";

const tipoConsultorio = z.enum([
  "CONSULTORIO",
  "LABORATORIO",
  "QUIROFANO",
  "SALA_ESPERA",
  "OTRO",
]);

const estadoConsultorio = z.enum(["LIBRE", "OCUPADO", "LIMPIEZA"]);

/**
 * POST /consultorios — CreateConsultorioDto: { nombre, especialidad?, tipo?,
 * responsable_id? }. tipo por defecto CONSULTORIO lo aplica el service.
 */
export const createConsultorioSchema = z.object({
  nombre: textoCorto().min(1, "El nombre del consultorio es obligatorio"),
  especialidad: textoCorto().optional(),
  tipo: tipoConsultorio.optional(),
  responsable_id: z.string().optional(),
});

/**
 * PUT /consultorios/:id — UpdateConsultorioDto (.partial()). responsable_id puede
 * ser un id (asignar) o null (quitar responsable).
 */
export const updateConsultorioSchema = z
  .object({
    nombre: textoCorto().min(1),
    especialidad: textoCorto(),
    tipo: tipoConsultorio,
    estado: estadoConsultorio,
    responsable_id: z.string().nullable(),
  })
  .partial();

/**
 * PUT /consultorios/:id/estado — updateEstado: { estado }.
 */
export const updateEstadoConsultorioSchema = z.object({
  estado: estadoConsultorio,
});
