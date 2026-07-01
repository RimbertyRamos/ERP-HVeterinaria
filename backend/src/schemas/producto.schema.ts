import { z } from "zod";
import {
  textoCorto,
  LEN,
  enteroNoNegativoOpcional,
} from "./common";

/**
 * POST /productos — ProductoService.createProducto:
 * { nombre, descripcion?, categoria_id?, precio_venta, stock_actual?, stock_minimo? }.
 */
export const createProductoSchema = z.object({
  nombre: textoCorto().min(1, "El nombre del producto es obligatorio"),
  descripcion: z.string().max(LEN.medio).optional(),
  categoria_id: z.string().optional(),
  precio_venta: z.coerce.number().min(0, "El precio debe ser ≥ 0"),
  stock_actual: enteroNoNegativoOpcional(),
  stock_minimo: enteroNoNegativoOpcional(),
});

/**
 * PUT /productos/:id — UpdateProductoDto (.partial()).
 */
export const updateProductoSchema = z
  .object({
    nombre: textoCorto().min(1),
    descripcion: z.string().max(LEN.medio),
    categoria_id: z.string(),
    precio_venta: z.coerce.number().min(0, "El precio debe ser ≥ 0"),
    stock_actual: z.coerce.number().int().min(0),
    stock_minimo: z.coerce.number().int().min(0),
  })
  .partial();

/**
 * POST /productos/:id/stock — ajustarStock: { cantidad, tipo, motivo? }.
 * El service exige cantidad > 0 y tipo ∈ { INGRESO, SALIDA }.
 */
export const ajustarStockSchema = z.object({
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a cero"),
  tipo: z.enum(["INGRESO", "SALIDA"]),
  motivo: z.string().max(LEN.medio).optional(),
});
