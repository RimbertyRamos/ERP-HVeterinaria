import { Request, Response } from "express";
import { CatalogoService } from "../services/catalogo.service";
import { ErrorHandler } from "../middlewares/error.middleware";

export class CatalogoController {
  constructor(
    private readonly catalogoService: CatalogoService,
    private readonly errors: ErrorHandler,
  ) {}

  getEspecies = async (req: Request, res: Response) => {
    try {
      res.json(await this.catalogoService.getEspecies());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getRazas = async (req: Request, res: Response) => {
    try {
      res.json(
        await this.catalogoService.getRazas(req.query.especie_id as string),
      );
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getColores = async (req: Request, res: Response) => {
    try {
      res.json(await this.catalogoService.getColores());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getAlergias = async (req: Request, res: Response) => {
    try {
      res.json(await this.catalogoService.getAlergias());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getServicios = async (req: Request, res: Response) => {
    try {
      res.json(await this.catalogoService.getServicios());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getCategorias = async (req: Request, res: Response) => {
    try {
      res.json(await this.catalogoService.getCategorias());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getRoles = async (req: Request, res: Response) => {
    try {
      res.json(await this.catalogoService.getRoles());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getVeterinarios = async (req: Request, res: Response) => {
    try {
      res.json(await this.catalogoService.getVeterinarios());
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getPropietarios = async (req: Request, res: Response) => {
    try {
      res.json(
        await this.catalogoService.getPropietarios(
          req.query.search as string | undefined,
        ),
      );
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  // ── Gestión (solo permiso gestionar_catalogos) ──────────────────────────────

  createEspecie = async (req: Request, res: Response) => {
    try {
      res.status(201).json(await this.catalogoService.createEspecie(req.body));
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  updateEspecie = async (req: Request, res: Response) => {
    try {
      res.json(
        await this.catalogoService.updateEspecie(
          req.params.id as string,
          req.body,
        ),
      );
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  deleteEspecie = async (req: Request, res: Response) => {
    try {
      await this.catalogoService.deleteEspecie(req.params.id as string);
      res.json({ ok: true });
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  createRaza = async (req: Request, res: Response) => {
    try {
      res.status(201).json(await this.catalogoService.createRaza(req.body));
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  updateRaza = async (req: Request, res: Response) => {
    try {
      res.json(
        await this.catalogoService.updateRaza(
          req.params.id as string,
          req.body,
        ),
      );
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  deleteRaza = async (req: Request, res: Response) => {
    try {
      await this.catalogoService.deleteRaza(req.params.id as string);
      res.json({ ok: true });
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
