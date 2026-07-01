import { z } from "zod";
import { email, passwordOpcional, passwordFuerte, textoCorto } from "./common";

/**
 * POST /usuarios — UsuariosService.createUsuario: { nombre, email, password?,
 * telefono?, ci?, rol_id }. password es opcional (sin él se asigna un default
 * temporal); si viene con contenido se exige ≥6, igual que hoy.
 */
export const createUsuarioSchema = z.object({
  nombre: textoCorto().min(1, "El nombre es obligatorio"),
  email: email(),
  password: passwordOpcional(),
  telefono: textoCorto().optional(),
  ci: textoCorto().optional(),
  rol_id: z.string().min(1, "El rol es obligatorio"),
});

/**
 * PUT /usuarios/:id — UpdateUsuarioDto: todos los campos opcionales (.partial()).
 * El service hace prisma.update con lo que llegue.
 */
export const updateUsuarioSchema = z
  .object({
    nombre: textoCorto().min(1),
    email: email(),
    telefono: textoCorto(),
    ci: textoCorto(),
    rol_id: z.string().min(1),
    // Activar/desactivar el acceso del usuario (CAMBIO_ESTADO).
    activo: z.boolean(),
  })
  .partial();

/**
 * PATCH /perfil/password — changeMyPassword: { currentPassword, newPassword }.
 * La nueva contraseña usa la política reforzada (validateStrong). El "es distinta
 * de la actual" y "la actual es correcta" siguen validándose en el service.
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Debes indicar la contraseña actual"),
  newPassword: passwordFuerte(),
});
