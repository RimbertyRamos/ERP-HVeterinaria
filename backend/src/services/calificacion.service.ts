import { PrismaClient } from "@prisma/client";

export class CalificacionService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Registra la calificación de una ficha. Reglas de negocio:
   *  - puntaje entero en el rango 1..5.
   *  - la ficha debe existir y estar COMPLETADA.
   *  - solo el propietario de la mascota de la ficha puede calificar.
   *  - una ficha se califica una sola vez (ficha_id @unique → P2002 = 409).
   */
  async registrar(data: {
    ficha_id: string;
    propietario_id: string;
    puntaje: number;
    comentario?: string;
  }) {
    const puntaje = Number(data.puntaje);
    if (!Number.isInteger(puntaje) || puntaje < 1 || puntaje > 5) {
      throw { status: 400, message: "El puntaje debe ser un entero entre 1 y 5" };
    }

    const ficha = await this.prisma.fichaAtencion.findUnique({
      where: { id: data.ficha_id },
      include: { mascota: { select: { propietario_id: true } } },
    });
    if (!ficha) {
      throw { status: 404, message: "La ficha de atención no existe" };
    }
    if (ficha.estado !== "COMPLETADA") {
      throw {
        status: 400,
        message: "Solo se puede calificar una ficha COMPLETADA",
      };
    }
    if (ficha.mascota.propietario_id !== data.propietario_id) {
      throw {
        status: 403,
        message: "Solo el propietario de la mascota puede calificar esta atención",
      };
    }

    try {
      return await this.prisma.calificacion.create({
        data: {
          ficha_id: data.ficha_id,
          propietario_id: data.propietario_id,
          puntaje,
          comentario: data.comentario?.trim() || null,
        },
      });
    } catch (err: any) {
      // ficha_id @unique → ya existe una calificación para esta ficha
      if (err?.code === "P2002") {
        throw { status: 409, message: "Esta ficha ya fue calificada" };
      }
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al registrar la calificación",
      };
    }
  }

  /**
   * Panel de satisfacción para el ADMIN (toma de decisiones): promedio general,
   * total de calificaciones, desglose por servicio y las más recientes con su
   * contexto (cliente, mascota, servicio, comentario).
   */
  async resumen(limit = 50) {
    try {
      const [items, agg] = await Promise.all([
        this.prisma.calificacion.findMany({
          orderBy: { fecha: "desc" },
          take: Math.min(200, Math.max(1, limit)),
          include: {
            propietario: { select: { nombre: true } },
            ficha: {
              select: {
                cod_ficha: true,
                servicio: { select: { id: true, nombre: true } },
                mascota: { select: { nombre: true } },
              },
            },
          },
        }),
        this.prisma.calificacion.aggregate({
          _avg: { puntaje: true },
          _count: { _all: true },
        }),
      ]);

      // Desglose por servicio sobre las recientes (suficiente para el panel).
      const porServicio = new Map<
        string,
        { servicio: string; total: number; suma: number }
      >();
      for (const c of items) {
        const s = c.ficha?.servicio;
        if (!s) continue;
        const cur = porServicio.get(s.id) ?? {
          servicio: s.nombre,
          total: 0,
          suma: 0,
        };
        cur.total += 1;
        cur.suma += c.puntaje;
        porServicio.set(s.id, cur);
      }

      return {
        promedio: agg._avg.puntaje ?? 0,
        total: agg._count._all,
        por_servicio: [...porServicio.values()]
          .map((x) => ({
            servicio: x.servicio,
            total: x.total,
            promedio: x.suma / x.total,
          }))
          .sort((a, b) => b.total - a.total),
        items,
      };
    } catch (err) {
      throw {
        status: 500,
        message: "Error al obtener el resumen de calificaciones",
      };
    }
  }

  /**
   * Promedio de puntaje de todas las calificaciones de fichas cuyo servicio
   * (FichaAtencion.servicio_id) es el indicado. Devuelve también el total.
   */
  async promedioPorServicio(servicioId: string) {
    try {
      const agg = await this.prisma.calificacion.aggregate({
        where: { ficha: { servicio_id: servicioId } },
        _avg: { puntaje: true },
        _count: { _all: true },
      });
      return {
        servicio_id: servicioId,
        promedio: agg._avg.puntaje ?? 0,
        total: agg._count._all,
      };
    } catch (err) {
      throw {
        status: 500,
        message: "Error al calcular el promedio de calificaciones",
      };
    }
  }
}
