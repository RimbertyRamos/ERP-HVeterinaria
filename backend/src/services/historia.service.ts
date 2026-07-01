import { PrismaClient } from "@prisma/client";

export class HistoriaService {
  private static readonly HISTORIA_INCLUDE = {
    mascota: {
      include: {
        especie: true,
        raza: true,
        propietario: {
          select: { id: true, nombre: true, telefono: true, ci: true, email: true },
        },
      },
    },
    atendido_por: { select: { id: true, nombre: true } },
    created_by: { select: { id: true, nombre: true } },
    finalized_by: { select: { id: true, nombre: true } },
    evoluciones: { orderBy: { fecha: "asc" as const } },
    vacunas: { include: { vacuna: true } },
  };

  // Campos que el médico puede escribir. Protege estado/folio/auditoría/relaciones
  // de un mass-assignment desde el body.
  private static readonly CAMPOS_EDITABLES = [
    "propietario_nombre",
    "domicilio",
    "telefono",
    "celular",
    "edad",
    "peso",
    "motivo_consulta",
    "vacunas_otras",
    "desparasitacion",
    "desparasitacion_cuando",
    "enfermedades_previas",
    "intervenciones_previas",
    "estado_general",
    "apetito",
    "hidratacion",
    "mucosa",
    "ap_digestivo",
    "ap_genitourinario",
    "ap_respiratorio",
    "temperatura",
    "fc",
    "fr",
    "observacion_clinica",
    "pruebas_complementarias",
    "diagnostico_presuntivo",
    "diagnostico_confirmativo",
    "pronostico",
    "tratamiento",
  ];

  private static pickCampos(data: any) {
    const out: Record<string, any> = {};
    for (const k of HistoriaService.CAMPOS_EDITABLES) {
      if (data[k] !== undefined) out[k] = data[k];
    }
    return out;
  }

  /**
   * Normaliza la entrada de vacunas del body a [{ nombre, fecha_aplicacion? }].
   * Acepta strings (nombres) u objetos { nombre, fecha_aplicacion? }. Deduplica
   * por nombre (case-insensitive) para no chocar con la PK de HistoriaVacuna.
   */
  private static normalizarVacunas(
    data: any,
  ): { nombre: string; fecha_aplicacion?: Date; proxima_dosis?: Date }[] {
    if (!Array.isArray(data?.vacunas)) return [];
    const vistos = new Set<string>();
    const out: {
      nombre: string;
      fecha_aplicacion?: Date;
      proxima_dosis?: Date;
    }[] = [];
    for (const item of data.vacunas) {
      const nombre =
        typeof item === "string"
          ? item.trim()
          : String(item?.nombre ?? "").trim();
      if (!nombre) continue;
      const clave = nombre.toLowerCase();
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      const esObj = item && typeof item === "object";
      const fecha =
        esObj && item.fecha_aplicacion
          ? new Date(item.fecha_aplicacion)
          : undefined;
      // proxima_dosis por ítem (forma objeto); si no viene, la aplica el default
      // de lote en buildVacunasCreate.
      const prox =
        esObj && item.proxima_dosis ? new Date(item.proxima_dosis) : undefined;
      out.push({
        nombre,
        ...(fecha ? { fecha_aplicacion: fecha } : {}),
        ...(prox ? { proxima_dosis: prox } : {}),
      });
    }
    return out;
  }

  /**
   * Construye el nested-create de HistoriaVacuna. Usa connectOrCreate sobre el
   * catálogo Vacuna (por `nombre` único): si la vacuna ya existe la enlaza, si no
   * la crea al vuelo. `proximaDefault` es la próxima dosis de lote (RF14): se
   * aplica a las vacunas que no traen una propia.
   */
  private static buildVacunasCreate(
    vacunas: { nombre: string; fecha_aplicacion?: Date; proxima_dosis?: Date }[],
    proximaDefault?: Date,
  ) {
    return vacunas.map((v) => {
      const proxima = v.proxima_dosis ?? proximaDefault;
      return {
        ...(v.fecha_aplicacion ? { fecha_aplicacion: v.fecha_aplicacion } : {}),
        ...(proxima ? { proxima_dosis: proxima } : {}),
        vacuna: {
          connectOrCreate: {
            where: { nombre: v.nombre },
            create: { nombre: v.nombre },
          },
        },
      };
    });
  }

  /** Parsea la próxima dosis de lote del body (string ISO → Date); "" → undefined. */
  private static proximaDefault(data: any): Date | undefined {
    const raw = data?.proxima_dosis_vacunas;
    if (!raw) return undefined;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }

  /**
   * Agrega un arreglo plano `vacunas_nombres: string[]` derivado de la relación
   * `vacunas` (HistoriaVacuna[]), por compatibilidad con el frontend que aún
   * espera una lista de nombres. NO reemplaza la forma nueva: ambas conviven.
   * Devuelve el valor tal cual si es null (historia no encontrada).
   */
  private static conVacunasNombres(historia: any) {
    if (!historia) return historia;
    const vacunas_nombres = (historia.vacunas ?? [])
      .map((hv: any) => hv?.vacuna?.nombre)
      .filter((n: any): n is string => typeof n === "string" && n.length > 0);
    return { ...historia, vacunas_nombres };
  }

  constructor(private readonly prisma: PrismaClient) {}

