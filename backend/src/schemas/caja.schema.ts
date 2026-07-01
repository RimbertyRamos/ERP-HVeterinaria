import { z } from "zod";
import {
  LEN,
  textoCorto,
  numeroNoNegativoOpcional,
  numeroNullableOpcional,
} from "./common";

// Enums COPIADOS exactos de schema.prisma.
const metodoPago = z.enum(["EFECTIVO", "TARJETA", "QR"]);
const tipoDescuento = z.enum(["PORCENTAJE", "MONTO"]);

/**
 * POST /caja/recibos — CajaService.cobrarFicha. cajero_id lo inyecta el controller
 * desde el JWT (opcional en el body). monto_recibido es opcional (el service usa
 * el total si falta). descuento/tipo_descuento opcionales (CU16/CU17): el service
 * usa `Number(descuento)||0` y `tipo_descuento ?? "MONTO"` solo si hay descuento.
 */
export const cobrarFichaSchema = z.object({
  ficha_id: z.string().min(1, "La ficha es obligatoria"),
  cajero_id: z.string().optional(), // se sobreescribe con el JWT en el controller
  punto_caja_id: z.string().nullable().optional(),
  metodo_pago: metodoPago.optional(),
  monto_recibido: numeroNoNegativoOpcional(),
  descuento: numeroNoNegativoOpcional(),
  tipo_descuento: tipoDescuento.optional(),
});

/**
 * POST /caja/venta-directa — CajaService.ventaDirecta. Igual que cobrarFicha en
 * cajero/monto/descuento, pero en vez de ficha lleva la lista de productos.
 */
export const ventaDirectaSchema = z.object({
  cajero_id: z.string().optional(), // se sobreescribe con el JWT en el controller
  nombre_cliente: textoCorto().optional(),
  punto_caja_id: z.string().nullable().optional(),
  metodo_pago: metodoPago.optional(),
  monto_recibido: numeroNoNegativoOpcional(),
  descuento: numeroNoNegativoOpcional(),
  tipo_descuento: tipoDescuento.optional(),
  productos: z
    .array(
      z.object({
        id: z.string().min(1, "id de producto requerido"),
        cantidad: z.coerce.number().int().min(1, "La cantidad debe ser ≥ 1"),
      }),
    )
    .min(1, "Debe incluir al menos un producto"),
});

/**
 * PUT /caja/recibos/:id/anular — anularRecibo. El service guarda motivo_anulacion
 * (columna nullable). Se admite ausente para no ser más estricto que hoy.
 */
export const anularReciboSchema = z.object({
  motivo_anulacion: z.string().max(LEN.medio).optional(),
});

/**
 * POST /caja/cierres — registrarCierre. El cajero sale del JWT y el rango lo
 * calcula el controller. OJO: `fecha` se usa como STRING en `${fecha}T00:00:00`
 * dentro del controller → NO se coacciona a Date. efectivo_contado opcional.
 */
export const registrarCierreSchema = z.object({
  fecha: z.string().optional(),
  efectivo_contado: numeroNullableOpcional(),
  observaciones: z.string().max(LEN.medio).optional(),
});

// Los query params llegan como string; "" se trata como ausente.
const vacioUndef = (v: unknown) => (v === "" || v == null ? undefined : v);

/**
 * GET /caja/reporte — reporte de ingresos (recibos) por rango. Se valida con
 * .safeParse en el controller (el middleware validate() opera sobre req.body).
 */
export const reporteCajaQuerySchema = z.object({
  desde: z.preprocess(vacioUndef, z.coerce.date().optional()),
  hasta: z.preprocess(vacioUndef, z.coerce.date().optional()),
  formato: z.preprocess(vacioUndef, z.enum(["csv", "pdf"]).optional()),
});
