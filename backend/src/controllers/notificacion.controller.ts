import { Request, Response } from "express";
import { NotificacionService } from "../services/notificacion.service";
import { getUserId } from "../middlewares/auth.middleware";
import { ErrorHandler } from "../middlewares/error.middleware";

export class NotificacionController {
  constructor(
    private readonly notificacionService: NotificacionService,
    private readonly errors: ErrorHandler,
  ) {}

  // GET /api/notificaciones  (?no_leidas=true para filtrar las pendientes)
  listar = async (req: Request, res: Response) => {
    try {
      const soloNoLeidas = String(req.query.no_leidas ?? "") === "true";
      const notificaciones = await this.notificacionService.listarPorUsuario(
        getUserId(req),
        soloNoLeidas,
      );
      res.json(notificaciones);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  // PATCH /api/notificaciones/:id/leida
  marcarLeida = async (req: Request, res: Response) => {
    try {
      const notificacion = await this.notificacionService.marcarLeida(
        req.params.id as string,
        getUserId(req),
      );
      res.json(notificacion);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
