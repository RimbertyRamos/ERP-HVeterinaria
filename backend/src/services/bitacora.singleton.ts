import { Request } from "express";
import prisma from "../config/db";
import { BitacoraService } from "./bitacora.service";

/**
 * Instancia única del servicio de bitácora para las llamadas EXPLÍCITAS
 * (fire-and-forget) desde controllers/middleware, sin tener que inyectarla por
 * constructor en cada uno. Vive en su propio módulo (no en container.ts) para
 * evitar dependencias circulares controller→container→controller.
 */
export const bitacora = new BitacoraService(prisma);

/**
 * Extrae del request los metadatos comunes de auditoría (actor + red) para no
 * repetirlos en cada llamada explícita. El actor_email/nombre los completa el
 * propio service a partir de usuario_id.
 */
export function metaBitacora(req: Request) {
  return {
    usuario_id: req.user?.id ?? null,
    actor_rol: req.user?.rol ?? null,
    ip: req.ip ?? null,
    user_agent: req.headers["user-agent"] ?? null,
    metodo_http: req.method,
    ruta: req.originalUrl?.split("?")[0] ?? null,
  };
}
