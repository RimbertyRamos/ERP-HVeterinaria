import { z } from "zod";

/**
 * Helpers reutilizables para los esquemas de validación.
 *
 * Reglas de longitud (máximos generosos, no rompen datos existentes):
 *  - textos cortos (nombre, código, título): 200
 *  - textos medios (motivo, descripción, comentario, mensaje, dirección): 1000
 *  - textos clínicos largos / observaciones: 5000
 */
export const LEN = {
  corto: 200,
  medio: 1000,
  largo: 5000,
} as const;

/** Texto corto opcional (≤200). */
export const textoCorto = (max = LEN.corto) => z.string().max(max);

/** Email con formato válido, normalizado (trim + lowercase), máx. 254. */
export const email = () =>
  z.string().trim().toLowerCase().email("Correo electrónico no válido").max(254);

/**
 * Contraseña requerida con la política BÁSICA ya existente en
 * PasswordService.validate(): mínimo 6 caracteres.
 */
export const passwordBasico = () =>
  z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(LEN.corto);

/**
 * Contraseña OPCIONAL que, igual que hoy en los services, se valida solo cuando
 * viene con contenido: cadena vacía = "usar default temporal", o bien ≥6.
 */
export const passwordOpcional = () =>
  z
    .string()
    .max(LEN.corto)
    .refine((v) => v.length === 0 || v.length >= 6, {
      message: "La contraseña debe tener al menos 6 caracteres",
    })
    .optional();

/**
 * Contraseña con la política REFORZADA ya existente en
 * PasswordService.validateStrong(): mínimo 8 + mayúscula + minúscula + número.
 */
export const passwordFuerte = () =>
  z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(LEN.corto)
    .regex(/[A-Z]/, "La contraseña debe incluir al menos una letra mayúscula")
    .regex(/[a-z]/, "La contraseña debe incluir al menos una letra minúscula")
    .regex(/[0-9]/, "La contraseña debe incluir al menos un número");

/**
 * Fecha opcional que acepta string ISO (la forma en que el front la envía) y la
 * coacciona a Date. Cadena vacía o null se tratan como "sin fecha" (undefined),
 * replicando el `valor ? new Date(valor) : undefined` de los services — así no
 * generamos un 400 falso cuando el front manda "".
 */
export const fechaOpcional = () =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.date().optional(),
  );

/** Entero ≥0 opcional, coaccionado desde string. */
export const enteroNoNegativoOpcional = () =>
  z.coerce.number().int().min(0).optional();

/** Número ≥0 opcional, coaccionado desde string. */
export const numeroNoNegativoOpcional = () => z.coerce.number().min(0).optional();

/**
 * Número clínico/monetario opcional que ADMITE null. El front a veces envía null
 * para "limpiar" un campo (p. ej. HistoriaClinicaFicha.num() devuelve null cuando
 * el input está vacío) — hay que preservar ese null tal cual (el service lo copia
 * a la BD). "" o undefined → ausente. ≥0, sin tope superior.
 */
export const numeroNullableOpcional = () =>
  z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v),
    z.coerce.number().min(0).nullable().optional(),
  );
