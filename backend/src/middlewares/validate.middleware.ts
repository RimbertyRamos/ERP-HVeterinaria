import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Middleware de validación de body con Zod. Se intercala en las rutas igual que
 * `roleMiddleware.require(...)`:
 *   router.post("/", validate(schema), controller.metodo)
 *
 * - Si el body NO cumple el esquema → responde 400 con { error, detalles }.
 * - Si cumple → REEMPLAZA req.body por el dato ya parseado (coaccionado y con los
 *   campos extra descartados, igual que el whitelisting que hoy hacen los services)
 *   y continúa con next().
 *
 * No toca controllers ni services: el contrato de req.body que reciben es el mismo
 * (o más limpio) que antes.
 */
export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Datos de entrada no válidos",
        detalles: result.error.issues.map((i) => ({
          campo: i.path.join(".") || "(raíz)",
          mensaje: i.message,
        })),
      });
    }
    // El body parseado puede traer valores coaccionados (números/fechas) y sin
    // campos desconocidos; los controllers siguen leyéndolo igual.
    req.body = result.data;
    next();
  };
