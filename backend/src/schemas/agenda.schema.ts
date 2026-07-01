import { z } from "zod";
import { LEN, fechaOpcional, enteroNoNegativoOpcional } from "./common";

// Enums COPIADOS exactos de schema.prisma (no inventar valores).
const tipoCita = z.enum([
  "CONSULTA",
  "CONTROL",
  "VACUNACION",
  "CIRUGIA",
  "PELUQUERIA",
  "OTRO",
]);
const estadoCita = z.enum([
  "SOLICITADA",
  "PROGRAMADA",
  "CONFIRMADA",
  "COMPLETADA",
  "CANCELADA",
  "NO_ASISTIO",
]);

// doctor_id / consultorio_id: el front manda id, "" o undefined; el service hace
// `|| null`. Se permite string vacío y null para no romper esos casos.
const idOpcional = z.string().nullable().optional();

/**
 * POST /agenda — AgendaService.createCita (CreateCitaDto). El front (Agenda.tsx)
 * envía mascota_id, doctor_id?, consultorio_id?, tipo, duracion_min(num),
 * fecha_hora(string ISO), motivo, notas. `motivo` es columna NOT NULL → requerida
 * (se admite "" para no ser más estricto que hoy).
 */
export const createCitaSchema = z.object({
  mascota_id: z.string().min(1, "La mascota es obligatoria"),
  doctor_id: idOpcional,
  consultorio_id: idOpcional,
  fecha_hora: z.coerce.date(),
  duracion_min: enteroNoNegativoOpcional(),
  tipo: tipoCita.optional(),
  motivo: z.string().max(LEN.medio),
  notas: z.string().max(LEN.medio).optional(),
});

/**
 * PUT /agenda/:id — updateCita (UpdateCitaDto): todo opcional (.partial()).
 */
export const updateCitaSchema = z
  .object({
    doctor_id: idOpcional,
    consultorio_id: idOpcional,
    fecha_hora: fechaOpcional(),
    duracion_min: enteroNoNegativoOpcional(),
    tipo: tipoCita,
    motivo: z.string().max(LEN.medio),
    notas: z.string().max(LEN.medio),
  })
  .partial();

/**
 * POST /agenda/solicitar — solicitarCitaPropietario (SolicitarCitaDto). El
 * propietario sale del JWT. El front (MiAgenda.tsx) manda mascota_id, tipo,
 * fecha_hora, motivo. El service tolera/normaliza tipo y motivo.
 */
export const solicitarCitaSchema = z.object({
  mascota_id: z.string().min(1, "La mascota es obligatoria"),
  fecha_hora: z.coerce.date(),
  duracion_min: enteroNoNegativoOpcional(),
  tipo: tipoCita.optional(),
  motivo: z.string().max(LEN.medio).optional(),
});

/**
 * PUT /agenda/:id/estado — updateEstadoCita: { estado }.
 */
export const updateEstadoCitaSchema = z.object({
  estado: estadoCita,
});
