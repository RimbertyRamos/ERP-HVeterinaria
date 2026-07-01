import { z } from "zod";
import { LEN } from "./common";

/**
 * POST /calificaciones — el controller toma propietario_id del JWT (NO del body),
 * así que el body solo trae { ficha_id, puntaje, comentario? }. El service exige
 * puntaje entero 1..5.
 */
export const createCalificacionSchema = z.object({
  ficha_id: z.string().min(1, "La ficha es obligatoria"),
  puntaje: z.coerce
    .number()
    .int("El puntaje debe ser un entero")
    .min(1, "El puntaje mínimo es 1")
    .max(5, "El puntaje máximo es 5"),
  comentario: z.string().max(LEN.medio).optional(),
});
