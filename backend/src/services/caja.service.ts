import { PrismaClient, Prisma } from "@prisma/client";
import { ConsultorioService } from "./consultorio.service";
import { MailService } from "./mail.service";

export class CajaService {
  private static readonly RECIBO_INCLUDE = {
    ficha: {
      include: {
        mascota: {
          include: {
            propietario: { select: { id: true, nombre: true, ci: true } },
          },
        },
        servicio: true,
      },
    },
    cajero: { select: { id: true, nombre: true } },
    punto_caja: true,
    detalles: { include: { producto: true } },
  };

  constructor(
    private readonly prisma: PrismaClient,
    private readonly consultorioService: ConsultorioService,
    private readonly mailService: MailService,
  ) {}

  /** Resuelve el email del propietario de la ficha del recibo (o {} en venta directa). */
  private async resolverEmailPropietario(
    recibo: any,
  ): Promise<{ email?: string; nombre?: string }> {
    const prop = recibo?.ficha?.mascota?.propietario;
    if (!prop?.id) return {};
    try {
      const u = await this.prisma.usuario.findUnique({
        where: { id: prop.id },
        select: { email: true, nombre: true },
      });
      return { email: u?.email ?? undefined, nombre: u?.nombre ?? prop.nombre };
    } catch {
      return {};
    }
  }

  /**
   * Envía el comprobante por correo. FIRE-AND-FORGET: nunca bloquea ni rompe el
   * cobro (todo dentro de try/catch; venta directa sin email se omite en silencio).
   */
  private enviarComprobante(recibo: any): void {
    void (async () => {
      try {
        const { email, nombre } = await this.resolverEmailPropietario(recibo);
        if (!email) return;
        const items = (recibo.detalles ?? []).map((d: any) => ({
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          subtotal: Number(d.subtotal),
        }));
        const subtotal = items.reduce(
          (s: number, i: { subtotal: number }) => s + i.subtotal,
          0,
        );
        await this.mailService.enviarRecibo({
          email,
          nombre: nombre ?? null,
          num_recibo: recibo.num_recibo,
          fecha: recibo.fecha_pago,
          items,
          subtotal,
          descuento: Number(recibo.descuento ?? 0),
          tipo_descuento: recibo.tipo_descuento ?? null,
          total: Number(recibo.total),
          metodo_pago: recibo.metodo_pago,
        });
      } catch (err: any) {
        console.error(
          "[Caja] No se pudo enviar el comprobante por correo:",
          err?.message || err,
        );
      }
    })();
  }

  // ── Arqueo y cierre de caja ────────────────────────────────────────────────

  /**
   * Arqueo: resume las transacciones (recibos NO anulados) de un cajero en un
   * rango, desglosadas por método de pago, con total y cantidad. No persiste.
   */
  async getArqueo(cajeroId: string, desde: Date, hasta: Date) {
    try {
      const recibos = await this.prisma.reciboCaja.findMany({
        where: {
          cajero_id: cajeroId,
          estado: { not: "ANULADO" },
          fecha_pago: { gte: desde, lte: hasta },
        },
        select: { metodo_pago: true, total: true },
      });

      const porMetodo: Record<string, { cantidad: number; total: number }> = {
        EFECTIVO: { cantidad: 0, total: 0 },
        TARJETA: { cantidad: 0, total: 0 },
        QR: { cantidad: 0, total: 0 },
      };
      for (const r of recibos) {
        const m = String(r.metodo_pago);
        if (!porMetodo[m]) porMetodo[m] = { cantidad: 0, total: 0 };
        porMetodo[m].cantidad += 1;
        porMetodo[m].total += Number(r.total);
      }
      const total_general = Object.values(porMetodo).reduce(
        (s, x) => s + x.total,
        0,
      );

      return {
        desde,
        hasta,
        por_metodo: porMetodo,
        total_efectivo: porMetodo.EFECTIVO.total,
        total_tarjeta: porMetodo.TARJETA.total,
        total_qr: porMetodo.QR.total,
        total_general,
        cantidad_recibos: recibos.length,
      };
    } catch (err) {
      throw { status: 500, message: "Error al generar el arqueo de caja" };
    }
  }

