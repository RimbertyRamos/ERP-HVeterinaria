import { Request, Response } from "express";
import { CajaService } from "../services/caja.service";
import { getUserId } from "../middlewares/auth.middleware";
import { ErrorHandler } from "../middlewares/error.middleware";
import { bitacora, metaBitacora } from "../services/bitacora.singleton";
import { Columna, toCSV, streamTablaPDF } from "../services/report.util";
import { reporteCajaQuerySchema } from "../schemas/caja.schema";

// Deja constancia de la emisión de un recibo (cobro de ficha o venta directa) y,
// si hubo descuento, un evento APLICAR_DESCUENTO aparte.
function auditarRecibo(req: Request, recibo: any, origen: string) {
  const desc = Number(recibo?.descuento ?? 0);
  void bitacora.registrar({
    ...metaBitacora(req),
    accion: "CREAR",
    entidad: "recibo",
    entidad_id: recibo?.id ?? null,
    descripcion:
      `Emitió recibo ${recibo?.num_recibo ?? ""} (${origen}) por Bs. ${recibo?.total ?? "?"}` +
      (desc > 0 ? ` con descuento ${desc} (${recibo?.tipo_descuento ?? "MONTO"})` : ""),
    datos_despues: {
      num_recibo: recibo?.num_recibo,
      total: recibo?.total,
      descuento: recibo?.descuento,
      tipo_descuento: recibo?.tipo_descuento,
      metodo_pago: recibo?.metodo_pago,
    },
  });
  if (desc > 0) {
    void bitacora.registrar({
      ...metaBitacora(req),
      accion: "APLICAR_DESCUENTO",
      entidad: "recibo",
      entidad_id: recibo?.id ?? null,
      descripcion: `Aplicó descuento ${desc} (${recibo?.tipo_descuento ?? "MONTO"}) en el recibo ${recibo?.num_recibo ?? ""}`,
    });
  }
}

// Rango de un día (local): de 00:00 a 23:59:59.999.
function rangoDelDia(fecha?: string) {
  const base = fecha ? new Date(`${fecha}T00:00:00`) : new Date();
  const desde = new Date(base);
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(base);
  hasta.setHours(23, 59, 59, 999);
  return { desde, hasta };
}

export class CajaController {
  constructor(
    private readonly cajaService: CajaService,
    private readonly errors: ErrorHandler,
  ) {}

  // ── Arqueo y cierre de caja ────────────────────────────────────────────────

