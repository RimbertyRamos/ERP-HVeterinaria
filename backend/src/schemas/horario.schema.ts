import { z } from "zod";
import { LEN } from "./common";

const vacioUndef = (v: unknown) => (v === "" || v == null ? undefined : v);

/** POST /horarios — franja { consultorio_id, doctor_id, inicio, fin, nota? }. */
export const crearHorarioSchema = z
  .object({
    consultorio_id: z.string().min(1, "El consultorio es obligatorio"),
    doctor_id: z.string().min(1, "El doctor es obligatorio"),
    inicio: z.coerce.date(),
    fin: z.coerce.date(),
    nota: z.string().max(LEN.medio).optional(),
  })
  .refine((d) => d.fin.getTime() > d.inicio.getTime(), {
    message: "La hora de fin debe ser posterior al inicio",
    path: ["fin"],
  });

/** PUT /horarios/:id — parcial (el solape lo revalida el service). */
export const actualizarHorarioSchema = z
  .object({
    consultorio_id: z.string().min(1),
    doctor_id: z.string().min(1),
    inicio: z.coerce.date(),
    fin: z.coerce.date(),
    nota: z.string().max(LEN.medio),
  })
  .partial();

/** GET /horarios — filtros de rango/consultorio/doctor (se valida en el controller). */
export const horarioQuerySchema = z.object({
  desde: z.preprocess(vacioUndef, z.coerce.date().optional()),
  hasta: z.preprocess(vacioUndef, z.coerce.date().optional()),
  consultorio_id: z.preprocess(vacioUndef, z.string().optional()),
  doctor_id: z.preprocess(vacioUndef, z.string().optional()),
});