  /**
   * Registra el cierre de caja de un turno: toma el arqueo del rango, compara el
   * efectivo contado con el esperado (diferencia) y guarda el registro histórico.
   */
  async registrarCierre(
    cajeroId: string,
    data: {
      desde: Date;
      hasta: Date;
      efectivo_contado?: number;
      observaciones?: string;
    },
  ) {
    try {
      const arqueo = await this.getArqueo(cajeroId, data.desde, data.hasta);
      const contado =
        data.efectivo_contado != null ? Number(data.efectivo_contado) : null;
      const diferencia =
        contado != null ? contado - arqueo.total_efectivo : null;

      return await this.prisma.cierreCaja.create({
        data: {
          cajero_id: cajeroId,
          fecha_desde: data.desde,
          fecha_hasta: data.hasta,
          total_efectivo: arqueo.total_efectivo,
          total_tarjeta: arqueo.total_tarjeta,
          total_qr: arqueo.total_qr,
          total_general: arqueo.total_general,
          cantidad_recibos: arqueo.cantidad_recibos,
          efectivo_contado: contado ?? undefined,
          diferencia: diferencia ?? undefined,
          observaciones: data.observaciones?.trim() || undefined,
        },
        include: { cajero: { select: { id: true, nombre: true } } },
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al registrar el cierre de caja",
      };
    }
  }

  /** Historial de cierres. Sin filtro = todos (admin); con filtro = de un cajero. */
  async getCierres(filtroCajeroId?: string) {
    try {
      return await this.prisma.cierreCaja.findMany({
        where: filtroCajeroId ? { cajero_id: filtroCajeroId } : {},
        include: { cajero: { select: { id: true, nombre: true } } },
        orderBy: { created_at: "desc" },
        take: 50,
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener los cierres de caja" };
    }
  }

  private async genNumRecibo() {
    const n = await this.prisma.reciboCaja.count();
    return `REC-${String(n + 1).padStart(5, "0")}`;
  }

  /**
   * Calcula el cambio a devolver y lo desglosa en denominaciones bolivianas.
   * Denominaciones: 100, 50, 20, 10, 5, 2, 1, 0.5, 0.1 Bs.
   */
  calcularDesgloseCambio(
    montoTotal: number,
    montoRecibido: number,
  ): {
    cambio: number;
    desglose: { denominacion: number; cantidad: number }[];
  } {
    if (montoTotal <= 0) {
      throw { status: 400, message: "El monto total debe ser mayor a cero" };
    }
    if (montoRecibido < montoTotal) {
      throw {
        status: 400,
        message: "El monto recibido es insuficiente para cubrir el total",
      };
    }

    const denominaciones = [100, 50, 20, 10, 5, 2, 1, 0.5, 0.1];
    const desglose: { denominacion: number; cantidad: number }[] = [];
    let cambio = Math.round((montoRecibido - montoTotal) * 100) / 100;
    let i = 0;

    while (i < denominaciones.length && cambio >= 0.1) {
      const denom = denominaciones[i];
      if (cambio >= denom) {
        const cantidad = Math.floor(Math.round((cambio / denom) * 100) / 100);
        cambio = Math.round((cambio - cantidad * denom) * 100) / 100;
        desglose.push({ denominacion: denom, cantidad });
      }
      i++;
    }

    return {
      cambio: Math.round((montoRecibido - montoTotal) * 100) / 100,
      desglose,
    };
  }

  /** Fichas completadas aún no cobradas */
  async getFichasPendientePago() {
    try {
      return await this.prisma.fichaAtencion.findMany({
        where: { estado: "COMPLETADA", estado_cobro: "PENDIENTE" },
        include: {
          mascota: {
            include: { propietario: { select: { id: true, nombre: true } } },
          },
          servicio: true,
          servicios_realizados: { include: { servicio: true } },
          soap: true,
          consumos: { include: { producto: true } },
        },
        orderBy: { fecha_hora: "asc" },
      });
    } catch (err) {
      throw {
        status: 500,
        message: "Error al obtener fichas pendientes de pago",
      };
    }
  }

  async getRecibos() {
    try {
      return await this.prisma.reciboCaja.findMany({
        include: CajaService.RECIBO_INCLUDE,
        orderBy: { fecha_pago: "desc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener los recibos" };
    }
  }

  async getReciboById(id: string) {
    try {
      return await this.prisma.reciboCaja.findUnique({
        where: { id },
        include: CajaService.RECIBO_INCLUDE,
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener el recibo" };
    }
  }

  /**
   * Calcula el total NETO aplicando un descuento sobre la suma de subtotales.
   * - PORCENTAJE: total = subtotales × (1 − descuento/100), con descuento 0..100.
   * - MONTO (o sin tipo): total = subtotales − descuento, con descuento ≤ subtotales.
   * Valida descuento ≥ 0 y que el total resultante NO quede negativo.
   * Redondea a 2 decimales (moneda).
   */
  aplicarDescuento(
    subtotales: number,
    descuento = 0,
    tipoDescuento?: "PORCENTAJE" | "MONTO" | null,
  ): number {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const base = Number(subtotales) || 0;
    const desc = Number(descuento) || 0;

    if (desc < 0) {
      throw { status: 400, message: "El descuento no puede ser negativo" };
    }
    if (desc === 0) return round2(base);

    if (tipoDescuento === "PORCENTAJE") {
      if (desc > 100) {
        throw {
          status: 400,
          message: "El descuento porcentual debe estar entre 0 y 100",
        };
      }
      return round2(base * (1 - desc / 100));
    }

    // MONTO (o descuento sin tipo explícito → se interpreta como monto fijo)
    if (desc > base) {
      throw {
        status: 400,
        message: "El descuento no puede exceder el subtotal del recibo",
      };
    }
    return round2(base - desc);
  }

  /**
   * Cobra una ficha completa.
   * Construye automáticamente los DetalleCobro desde el servicio, exámenes y receta.
   */
  async cobrarFicha(data: {
    ficha_id: string;
    cajero_id: string;
    punto_caja_id?: string;
    metodo_pago?: "EFECTIVO" | "TARJETA" | "QR";
    monto_recibido?: number;
    descuento?: number;
    tipo_descuento?: "PORCENTAJE" | "MONTO";
  }) {
    try {
      const ficha = await this.prisma.fichaAtencion.findUniqueOrThrow({
        where: { id: data.ficha_id },
        include: {
          servicio: true,
          servicios_realizados: { include: { servicio: true } },
          consumos: { include: { producto: true } },
        },
      });

      // Evita el doble cobro: si la ficha ya está pagada, no se debe generar
      // otro recibo ni volver a descontar stock de los insumos.
      if (ficha.estado_cobro === "PAGADO") {
        throw { status: 400, message: "Esta ficha ya fue cobrada." };
      }

      type Detalle = {
        tipo: "SERVICIO" | "FARMACIA" | "SUMINISTRO";
        descripcion: string;
        precio_unit: number;
        cantidad: number;
        subtotal: number;
        producto_id?: string;
      };

      const detalles: Detalle[] = [];

      // 1. Tarifa de consulta base (asignada en el fichaje)
      detalles.push({
        tipo: "SERVICIO",
        descripcion: ficha.servicio.nombre,
        precio_unit: Number(ficha.servicio.precio_base),
        cantidad: 1,
        subtotal: Number(ficha.servicio.precio_base),
      });

      // 2. Servicios realizados durante la consulta (los agrega el veterinario)
      for (const sr of ficha.servicios_realizados) {
        detalles.push({
          tipo: "SERVICIO",
          descripcion: sr.servicio.nombre,
          precio_unit: Number(sr.precio),
          cantidad: sr.cantidad,
          subtotal: Number(sr.precio) * sr.cantidad,
        });
      }

      // 3. Insumos/suministros usados en consulta
      for (const cons of ficha.consumos) {
        const precio = Number(cons.producto.precio_venta);
        detalles.push({
          tipo: "SUMINISTRO",
          descripcion: cons.producto.nombre,
          precio_unit: precio,
          cantidad: cons.cantidad,
          subtotal: precio * cons.cantidad,
          producto_id: cons.producto_id,
        });
      }

      const subtotales = detalles.reduce((s, d) => s + d.subtotal, 0);
      const descuento = Number(data.descuento) || 0;
      const tipo_descuento =
        descuento > 0 ? (data.tipo_descuento ?? "MONTO") : null;
      const total = this.aplicarDescuento(subtotales, descuento, tipo_descuento);
      const monto_recibido = data.monto_recibido ?? total;
      const cambio_devuelto = Math.max(0, monto_recibido - total);
      const num_recibo = await this.genNumRecibo();

      const recibo = await this.prisma.$transaction(async (tx) => {
        const recibo = await tx.reciboCaja.create({
          data: {
            num_recibo,
            ficha_id: data.ficha_id,
            cajero_id: data.cajero_id,
            punto_caja_id: data.punto_caja_id,
            metodo_pago: data.metodo_pago ?? "EFECTIVO",
            total,
            descuento,
            tipo_descuento,
            monto_recibido,
            cambio_devuelto,
            estado: "PAGADO",
            detalles: { create: detalles },
          },
          include: CajaService.RECIBO_INCLUDE,
        });

        await tx.fichaAtencion.update({
          where: { id: data.ficha_id },
          data: { estado_cobro: "PAGADO" },
        });

        // Descontar del inventario los insumos/suministros consumidos durante
        // la consulta y dejar la trazabilidad en el kardex. Sin esto, los
        // productos se facturan pero el stock nunca baja (inventario divergente).
        for (const cons of ficha.consumos) {
          const nuevo = cons.producto.stock_actual - cons.cantidad;
          await tx.producto.update({
            where: { id: cons.producto_id },
            data: { stock_actual: nuevo },
          });
          await tx.kardexMovimiento.create({
            data: {
              producto_id: cons.producto_id,
              tipo: "SALIDA",
              cantidad: cons.cantidad,
              saldo_final: nuevo,
              motivo: `Consumo en consulta ${ficha.cod_ficha}, Recibo ${num_recibo}`,
            },
          });
        }

        // Liberar el consultorio automáticamente al registrarse el pago.
        if (ficha.consultorio_id) {
          await this.consultorioService.liberarConsultorio(
            ficha.consultorio_id,
            tx,
          );
        }

        return recibo;
      });
      // Comprobante por correo (fire-and-forget; no afecta la respuesta del cobro).
      this.enviarComprobante(recibo);
      return recibo;
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al cobrar la ficha",
      };
    }
  }

  async anularRecibo(id: string, motivo_anulacion: string) {
    try {
      return await this.prisma.reciboCaja.update({
        where: { id },
        data: { estado: "ANULADO", motivo_anulacion },
        include: CajaService.RECIBO_INCLUDE,
      });
    } catch (err) {
      throw { status: 500, message: "Error al anular el recibo" };
    }
  }

  async ventaDirecta(data: {
    cajero_id: string;
    nombre_cliente?: string;
    punto_caja_id?: string;
    metodo_pago?: "EFECTIVO" | "TARJETA" | "QR";
    monto_recibido?: number;
    descuento?: number;
    tipo_descuento?: "PORCENTAJE" | "MONTO";
    productos: { id: string; cantidad: number }[];
  }) {
    try {
      const num_recibo = await this.genNumRecibo();

      // Validate and get products
      const productIds = data.productos.map((p) => p.id);
      const dbProducts = await this.prisma.producto.findMany({
        where: { id: { in: productIds } },
      });

      if (dbProducts.length !== productIds.length) {
        throw {
          status: 400,
          message: "Algunos productos no existen en el inventario.",
        };
      }

      const detalles = dbProducts.map((prod) => {
        const pInput = data.productos.find((p) => p.id === prod.id)!;
        const subtotal = Number(prod.precio_venta) * pInput.cantidad;
        return {
          tipo: "FARMACIA" as const,
          descripcion: prod.nombre,
          precio_unit: Number(prod.precio_venta),
          cantidad: pInput.cantidad,
          subtotal,
          producto_id: prod.id,
        };
      });

      const subtotales = detalles.reduce((s, d) => s + d.subtotal, 0);
      const descuento = Number(data.descuento) || 0;
      const tipo_descuento =
        descuento > 0 ? (data.tipo_descuento ?? "MONTO") : null;
      const total = this.aplicarDescuento(subtotales, descuento, tipo_descuento);
      const monto_recibido = data.monto_recibido ?? total;
      const cambio_devuelto = Math.max(0, monto_recibido - total);

      const recibo = await this.prisma.$transaction(async (tx) => {
        // Check stock explicitly to avoid errors if stock goes negative
        for (const det of detalles) {
          const prod = dbProducts.find((p) => p.id === det.producto_id)!;
          if (prod.stock_actual < det.cantidad) {
            throw {
              status: 400,
              message: `Stock insuficiente para el producto ${prod.nombre}`,
            };
          }
        }

        const recibo = await tx.reciboCaja.create({
          data: {
            num_recibo,
            cajero_id: data.cajero_id,
            nombre_cliente: data.nombre_cliente,
            punto_caja_id: data.punto_caja_id,
            metodo_pago: data.metodo_pago ?? "EFECTIVO",
            total,
            descuento,
            tipo_descuento,
            monto_recibido,
            cambio_devuelto,
            estado: "PAGADO",
            detalles: { create: detalles },
          },
          include: CajaService.RECIBO_INCLUDE,
        });

        // Descontar stock
        for (const det of detalles) {
          const prod = dbProducts.find((p) => p.id === det.producto_id)!;
          const nuevo = prod.stock_actual - det.cantidad;
          await tx.producto.update({
            where: { id: det.producto_id! },
            data: { stock_actual: nuevo },
          });
          await tx.kardexMovimiento.create({
            data: {
              producto_id: det.producto_id!,
              tipo: "SALIDA",
              cantidad: det.cantidad,
              saldo_final: nuevo,
              motivo: `Venta directa POS, Recibo ${num_recibo}`,
            },
          });
        }

        return recibo;
      });
      // Comprobante por correo (solo si la venta tiene propietario con email; si
      // no, se omite en silencio). Fire-and-forget: no afecta la respuesta.
      this.enviarComprobante(recibo);
      return recibo;
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al procesar la venta directa",
      };
    }
  }

  /**
   * Reporte de ingresos (recibos no anulados) en un rango, para exportar. Devuelve
   * las filas y los agregados (total de ingresos y cantidad de recibos).
   */
  async reporteIngresos(f: { desde?: Date; hasta?: Date }) {
    try {
      const where: Prisma.ReciboCajaWhereInput = { estado: { not: "ANULADO" } };
      if (f.desde || f.hasta) {
        where.fecha_pago = {};
        if (f.desde) where.fecha_pago.gte = f.desde;
        if (f.hasta) where.fecha_pago.lte = f.hasta;
      }
      const recibos = await this.prisma.reciboCaja.findMany({
        where,
        orderBy: { fecha_pago: "desc" },
        take: 10000, // tope de seguridad para una exportación
        select: {
          id: true,
          num_recibo: true,
          fecha_pago: true,
          metodo_pago: true,
          descuento: true,
          tipo_descuento: true,
          total: true,
          estado: true,
          nombre_cliente: true,
          cajero: { select: { nombre: true } },
          ficha: {
            select: {
              mascota: { select: { nombre: true } },
              servicio: { select: { nombre: true } },
            },
          },
        },
      });
      const totalIngresos = recibos.reduce((s, r) => s + Number(r.total), 0);
      return { recibos, total_ingresos: totalIngresos, cantidad: recibos.length };
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al generar el reporte de ingresos",
      };
    }
  }
}
