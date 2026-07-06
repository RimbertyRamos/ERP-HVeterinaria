import { Request, Response } from "express";
import { CalificacionService } from "../services/calificacion.service";
import { getUserId } from "../middlewares/auth.middleware";
import { ErrorHandler } from "../middlewares/error.middleware";

export class CalificacionController {
  constructor(
    private readonly calificacionService: CalificacionService,
    private readonly errors: ErrorHandler,
  ) {}

  registrar = async (req: Request, res: Response) => {
    try {
      // propietario_id SIEMPRE desde el token, nunca del body (seguridad/trazabilidad)
      const calificacion = await this.calificacionService.registrar({
        ficha_id: req.body.ficha_id,
        puntaje: req.body.puntaje,
        comentario: req.body.comentario,
        propietario_id: getUserId(req),
      });
      res.status(201).json(calificacion);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  // Panel de satisfacción (ADMIN): promedio, total, por servicio y recientes.
  resumen = async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 50;
      res.json(await this.calificacionService.resumen(limit));
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  promedioPorServicio = async (req: Request, res: Response) => {
    try {
      const promedio = await this.calificacionService.promedioPorServicio(
        req.params.servicioId as string,
      );
      res.json(promedio);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
