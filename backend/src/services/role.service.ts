import { PrismaClient } from "@prisma/client";

/**
 * Servicio de roles y permisos (RBAC normalizado).
 *
 * Reemplaza la verificación contra el antiguo `Role.permisos Json?` por consultas
 * a la tabla intermedia `RolePermiso`. Un rol tiene un permiso si existe una fila
 * que enlaza su `role_id` con el `Permiso.codigo` solicitado. El rol ADMIN no se
 * trata como caso especial: en el seed se le asignan TODAS las filas de permiso,
 * de modo que `verificarPermiso` funciona de forma uniforme para todos los roles.
 */
export class RoleService {
  constructor(private readonly prisma: PrismaClient) {}

  /** ¿El rol indicado tiene asignado el permiso con este código? */
  async verificarPermiso(rolId: string, codigo: string): Promise<boolean> {
    const count = await this.prisma.rolePermiso.count({
      where: { role_id: rolId, permiso: { codigo } },
    });
    return count > 0;
  }

  /** Lista de códigos de permiso asignados a un rol (útil para el frontend). */
  async getPermisos(rolId: string): Promise<string[]> {
    const filas = await this.prisma.rolePermiso.findMany({
      where: { role_id: rolId },
      select: { permiso: { select: { codigo: true } } },
    });
    return filas.map((f) => f.permiso.codigo);
  }
}