  getArqueo = async (req: Request, res: Response) => {
    try {
      const { fecha } = req.query as { fecha?: string };
      const { desde, hasta } = rangoDelDia(fecha);
      const arqueo = await this.cajaService.getArqueo(
        getUserId(req),
        desde,
        hasta,
      );
      res.json(arqueo);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  registrarCierre = async (req: Request, res: Response) => {
    try {
      const { fecha, efectivo_contado, observaciones } = req.body as {
        fecha?: string;
        efectivo_contado?: number | string;
        observaciones?: string;
      };
      const { desde, hasta } = rangoDelDia(fecha);
      const cierre = await this.cajaService.registrarCierre(getUserId(req), {
        desde,
        hasta,
        efectivo_contado:
          efectivo_contado != null && efectivo_contado !== ""
            ? Number(efectivo_contado)
            : undefined,
        observaciones,
      });
      void bitacora.registrar({
        ...metaBitacora(req),
        accion: "CIERRE_CAJA",
        entidad: "cierre_caja",
        entidad_id: (cierre as any)?.id ?? null,
        descripcion: `Registró cierre de caja: total Bs. ${(cierre as any)?.total_general ?? "?"} (${(cierre as any)?.cantidad_recibos ?? 0} recibos)`,
        datos_despues: cierre,
      });
      res.status(201).json(cierre);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getCierres = async (req: Request, res: Response) => {
    try {
      const rol = String(req.user?.rol || "").toUpperCase();
      const filtro = rol === "ADMIN" ? undefined : getUserId(req);
      const cierres = await this.cajaService.getCierres(filtro);
      res.json(cierres);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getPendientes = async (req: Request, res: Response) => {
    try {
      const fichas = await this.cajaService.getFichasPendientePago();
      res.json(fichas);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getRecibos = async (req: Request, res: Response) => {
    try {
      const recibos = await this.cajaService.getRecibos();
      res.json(recibos);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getReciboById = async (req: Request, res: Response) => {
    try {
      const recibo = await this.cajaService.getReciboById(
        req.params.id as string,
      );
      if (!recibo) return this.errors.e404(req, res);
      res.json(recibo);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  cobrarFicha = async (req: Request, res: Response) => {
    try {
      // cajero_id SIEMPRE desde el token, nunca del body (trazabilidad)
      const recibo = await this.cajaService.cobrarFicha({
        ...req.body,
        cajero_id: getUserId(req),
      });
      auditarRecibo(req, recibo, "cobro de ficha");
      res.status(201).json(recibo);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  ventaDirecta = async (req: Request, res: Response) => {
    try {
      // cajero_id SIEMPRE desde el token, nunca del body (trazabilidad)
      const recibo = await this.cajaService.ventaDirecta({
        ...req.body,
        cajero_id: getUserId(req),
      });
      auditarRecibo(req, recibo, "venta directa");
      res.status(201).json(recibo);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  anularRecibo = async (req: Request, res: Response) => {
    try {
      const { motivo_anulacion } = req.body;
      const recibo = await this.cajaService.anularRecibo(
        req.params.id as string,
        motivo_anulacion,
      );
      void bitacora.registrar({
        ...metaBitacora(req),
        accion: "ANULAR",
        entidad: "recibo",
        entidad_id: req.params.id as string,
        descripcion: `Anuló el recibo ${(recibo as any)?.num_recibo ?? req.params.id}${motivo_anulacion ? `: ${motivo_anulacion}` : ""}`,
        datos_despues: { motivo_anulacion },
      });
      res.json(recibo);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  // Reporte de ingresos (finanzas) exportable a CSV/PDF. Reutiliza el generador
  // genérico de report.util y registra un evento EXPORTAR en bitácora.
  reporte = async (req: Request, res: Response) => {
    const parsed = reporteCajaQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Filtros no válidos" });
    }
    try {
      const { desde, hasta } = parsed.data;
      const formato = parsed.data.formato ?? "csv";
      const { recibos, total_ingresos, cantidad } =
        await this.cajaService.reporteIngresos({ desde, hasta });

      void bitacora.registrar({
        ...metaBitacora(req),
        accion: "EXPORTAR",
        entidad: "finanzas",
        descripcion: `Exportó reporte de ingresos (${formato}, ${cantidad} recibos, Bs. ${total_ingresos.toFixed(2)})`,
      });

      const columns: Columna[] = [
        { header: "num_recibo", value: (r) => r.num_recibo ?? "" },
        {
          header: "fecha",
          value: (r) =>
            new Date(r.fecha_pago).toISOString().slice(0, 19).replace("T", " "),
        },
        { header: "cajero", value: (r) => r.cajero?.nombre ?? "" },
        {
          header: "cliente",
          value: (r) =>
            r.ficha?.mascota?.nombre ?? r.nombre_cliente ?? "Venta directa",
        },
        { header: "servicio", value: (r) => r.ficha?.servicio?.nombre ?? "-" },
        { header: "metodo_pago", value: (r) => r.metodo_pago ?? "" },
        { header: "descuento", value: (r) => String(r.descuento ?? 0) },
        { header: "tipo_descuento", value: (r) => r.tipo_descuento ?? "" },
        { header: "total", value: (r) => Number(r.total).toFixed(2) },
        { header: "estado", value: (r) => r.estado ?? "" },
      ];

      const generadoPor = req.user?.rol
        ? `${getUserId(req)} (${req.user.rol})`
        : getUserId(req);
      const fecha = new Date().toISOString().slice(0, 10);

      if (formato === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="finanzas-${fecha}.pdf"`,
        );
        streamTablaPDF(res, {
          titulo: "Reporte de Ingresos — VET-ERP",
          meta: { desde, hasta, generadoPor },
          columns,
          rows: recibos,
          resumen: [
            `Ingresos: Bs. ${total_ingresos.toFixed(2)}`,
            `Nº de recibos: ${cantidad}`,
          ],
        });
        return;
      }

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="finanzas-${fecha}.csv"`,
      );
      res.send(toCSV(columns, recibos));
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
