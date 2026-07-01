import { Request, Response } from "express";
import { UsuariosService } from "../services/usuarios.service";
import { ErrorHandler } from "../middlewares/error.middleware";
import { getUserId } from "../middlewares/auth.middleware";
import { bitacora, metaBitacora } from "../services/bitacora.singleton";

export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly errors: ErrorHandler,
  ) {}

  getUsuarios = async (req: Request, res: Response) => {
    try {
      const { rol, search } = req.query as { rol?: string; search?: string };
      const usuarios = await this.usuariosService.getUsuarios(rol, search);
      res.json(usuarios);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  getUsuarioById = async (req: Request, res: Response) => {
    try {
      const usuario = await this.usuariosService.getUsuarioById(
        req.params.id as string,
      );
      if (!usuario) return this.errors.e404(req, res);
      res.json(usuario);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  createUsuario = async (req: Request, res: Response) => {
    try {
      const usuario = await this.usuariosService.createUsuario(req.body);
      void bitacora.registrar({
        ...metaBitacora(req),
        accion: "CREAR",
        entidad: "usuario",
        entidad_id: (usuario as any)?.id ?? null,
        descripcion: `Creó al usuario ${req.body?.email ?? ""}`.trim(),
        datos_despues: req.body, // el service redacta password
      });
      res.status(201).json(usuario);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  updateUsuario = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const antes: any = await this.usuariosService.getUsuarioById(id);
      const usuario = await this.usuariosService.updateUsuario(id, req.body);

      const rolCambio =
        !!req.body?.rol_id && !!antes?.rol?.id && req.body.rol_id !== antes.rol.id;
      const estadoCambio = typeof req.body?.activo === "boolean";
      const etiqueta = antes?.email ?? id;

      void bitacora.registrar({
        ...metaBitacora(req),
        accion: rolCambio
          ? "CAMBIO_ROL"
          : estadoCambio
            ? "CAMBIO_ESTADO"
            : "ACTUALIZAR",
        entidad: "usuario",
        entidad_id: id,
        descripcion: rolCambio
          ? `Cambió el rol del usuario ${etiqueta}`
          : estadoCambio
            ? `Cambió el estado (activo=${req.body.activo}) del usuario ${etiqueta}`
            : `Actualizó al usuario ${etiqueta}`,
        datos_antes: antes,
        datos_despues: usuario,
      });
      res.json(usuario);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  deleteUsuario = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const antes: any = await this.usuariosService.getUsuarioById(id);
      await this.usuariosService.deleteUsuario(id);
      void bitacora.registrar({
        ...metaBitacora(req),
        accion: "ELIMINAR",
        entidad: "usuario",
        entidad_id: id,
        descripcion: `Eliminó al usuario ${antes?.email ?? id}`,
        datos_antes: antes,
      });
      res.json({ ok: true });
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  /** Cambia la contraseña del usuario autenticado (cualquier rol). */
  changeMyPassword = async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { currentPassword, newPassword } = req.body as {
        currentPassword?: string;
        newPassword?: string;
      };
      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "Debes indicar la contraseña actual y la nueva" });
      }
      const result = await this.usuariosService.changeOwnPassword(
        userId,
        currentPassword,
        newPassword,
      );
      void bitacora.registrar({
        ...metaBitacora(req),
        accion: "CAMBIO_PASSWORD",
        entidad: "usuario",
        entidad_id: userId,
        descripcion: "Cambió su propia contraseña",
      });
      res.json(result);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };
}
