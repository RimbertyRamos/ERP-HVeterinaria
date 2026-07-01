import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { ErrorHandler } from "../middlewares/error.middleware";
import { bitacora, metaBitacora } from "../services/bitacora.singleton";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly errors: ErrorHandler,
  ) {}

  register = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.register(req.body);
      void bitacora.registrar({
        ...metaBitacora(req),
        accion: "CREAR",
        entidad: "usuario",
        entidad_id: (result as any)?.user?.id ?? null,
        descripcion: `Registró al usuario ${req.body?.email ?? ""}`.trim(),
        datos_despues: req.body, // el service redacta password
      });
      res.status(201).json(result);
    } catch (err) {
      this.errors.e500(req, res, err);
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.login(req.body);
      const u: any = result.user;
      void bitacora.registrar({
        ...metaBitacora(req),
        usuario_id: u?.id ?? null,
        actor_email: u?.email ?? null,
        actor_nombre: u?.nombre ?? null,
        actor_rol: u?.rol?.nombre ?? null,
        accion: "LOGIN",
        descripcion: `Inicio de sesión de ${u?.email ?? "usuario"}`,
      });
      res.status(200).json(result);
    } catch (err) {
      // LOGIN_FALLIDO: sin usuario_id, con el email intentado (si vino).
      const email =
        typeof req.body?.email === "string" ? req.body.email : null;
      void bitacora.registrar({
        ...metaBitacora(req),
        usuario_id: null,
        actor_email: email,
        accion: "LOGIN_FALLIDO",
        descripcion: `Intento de inicio de sesión fallido${email ? ` para ${email}` : ""}`,
        exito: false,
      });
      this.errors.e500(req, res, err);
    }
  };

  logout = async (req: Request, res: Response) => {
    void bitacora.registrar({
      ...metaBitacora(req),
      accion: "LOGOUT",
      descripcion: "Cierre de sesión",
    });
    res.json({ ok: true });
  };
}
