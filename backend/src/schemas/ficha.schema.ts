import { z } from "zod";
import {
  LEN,
  fechaOpcional,
  enteroNoNegativoOpcional,
  numeroNoNegativoOpcional,
} from "./common";

// Enums COPIADOS exactos de schema.prisma.
const prioridad = z.enum(["URGENTE", "NORMAL"]);
const estadoFicha = z.enum(["ESPERA", "EN_CURSO", "COMPLETADA", "CANCELADA"]);
const estadoCobro = z.enum(["PENDIENTE", "PAGADO", "EXENTO"]);

/**
 * POST /fichas — FichaService.createFicha. creado_por_id lo inyecta el controller
 * desde el JWT (no se exige en el body). El front (Patients.tsx) manda mascota_id,
 * servicio_id y motivo.
 */
export const createFichaSchema = z.object({
  mascota_id: z.string().min(1, "La mascota es obligatoria"),
  servicio_id: z.string().min(1, "El servicio es obligatorio"),
  motivo: z.string().max(LEN.medio).optional(),
  prioridad: prioridad.optional(),
});

/**
 * PUT /fichas/:id/iniciar — iniciarFicha: { doctor_id?, consultorio_id }.
 * doctor_id es opcional (si no viene, el service usa el actor del JWT).
 */
export const iniciarFichaSchema = z.object({
  doctor_id: z.string().optional(),
  consultorio_id: z.string().min(1, "El consultorio es obligatorio"),
});

/**
 * PUT /fichas/:id — updateFicha. OJO: el service hace `prisma.update({ data })`
 * con `data: any` (passthrough, sin whitelisting). Para NO cambiar ese
 * comportamiento, validamos el TIPO de los campos conocidos cuando vienen pero
 * dejamos pasar el resto con .catchall(z.unknown()) en lugar de descartarlos con
 * el strip por defecto. Hoy el único uso real es WaitingRoom → { prioridad }.
 */
export const updateFichaSchema = z
  .object({
    prioridad,
    estado: estadoFicha,
    estado_cobro: estadoCobro,
    motivo: z.string().max(LEN.medio),
    doctor_id: z.string().nullable(),
    consultorio_id: z.string().nullable(),
    servicio_id: z.string(),
    fecha_hora: fechaOpcional(),
  })
  .partial()
  .catchall(z.unknown());

/**
 * POST|PUT /fichas/:id/soap — upsertSoap (UpsertSoapDto). TODOS los campos
 * opcionales: el front omite varios (p. ej. anamnesis). Numéricos coaccionados.
 */
export const upsertSoapSchema = z.object({
  motivo_detalle: z.string().max(LEN.medio).optional(),
  anamnesis: z.string().max(LEN.largo).optional(),
  peso: numeroNoNegativoOpcional(),
  temperatura: numeroNoNegativoOpcional(),
  fc: enteroNoNegativoOpcional(),
  fr: enteroNoNegativoOpcional(),
  hallazgos: z.string().max(LEN.largo).optional(),
  diagnostico: z.string().max(LEN.largo).optional(),
  tratamiento: z.string().max(LEN.largo).optional(),
});

/**
 * POST /fichas/:id/consumos — addConsumo (AddConsumoDto): { producto_id, cantidad }.
 */
export const addConsumoSchema = z.object({
  producto_id: z.string().min(1, "El producto es obligatorio"),
  cantidad: z.coerce.number().int().min(1, "La cantidad debe ser ≥ 1"),
});

/**
 * POST /fichas/:id/servicios — addServicioRealizado: { servicio_id, cantidad? }.
 * El service usa cantidad 1 cuando no viene o es ≤0; aquí cantidad es opcional.
 */
export const addServicioRealizadoSchema = z.object({
  servicio_id: z.string().min(1, "El servicio es obligatorio"),
  cantidad: z.coerce.number().int().positive().optional(),
});
