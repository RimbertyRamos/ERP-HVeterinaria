import { PrismaClient, AccionBitacora, Prisma } from "@prisma/client";

/**
 * Evento de auditoría a registrar. Los datos_* aceptan cualquier objeto: se
 * redactan los secretos y se serializan a JSON (String) antes de persistir.
 */
export interface EventoBitacora {
  usuario_id?: string | null;
  actor_email?: string | null;
  actor_nombre?: string | null;
  actor_rol?: string | null;
  accion: AccionBitacora;
  entidad?: string | null;
  entidad_id?: string | null;
  descripcion: string;
  datos_antes?: unknown;
  datos_despues?: unknown;
  exito?: boolean;
  ip?: string | null;
  user_agent?: string | null;
  metodo_http?: string | null;
  ruta?: string | null;
}

export interface FiltrosBitacora {
  desde?: Date;
  hasta?: Date;
  usuario_id?: string;
  accion?: AccionBitacora;
  entidad?: string;
  exito?: boolean;
  texto?: string;
  page?: number;
  pageSize?: number;
}

// Claves cuyo valor NUNCA debe quedar registrado en la bitácora.
const CLAVES_SECRETAS =
  /(password|password_hash|contrasena|contraseña|token|apikey|api_key|secret|authorization|jwt)/i;
const REDACTADO = "[REDACTADO]";

export class BitacoraService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Redacta recursivamente los valores de claves sensibles (password, tokens…)
   * antes de serializar. Devuelve una copia; no muta la entrada.
   */
  static redactar(valor: unknown, profundidad = 0): unknown {
    if (valor == null || profundidad > 6) return valor;
    if (Array.isArray(valor)) {
      return valor.map((v) => BitacoraService.redactar(v, profundidad + 1));
    }
    if (typeof valor === "object") {
      const salida: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
        salida[k] = CLAVES_SECRETAS.test(k)
          ? REDACTADO
          : BitacoraService.redactar(v, profundidad + 1);
      }
      return salida;
    }
    return valor;
  }

  /** Serializa a JSON con secretos redactados; null si no hay datos. */
  private serializar(datos: unknown): string | null {
    if (datos == null) return null;
    try {
      if (typeof datos === "string") return datos;
      return JSON.stringify(BitacoraService.redactar(datos));
    } catch {
      return null;
    }
  }

  /**
   * Registra un evento de auditoría. FAIL-SAFE: cualquier error se traga con un
   * console.error — NUNCA lanza, para no romper jamás la operación principal.
   * Úsese en fire-and-forget: `void bitacora.registrar(...)`.
   */
  async registrar(evento: EventoBitacora): Promise<void> {
    try {
      // Enriquecer snapshots del actor si solo tenemos el id (best-effort).
      let { actor_email, actor_nombre } = evento;
      if (evento.usuario_id && (!actor_email || !actor_nombre)) {
        const u = await this.prisma.usuario.findUnique({
          where: { id: evento.usuario_id },
          select: { email: true, nombre: true },
        });
        actor_email = actor_email ?? u?.email ?? null;
        actor_nombre = actor_nombre ?? u?.nombre ?? null;
      }

      await this.prisma.bitacora.create({
        data: {
          usuario_id: evento.usuario_id ?? null,
          actor_email: actor_email ?? null,
          actor_nombre: actor_nombre ?? null,
          actor_rol: evento.actor_rol ?? null,
          accion: evento.accion,
          entidad: evento.entidad ?? null,
          entidad_id: evento.entidad_id ?? null,
          descripcion: evento.descripcion,
          datos_antes: this.serializar(evento.datos_antes),
          datos_despues: this.serializar(evento.datos_despues),
          exito: evento.exito ?? true,
          ip: evento.ip ?? null,
          user_agent: evento.user_agent ?? null,
          metodo_http: evento.metodo_http ?? null,
          ruta: evento.ruta ?? null,
        },
      });
    } catch (err: any) {
      // La auditoría jamás debe tumbar la operación de negocio.
      console.error("[Bitacora] No se pudo registrar el evento:", err?.message || err);
    }
  }

  // ── Consultas (solo lectura, para los endpoints protegidos) ─────────────────

  private buildWhere(f: FiltrosBitacora): Prisma.BitacoraWhereInput {
    const where: Prisma.BitacoraWhereInput = {};
    if (f.desde || f.hasta) {
      where.fecha_hora = {};
      if (f.desde) where.fecha_hora.gte = f.desde;
      if (f.hasta) where.fecha_hora.lte = f.hasta;
    }
    if (f.usuario_id) where.usuario_id = f.usuario_id;
    if (f.accion) where.accion = f.accion;
    if (f.entidad) where.entidad = f.entidad;
    if (typeof f.exito === "boolean") where.exito = f.exito;
    if (f.texto) {
      where.descripcion = { contains: f.texto, mode: "insensitive" };
    }
    return where;
  }

  /** Lista paginada server-side con filtros; orden fecha_hora desc. */
  async listar(f: FiltrosBitacora) {
    const page = Math.max(1, f.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, f.pageSize ?? 25));
    const where = this.buildWhere(f);
    const [items, total] = await Promise.all([
      this.prisma.bitacora.findMany({
        where,
        orderBy: { fecha_hora: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.bitacora.count({ where }),
    ]);
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  /** Todos los registros que cumplen el filtro (sin paginar) — para exportar. */
  async listarTodo(f: FiltrosBitacora) {
    return this.prisma.bitacora.findMany({
      where: this.buildWhere(f),
      orderBy: { fecha_hora: "desc" },
      take: 10000, // tope de seguridad para una exportación
    });
  }

  async getById(id: string) {
    return this.prisma.bitacora.findUnique({ where: { id } });
  }

  /** Estadísticas del rango: por acción, por actor y LOGIN_FALLIDO. */
  async resumen(f: FiltrosBitacora) {
    const where = this.buildWhere(f);
    const [porAccion, porUsuario, loginFallidos, total] = await Promise.all([
      this.prisma.bitacora.groupBy({
        by: ["accion"],
        where,
        _count: { _all: true },
      }),
      this.prisma.bitacora.groupBy({
        by: ["actor_nombre"],
        where,
        _count: { _all: true },
      }),
      this.prisma.bitacora.count({
        where: { ...where, accion: "LOGIN_FALLIDO" },
      }),
      this.prisma.bitacora.count({ where }),
    ]);
    return {
      total,
      login_fallidos: loginFallidos,
      por_accion: porAccion.map((r) => ({
        accion: r.accion,
        cantidad: r._count._all,
      })),
      por_usuario: porUsuario.map((r) => ({
        usuario: r.actor_nombre ?? "(sistema/anónimo)",
        cantidad: r._count._all,
      })),
    };
  }
}
