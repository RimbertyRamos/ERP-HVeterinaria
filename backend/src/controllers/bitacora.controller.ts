import { Request, Response } from "express";
import { AccionBitacora } from "@prisma/client";
import {
  BitacoraService,
  FiltrosBitacora,
} from "../services/bitacora.service";
import { ErrorHandler } from "../middlewares/error.middleware";
import { getUserId } from "../middlewares/auth.middleware";
import { bitacora, metaBitacora } from "../services/bitacora.singleton";
import { bitacoraToCSV, bitacoraToPDF } from "../services/bitacora.report";
import {
  bitacoraQuerySchema,
  bitacoraReporteQuerySchema,
} from "../schemas/bitacora.schema";

export class BitacoraController {
  constructor(
    private readonly bitacoraService: BitacoraService,
    private readonly errors: ErrorHandler,
  ) {}

  // Convierte el query ya parseado a los filtros del service (exito: string→bool).
  private aFiltros(q: any): FiltrosBitacora {
    return {
      desde: q.desde,
      hasta: q.hasta,
      usuario_id: q.usuario_id,
      accion: q.accion as AccionBitacora | undefined,
      entidad: q.entidad,
      exito: q.exito === undefined ? undefined : q.exito === "true",
      texto: q.texto,
      page: q.page,
      pageSize: q.pageSize,
    };
  }

  list = async (req: Request, res: Response) => {
    const parsed = bitacoraQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Filtros no válidos",
        detalles: parsed.error.issues.map((i) => ({
          campo: i.path.join("."),
          mensaje: i.message,
        })),
      });
    }
    try {
      res.json(await this.bitacoraService.listar(this.aFiltros(parsed.data)));
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const item = await this.bitacoraService.getById(req.params.id as string);
      if (!item) return this.errors.e404(req, res);
      res.json(item);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  resumen = async (req: Request, res: Response) => {
    const parsed = bitacoraQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Filtros no válidos" });
    }
    try {
      res.json(await this.bitacoraService.resumen(this.aFiltros(parsed.data)));
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  reporte = async (req: Request, res: Response) => {
    const parsed = bitacoraReporteQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Filtros no válidos" });
    }
    try {
      const filtros = this.aFiltros(parsed.data);
      const rows = await this.bitacoraService.listarTodo(filtros);
      const formato = parsed.data.formato ?? "csv";

      // La exportación es en sí misma un evento auditable.
      void bitacora.registrar({
        ...metaBitacora(req),
        accion: "EXPORTAR",
        entidad: "bitacora",
        descripcion: `Exportó la bitácora (${formato}, ${rows.length} registros)`,
      });

      const fecha = new Date().toISOString().slice(0, 10);
      if (formato === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="bitacora-${fecha}.pdf"`,
        );
        bitacoraToPDF(res, rows, {
          desde: filtros.desde,
          hasta: filtros.hasta,
          generadoPor: req.user?.rol
            ? `${getUserId(req)} (${req.user.rol})`
            : getUserId(req),
        });
        return;
      }

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="bitacora-${fecha}.csv"`,
      );
      res.send(bitacoraToCSV(rows));
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
