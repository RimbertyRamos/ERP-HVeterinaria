import { z } from "zod";
import { email, passwordBasico, textoCorto } from "./common";

/**
 * POST /auth/register — AuthService.register espera { nombre, email, password,
 * telefono?, rol_id }. password se valida con la política básica (mín. 6).
 */
export const registerSchema = z.object({
  nombre: textoCorto().min(1, "El nombre es obligatorio"),
  email: email(),
  password: passwordBasico(),
  telefono: textoCorto().optional(),
  rol_id: z.string().min(1, "El rol es obligatorio"),
});

/**
 * POST /auth/login — AuthService.login espera { email, password }. La contraseña
 * solo se compara contra el hash, así que NO se exige longitud mínima aquí (un
 * password corto debe devolver 401, no 400).
 */
export const loginSchema = z.object({
  email: email(),
  password: z.string().min(1, "La contraseña es obligatoria"),
});
