import { z } from "zod";
import {
  email,
  passwordOpcional,
  textoCorto,
  fechaOpcional,
  numeroNoNegativoOpcional,
} from "./common";

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

// CreateMascotaDto.
const mascotaSchema = z.object({
  nombre: textoCorto().min(1, "El nombre de la mascota es obligatorio"),
  especie_id: z.string().min(1, "La especie es obligatoria"),
  raza_id: z.string().optional(),
  color_id: z.string().optional(),
  // Mascota.sexo es CHAR(1) en la BD.
  sexo: z.string().max(1, "El sexo debe ser un solo carácter").optional(),
  esterilizado: z.boolean().optional(),
  peso_actual: numeroNoNegativoOpcional(),
  fecha_nacimiento: fechaOpcional(),
  alergias: z.array(alergiaSchema).optional(),
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
    raza_id: z.string(),
    color_id: z.string(),
    sexo: z.string().max(1, "El sexo debe ser un solo carácter"),
    esterilizado: z.boolean(),
    peso_actual: numeroNoNegativoOpcional(),
    fecha_nacimiento: fechaOpcional(),
  })
  .partial();
