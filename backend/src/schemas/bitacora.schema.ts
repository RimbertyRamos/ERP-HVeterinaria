import { z } from "zod";

// Enum COPIADO de schema.prisma (AccionBitacora).
export const ACCIONES_BITACORA = [
  "LOGIN",
  "LOGOUT",
  "LOGIN_FALLIDO",
  "CAMBIO_PASSWORD",
  "CREAR",
  "ACTUALIZAR",
  "ELIMINAR",
  "CAMBIO_ESTADO",
  "CAMBIO_ROL",
  "APLICAR_DESCUENTO",
  "ANULAR",
  "CIERRE_CAJA",
  "EXPORTAR",
  "ACCESO_HISTORIA",
] as const;

// Los query params llegan como string; "" se trata como ausente.
const vacioUndef = (v: unknown) => (v === "" || v == null ? undefined : v);

/**
 * Query de filtros/paginación de GET /bitacora. Se valida con .safeParse en el
 * controller (el middleware validate() opera sobre req.body, no sobre req.query).
 */
export const bitacoraQuerySchema = z.object({
  desde: z.preprocess(vacioUndef, z.coerce.date().optional()),
  hasta: z.preprocess(vacioUndef, z.coerce.date().optional()),
  usuario_id: z.preprocess(vacioUndef, z.string().optional()),
  accion: z.preprocess(vacioUndef, z.enum(ACCIONES_BITACORA).optional()),
  entidad: z.preprocess(vacioUndef, z.string().max(200).optional()),
  // "true"/"false" desde el query; se convierte a boolean en el controller.
  exito: z.preprocess(vacioUndef, z.enum(["true", "false"]).optional()),
  texto: z.preprocess(vacioUndef, z.string().max(200).optional()),
  page: z.preprocess(vacioUndef, z.coerce.number().int().min(1).optional()),
  pageSize: z.preprocess(
    vacioUndef,
    z.coerce.number().int().min(1).max(200).optional(),
  ),
});

export const bitacoraReporteQuerySchema = bitacoraQuerySchema.extend({
  formato: z.preprocess(vacioUndef, z.enum(["csv", "pdf"]).optional()),
});

export type BitacoraQuery = z.infer<typeof bitacoraQuerySchema>;
