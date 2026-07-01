import { PrismaClient } from "@prisma/client";
import { EnviarNotificacionDto } from "../types";

export class NotificacionService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Crea (persiste) una notificación in-app para un usuario. */
  async enviar(data: EnviarNotificacionDto) {
    try {
      return await this.prisma.notificacion.create({
        data: {
          usuario_id: data.usuario_id,
          tipo: data.tipo,
          titulo: data.titulo,
          mensaje: data.mensaje,
        },
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al crear la notificación",
      };
    }
  }

  /** Notificaciones de un usuario (todas o solo las no leídas), más recientes primero. */
  async listarPorUsuario(usuario_id: string, soloNoLeidas = false) {
    try {
      return await this.prisma.notificacion.findMany({
        where: {
          usuario_id,
          ...(soloNoLeidas ? { leida: false } : {}),
        },
        orderBy: { fecha_envio: "desc" },
      });
    } catch (err) {
      throw { status: 500, message: "Error al obtener las notificaciones" };
    }
  }

  /** Marca una notificación como leída, validando que pertenezca al usuario. */
  async marcarLeida(id: string, usuario_id: string) {
    try {
      const noti = await this.prisma.notificacion.findUnique({ where: { id } });
      if (!noti) {
        throw { status: 404, message: "La notificación no existe" };
      }
      if (noti.usuario_id !== usuario_id) {
        throw {
          status: 403,
          message: "No puedes modificar notificaciones de otro usuario",
        };
      }
      return await this.prisma.notificacion.update({
        where: { id },
        data: { leida: true },
      });
    } catch (err: any) {
      throw {
        status: err?.status || 500,
        message: err?.message || "Error al marcar la notificación como leída",
      };
    }
  }
}
