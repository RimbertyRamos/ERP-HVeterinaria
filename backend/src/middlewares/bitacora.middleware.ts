import { Request, Response, NextFunction } from "express";
import { AccionBitacora } from "@prisma/client";
import { bitacora } from "../services/bitacora.singleton";

// Rutas cuya auditoría se hace de forma EXPLÍCITA (con acción/semántica propia)
// y por tanto NO deben duplicarse con el registro genérico de este middleware.
const RUTAS_EXPLICITAS: RegExp[] = [
  /^\/api\/auth(\/|$)/, // LOGIN / LOGOUT / LOGIN_FALLIDO / register
  /^\/api\/perfil\/password$/, // CAMBIO_PASSWORD
  /^\/api\/caja(\/|$)/, // recibos, venta, anular, cierre
  /^\/api\/usuarios(\/|$)/, // CAMBIO_ROL / CAMBIO_ESTADO con datos_antes
  /^\/api\/bitacora(\/|$)/, // la propia bitácora / exportaciones
  /\/finalizar(\/|$)/, // historia: CAMBIO_ESTADO
  /\/stock(\/|$)/, // inventario: movimiento de kardex
];

const ACCION_POR_METODO: Record<string, AccionBitacora> = {
  POST: "CREAR",
  PUT: "ACTUALIZAR",
  PATCH: "ACTUALIZAR",
  DELETE: "ELIMINAR",
};

const VERBO: Record<string, string> = {
  CREAR: "Creó",
  ACTUALIZAR: "Actualizó",
  ELIMINAR: "Eliminó",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Middleware de auditoría AUTOMÁTICA de escrituras. Se monta una sola vez, tras
 * el parser de body y antes de las rutas. Registra en `res.on("finish")` (cuando
 * ya se conocen el status y el req.user) las peticiones mutantes
 * (POST/PUT/PATCH/DELETE) con status < 400. No registra GET (evita ruido) ni las
 * rutas con auditoría explícita. Es fire-and-forget y fail-safe.
 */
export class BitacoraMiddleware {
  capturar = (req: Request, res: Response, next: NextFunction) => {
    const accion = ACCION_POR_METODO[req.method];
    const url = req.originalUrl.split("?")[0];

    if (!accion || RUTAS_EXPLICITAS.some((re) => re.test(url))) {
      return next();
    }

    // Copia defensiva del body ANTES de que el handler lo mute.
    const body = req.body;

    res.on("finish", () => {
      if (res.statusCode >= 400) return; // solo éxitos (status < 400)

      const segmentos = url.split("/").filter(Boolean); // ["api","mascotas","<id>"]
      const entidad = segmentos[1] ?? null; // tras "api"
      const entidad_id = segmentos.slice(2).find((s) => UUID_RE.test(s)) ?? null;

      const descripcion =
        `${VERBO[accion] ?? accion} ${entidad ?? "recurso"}` +
        (entidad_id ? ` (${entidad_id})` : "");

      void bitacora.registrar({
        usuario_id: req.user?.id ?? null,
        actor_rol: req.user?.rol ?? null,
        accion,
        entidad,
        entidad_id,
        descripcion,
        // En escrituras con cuerpo, se guarda el payload (redactado) como
        // datos_despues; DELETE no lleva cuerpo.
        datos_despues:
          accion !== "ELIMINAR" && body && Object.keys(body).length
            ? body
            : undefined,
        exito: res.statusCode < 400,
        ip: req.ip ?? null,
        user_agent: req.headers["user-agent"] ?? null,
        metodo_http: req.method,
        ruta: url,
      });
    });

    next();
  };
}