  async getByMascota(mascota_id: string) {
    try {
      return await this.prisma.historiaClinica.findMany({
        where: { mascota_id },
        orderBy: { fecha: "desc" },
        select: {
          id: true,
          folio: true,
          fecha: true,
          motivo_consulta: true,
          diagnostico_presuntivo: true,
          diagnostico_confirmativo: true,
          estado: true,
          atendido_por: { select: { nombre: true } },
        },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener las historias clínicas" };
    }
  }

  async getByFicha(ficha_id: string) {
    try {
      return HistoriaService.conVacunasNombres(
        await this.prisma.historiaClinica.findUnique({
          where: { ficha_id },
          include: HistoriaService.HISTORIA_INCLUDE,
        }),
      );
    } catch (err) {
      throw { status: 500, message: "Error al obtener la historia de la ficha" };
    }
  }

  async getById(id: string) {
    try {
      return HistoriaService.conVacunasNombres(
        await this.prisma.historiaClinica.findUnique({
          where: { id },
          include: HistoriaService.HISTORIA_INCLUDE,
        }),
      );
    } catch (err) {
      throw { status: 500, message: "Error al obtener la historia clínica" };
    }
  }

  async create(data: any, userId: string) {
    try {
      if (!data.mascota_id) {
        throw { status: 400, message: "mascota_id es obligatorio" };
      }
      const campos = HistoriaService.pickCampos(data);
      const vacunas = HistoriaService.normalizarVacunas(data);
      const evoluciones = Array.isArray(data.evoluciones)
        ? data.evoluciones
        : [];
      return HistoriaService.conVacunasNombres(
        await this.prisma.historiaClinica.create({
        data: {
          mascota_id: data.mascota_id,
          ficha_id: data.ficha_id ?? null,
          created_by_id: userId,
          atendido_por_id: data.atendido_por_id ?? userId,
          ...campos,
          ...(vacunas.length
            ? {
                vacunas: {
                  create: HistoriaService.buildVacunasCreate(
                    vacunas,
                    HistoriaService.proximaDefault(data),
                  ),
                },
              }
            : {}),
          ...(evoluciones.length
            ? {
                evoluciones: {
                  create: evoluciones
                    .filter((e: any) => e?.descripcion?.trim())
                    .map((e: any) => ({
                      descripcion: e.descripcion,
                      ...(e.fecha ? { fecha: new Date(e.fecha) } : {}),
                    })),
                },
              }
            : {}),
        },
        include: HistoriaService.HISTORIA_INCLUDE,
        }),
      );
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw {
          status: 409,
          message: "Esta ficha de atención ya tiene una historia clínica",
        };
      }
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al crear la historia clínica",
      };
    }
  }

  async update(id: string, data: any) {
    try {
      const actual = await this.prisma.historiaClinica.findUniqueOrThrow({
        where: { id },
        select: { estado: true },
      });
      if (actual.estado === "FINALIZADA") {
        throw {
          status: 403,
          message:
            "La historia clínica está finalizada y no puede modificarse.",
        };
      }
      const campos = HistoriaService.pickCampos(data);
      const vacunasProvistas = Array.isArray(data.vacunas);
      const vacunas = HistoriaService.normalizarVacunas(data);
      const historia = await this.prisma.$transaction(async (tx) => {
        if (Array.isArray(data.evoluciones)) {
          await tx.evolucionTratamiento.deleteMany({
            where: { historia_id: id },
          });
          const limpias = data.evoluciones.filter((e: any) =>
            e?.descripcion?.trim(),
          );
          if (limpias.length) {
            await tx.evolucionTratamiento.createMany({
              data: limpias.map((e: any) => ({
                historia_id: id,
                descripcion: e.descripcion,
                ...(e.fecha ? { fecha: new Date(e.fecha) } : {}),
              })),
            });
          }
        }
        return tx.historiaClinica.update({
          where: { id },
          data: {
            ...campos,
            // Reemplaza el set completo de vacunas solo si el body las envió.
            ...(vacunasProvistas
              ? {
                  vacunas: {
                    deleteMany: {},
                    create: HistoriaService.buildVacunasCreate(
                      vacunas,
                      HistoriaService.proximaDefault(data),
                    ),
                  },
                }
              : {}),
            ...(data.atendido_por_id !== undefined && {
              atendido_por_id: data.atendido_por_id,
            }),
          },
          include: HistoriaService.HISTORIA_INCLUDE,
        });
      });
      return HistoriaService.conVacunasNombres(historia);
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al actualizar la historia clínica",
      };
    }
  }

  async finalizar(id: string, userId: string) {
    try {
      const actual = await this.prisma.historiaClinica.findUniqueOrThrow({
        where: { id },
        select: { estado: true },
      });
      if (actual.estado === "FINALIZADA") {
        throw { status: 403, message: "La historia clínica ya está finalizada" };
      }
      return HistoriaService.conVacunasNombres(
        await this.prisma.historiaClinica.update({
          where: { id },
          data: {
            estado: "FINALIZADA",
            finalized_by_id: userId,
            finalized_at: new Date(),
          },
          include: HistoriaService.HISTORIA_INCLUDE,
        }),
      );
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al finalizar la historia clínica",
      };
    }
  }

  async remove(id: string) {
    try {
      const actual = await this.prisma.historiaClinica.findUniqueOrThrow({
        where: { id },
        select: { estado: true },
      });
      if (actual.estado === "FINALIZADA") {
        throw {
          status: 403,
          message: "No se puede eliminar una historia clínica finalizada.",
        };
      }
      return await this.prisma.historiaClinica.delete({ where: { id } });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al eliminar la historia clínica",
      };
    }
  }
}
