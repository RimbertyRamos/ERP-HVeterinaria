import { z } from "zod";
import { textoCorto } from "./common";

/**
 * POST /servicios — ServicioService.createServicio: { nombre, precio_base }.
 * El service exige nombre no vacío y precio_base ≥ 0.
 */
export const createServicioSchema = z.object({
  nombre: textoCorto().min(1, "El nombre del servicio es obligatorio"),
  precio_base: z.coerce.number().min(0, "El precio debe ser ≥ 0"),
});

/**
 * PUT /servicios/:id — updateServicio: { nombre?, precio_base?, activo? }.
 */
export const updateServicioSchema = z
  .object({
    nombre: textoCorto().min(1),
    precio_base: z.coerce.number().min(0, "El precio debe ser ≥ 0"),
    activo: z.boolean(),
  })
  .partial();
