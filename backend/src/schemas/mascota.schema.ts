import { z } from "zod";
import {
  email,
  passwordOpcional,
  textoCorto,
  fechaOpcional,
  numeroNoNegativoOpcional,
} from "./common";

// Query del listado paginado (GET /mascotas?q&page&pageSize). Se valida con
// .safeParse en el controller (el middleware validate() opera sobre req.body).
// El clamp de pageSize a 100 lo hace el service ("se limita", no rechaza).
const vacioUndef = (v: unknown) => (v === "" || v == null ? undefined : v);
export const mascotaListQuerySchema = z.object({
  q: z.preprocess(vacioUndef, z.string().max(200).optional()),
  page: z.preprocess(vacioUndef, z.coerce.number().int().optional()),
  pageSize: z.preprocess(vacioUndef, z.coerce.number().int().optional()),
});

// Datos del propietario embebido (CreatePropietarioDto). Solo se usa cuando no se
// envía propietario_id; la regla "propietario_id O propietario" la sigue
// validando MascotaService.
const propietarioSchema = z.object({
  nombre: textoCorto().min(1, "El nombre del propietario es obligatorio"),
  email: email(),
  telefono: textoCorto().optional(),
  ci: textoCorto().optional(),
  password: passwordOpcional(),
});

// Alergia embebida (PacienteAlergia): { alergia_id, severidad }.
const alergiaSchema = z.object({
  alergia_id: z.string().min(1),
  severidad: textoCorto(),
});

// CreateMascotaDto. La especie puede llegar por id (catálogo) o por nombre
// (opción "Otra…" del formulario: el service la crea en el catálogo al vuelo,
// mismo patrón connectOrCreate que las vacunas de la historia clínica).
const mascotaSchema = z
  .object({
    nombre: textoCorto().min(1, "El nombre de la mascota es obligatorio"),
    especie_id: z.string().optional(),
    especie_nombre: textoCorto().optional(),
    raza_id: z.string().optional(),
    raza_nombre: textoCorto().optional(),
    color_id: z.string().optional(),
    // Mascota.sexo es CHAR(1) en la BD.
    sexo: z.string().max(1, "El sexo debe ser un solo carácter").optional(),
    esterilizado: z.boolean().optional(),
    peso_actual: numeroNoNegativoOpcional(),
    fecha_nacimiento: fechaOpcional(),
    alergias: z.array(alergiaSchema).optional(),
  })
  .refine((m) => m.especie_id?.trim() || m.especie_nombre?.trim(), {
    message: "La especie es obligatoria",
    path: ["especie_id"],
  });

/**
 * POST /mascotas — MascotaService.createMascotaConPropietario:
 * { mascota, propietario?, propietario_id? }.
 */
export const createMascotaSchema = z.object({
  mascota: mascotaSchema,
  propietario: propietarioSchema.optional(),
  propietario_id: z.string().optional(),
});

/**
 * PUT /mascotas/:id — UpdateMascotaDto (campos sueltos, .partial()).
 */
export const updateMascotaSchema = z
  .object({
    nombre: textoCorto().min(1),
    especie_id: z.string().min(1),
    especie_nombre: textoCorto(),
    raza_nombre: textoCorto(),
    // null = quitar la raza/color (p. ej. al cambiar de especie).
    raza_id: z.string().nullable(),
    color_id: z.string().nullable(),
    sexo: z.string().max(1, "El sexo debe ser un solo carácter"),
    esterilizado: z.boolean(),
    peso_actual: numeroNoNegativoOpcional(),
    fecha_nacimiento: fechaOpcional(),
  })
  .partial();
