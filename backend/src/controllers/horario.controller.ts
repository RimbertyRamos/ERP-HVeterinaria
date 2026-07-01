import { Request, Response } from "express";
import { HorarioService } from "../services/horario.service";
import { ErrorHandler } from "../middlewares/error.middleware";
import { horarioQuerySchema } from "../schemas/horario.schema";

export class HorarioController {
  constructor(
    private readonly horarioService: HorarioService,
    private readonly errors: ErrorHandler,
  ) {}

  listar = async (req: Request, res: Response) => {
    const parsed = horarioQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Filtros no válidos" });
    }
    try {
      res.json(await this.horarioService.listar(parsed.data));
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  crear = async (req: Request, res: Response) => {
    try {
      res.status(201).json(await this.horarioService.crear(req.body));
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  actualizar = async (req: Request, res: Response) => {
    try {
      res.json(
        await this.horarioService.actualizar(req.params.id as string, req.body),
      );
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  eliminar = async (req: Request, res: Response) => {
    try {
      await this.horarioService.eliminar(req.params.id as string);
      res.json({ ok: true });
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
