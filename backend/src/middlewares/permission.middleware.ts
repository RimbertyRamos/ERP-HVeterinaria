import { Request, Response, NextFunction } from "express";
import { RoleService } from "../services/role.service";

/**
 * Middleware de autorización basado en PERMISOS (RBAC fino).
 *
 * Complementa a RoleMiddleware (que autoriza por NOMBRE de rol). Aquí se autoriza
 * por código de permiso, leyendo de la tabla `RolePermiso` a través de RoleService.
 * Es la versión normalizada que sustituye al antiguo chequeo sobre `Role.permisos`
 * (JSON). Útil cuando una acción debe permitirse según un permiso concreto
 * (p. ej. `gestionar_caja`) en lugar de un rol fijo.
 *
 * REQUISITO: `require()` DEBE ir después de `authMiddleware.authenticate`, que es
 * quien coloca `req.user.rol_id` a partir del JWT.
 */
export class PermissionMiddleware {
  constructor(private readonly roleService: RoleService) {}

  require = (codigo: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user?.rol_id) {
        return res.status(401).json({ error: "Token no proporcionado" });
      }

      const autorizado = await this.roleService.verificarPermiso(
        req.user.rol_id,
        codigo,
      );

      if (!autorizado) {
        return res
          .status(403)
          .json({ error: "No autorizado para esta acción" });
      }

      next();
    };
  };
}
