import { PrismaClient, Prisma } from "@prisma/client";

export interface CrearHorarioData {
  consultorio_id: string;
  doctor_id: string;
  inicio: Date;
  fin: Date;
  nota?: string;
}

export class HorarioService {
  private static readonly INCLUDE = {
    consultorio: { select: { id: true, nombre: true } },
    doctor: { select: { id: true, nombre: true } },
  };

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Comprueba que la franja [inicio, fin) no se solape con otra del MISMO
   * consultorio (una sala no puede tener dos doctores a la vez) ni del MISMO
   * doctor (un doctor no puede estar en dos salas a la vez). Lanza 409 si choca.
   */
  private async validarSolape(
    data: CrearHorarioData,
    excludeId?: string,
  ): Promise<void> {
    if (!(data.fin.getTime() > data.inicio.getTime())) {
      throw { status: 400, message: "La hora de fin debe ser posterior al inicio" };
    }
    const conflicto = await this.prisma.horarioConsultorio.findFirst({
      where: {
        inicio: { lt: data.fin },
        fin: { gt: data.inicio },
        OR: [
          { consultorio_id: data.consultorio_id },
          { doctor_id: data.doctor_id },
        ],
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      include: HorarioService.INCLUDE,
    });
    if (conflicto) {
      const mismaSala = conflicto.consultorio_id === data.consultorio_id;
      const mismoDoctor = conflicto.doctor_id === data.doctor_id;
      const motivo = mismaSala
        ? `El consultorio "${conflicto.consultorio.nombre}" ya está ocupado en ese horario`
        : mismoDoctor
          ? `El doctor "${conflicto.doctor.nombre}" ya tiene una asignación en ese horario`
          : "Ya existe una asignación solapada en ese horario";
      throw { status: 409, message: `${motivo}.` };
    }
  }

  async listar(filtros: {
    desde?: Date;
    hasta?: Date;
    consultorio_id?: string;
    doctor_id?: string;
  }) {
    try {
      const where: Prisma.HorarioConsultorioWhereInput = {};
      if (filtros.consultorio_id) where.consultorio_id = filtros.consultorio_id;
      if (filtros.doctor_id) where.doctor_id = filtros.doctor_id;
      // Solape con el rango pedido: inicio < hasta && fin > desde.
      if (filtros.desde) where.fin = { gt: filtros.desde };
      if (filtros.hasta) where.inicio = { lt: filtros.hasta };
      return await this.prisma.horarioConsultorio.findMany({
        where,
        include: HorarioService.INCLUDE,
        orderBy: { inicio: "asc" },
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al obtener los horarios",
      };
    }
  }

  async crear(data: CrearHorarioData) {
    try {
      await this.validarSolape(data);
      return await this.prisma.horarioConsultorio.create({
        data: {
          consultorio_id: data.consultorio_id,
          doctor_id: data.doctor_id,
          inicio: data.inicio,
          fin: data.fin,
          nota: data.nota?.trim() || null,
        },
        include: HorarioService.INCLUDE,
      });
    } catch (err: any) {
      if (err?.code === "P2003")
        throw { status: 400, message: "El consultorio o el doctor no existe" };
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al crear el horario",
      };
    }
  }

  async actualizar(
    id: string,
    data: Partial<CrearHorarioData>,
  ) {
    try {
      const actual = await this.prisma.horarioConsultorio.findUniqueOrThrow({
        where: { id },
      });
      const fusion: CrearHorarioData = {
        consultorio_id: data.consultorio_id ?? actual.consultorio_id,
        doctor_id: data.doctor_id ?? actual.doctor_id,
        inicio: data.inicio ?? actual.inicio,
        fin: data.fin ?? actual.fin,
        nota: data.nota ?? actual.nota ?? undefined,
      };
      await this.validarSolape(fusion, id);
      return await this.prisma.horarioConsultorio.update({
        where: { id },
        data: {
          consultorio_id: fusion.consultorio_id,
          doctor_id: fusion.doctor_id,
          inicio: fusion.inicio,
          fin: fusion.fin,
          nota: fusion.nota?.trim() || null,
        },
        include: HorarioService.INCLUDE,
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al actualizar el horario",
      };
    }
  }

  async eliminar(id: string) {
    try {
      return await this.prisma.horarioConsultorio.delete({ where: { id } });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al eliminar el horario",
      };
    }
  }
}
