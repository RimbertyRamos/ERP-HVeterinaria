import { Request, Response } from "express";
import { VacunaService } from "../services/vacuna.service";
import { ErrorHandler } from "../middlewares/error.middleware";

export class VacunaController {
  constructor(
    private readonly vacunaService: VacunaService,
    private readonly errors: ErrorHandler,
  ) {}

  // Disparo manual / cron externo del barrido de vencimientos de vacunas.
  revisar = async (req: Request, res: Response) => {
    try {
      const resultado = await this.vacunaService.revisarVencimientosVacunas();
      res.json(resultado);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
