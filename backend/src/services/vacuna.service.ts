import { PrismaClient } from "@prisma/client";
import { MailService } from "./mail.service";
import { NotificacionService } from "./notificacion.service";

/**
 * RF14 — recordatorios de vencimiento de vacunas. Revisa las HistoriaVacuna cuya
 * `proxima_dosis` cae dentro de los próximos 7 días y aún no fueron avisadas, y
 * notifica al propietario por correo e in-app. Fail-safe: un fallo por vacuna no
 * detiene el resto.
 */
export class VacunaService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly mailService: MailService,
    private readonly notificacionService: NotificacionService,
  ) {}

  async revisarVencimientosVacunas(): Promise<{
    revisados: number;
    enviados: number;
  }> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy);
    limite.setDate(hoy.getDate() + 7);
    limite.setHours(23, 59, 59, 999);

    let vencen: any[] = [];
    try {
      vencen = await this.prisma.historiaVacuna.findMany({
        where: {
          recordatorio_enviado: false,
          proxima_dosis: { gte: hoy, lte: limite },
        },
        include: {
          vacuna: { select: { nombre: true } },
          historia: {
            select: {
              mascota: {
                select: {
                  nombre: true,
                  propietario: {
                    select: { id: true, nombre: true, email: true },
                  },
                },
              },
            },
          },
        },
      });
    } catch (err: any) {
      console.error(
        "[Vacunas] No se pudieron consultar los vencimientos:",
        err?.message || err,
      );
      return { revisados: 0, enviados: 0 };
    }

    let enviados = 0;
    for (const hv of vencen) {
      try {
        // Marca PRIMERO para no duplicar el aviso ante corridas concurrentes.
        await this.prisma.historiaVacuna.update({
          where: {
            historia_id_vacuna_id: {
              historia_id: hv.historia_id,
              vacuna_id: hv.vacuna_id,
            },
          },
          data: { recordatorio_enviado: true },
        });

        const prop = hv.historia?.mascota?.propietario;
        const mascota = hv.historia?.mascota?.nombre ?? "su mascota";
        const fecha = hv.proxima_dosis
          ? new Date(hv.proxima_dosis).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "";

        // Correo (fail-safe dentro del mail service).
        void this.mailService.enviarRecordatorioVacuna({
          email: prop?.email,
          nombre: prop?.nombre,
          mascota,
          vacuna: hv.vacuna.nombre,
          fecha,
        });

        // In-app (tipo RECORDATORIO — el enum TipoNotificacion no incluye VACUNA;
        // se evita una migración extra y el mensaje deja claro que es una vacuna).
        if (prop?.id) {
          await this.notificacionService.enviar({
            usuario_id: prop.id,
            tipo: "RECORDATORIO",
            titulo: "Recordatorio de vacuna",
            mensaje: `La vacuna "${hv.vacuna.nombre}" de ${mascota} está próxima a vencer (próxima dosis: ${fecha}). Agenda una cita.`,
          });
        }
        enviados++;
      } catch (err: any) {
        console.error(
          "[Vacunas] Fallo al procesar un recordatorio (se continúa):",
          err?.message || err,
        );
      }
    }
    return { revisados: vencen.length, enviados };
  }
}
