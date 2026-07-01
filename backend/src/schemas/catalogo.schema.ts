import { z } from "zod";
import { textoCorto } from "./common";

/** POST/PUT /catalogos/especies — Especie: { nombre } (único). */
export const especieSchema = z.object({
  nombre: textoCorto().min(1, "El nombre de la especie es obligatorio"),
});

/** POST /catalogos/razas — Raza: { nombre, especie_id }. */
export const createRazaSchema = z.object({
  nombre: textoCorto().min(1, "El nombre de la raza es obligatorio"),
  especie_id: z.string().min(1, "La especie es obligatoria"),
});

/** PUT /catalogos/razas/:id — parcial. */
export const updateRazaSchema = z
  .object({
    nombre: textoCorto().min(1),
    especie_id: z.string().min(1),
  })
  .partial();
