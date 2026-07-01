import { z } from "zod";
import { LEN, textoCorto, numeroNullableOpcional } from "./common";

/**
 * Item de vacuna — UNIÓN que replica HistoriaService.normalizarVacunas:
 * acepta un string (nombre) O un objeto. El objeto se modela LAXO a propósito
 * (.passthrough(), `nombre` opcional) porque:
 *  - el front nuevo manda { nombre, fecha_aplicacion? },
 *  - PERO HistoriaClinicaFicha reenvía, sin togglear, el array ORIGINAL
 *    HistoriaVacuna[] cuyos objetos son { id, vacuna_id, fecha_aplicacion,
 *    vacuna: { nombre } } — sin `nombre` en la raíz. El service ya tolera ambos
 *    (los que no tienen nombre en raíz se descartan). Si exigiéramos `nombre`,
 *    daríamos 400 en el caso común de guardar sin tocar vacunas.
 */
const vacunaItem = z.union([
  z.string().max(LEN.corto),
  z
    .object({
      nombre: z.string().max(LEN.corto).optional(),
      fecha_aplicacion: z
        .union([z.string(), z.coerce.date()])
        .nullable()
        .optional(),
      // RF14: próxima dosis por ítem (opcional).
      proxima_dosis: z
        .union([z.string(), z.coerce.date()])
        .nullable()
        .optional(),
    })
    .passthrough(),
]);

// Evolución de tratamiento: el service solo lee `descripcion` y `fecha` (filtra las
// vacías). Se deja passthrough para tolerar objetos existentes con id/historia_id.
const evolucionItem = z
  .object({
    descripcion: z.string().max(LEN.largo).optional(),
    fecha: z.union([z.string(), z.coerce.date()]).nullable().optional(),
  })
  .passthrough();

// Los ~28 campos editables (HistoriaService.CAMPOS_EDITABLES): TODOS opcionales.
// El service hace whitelisting con pickCampos, así que el .strip por defecto basta.
const camposEditables = {
  propietario_nombre: textoCorto().optional(),
  domicilio: z.string().max(LEN.medio).optional(),
  telefono: textoCorto().optional(),
  celular: textoCorto().optional(),
  edad: textoCorto().optional(),
  peso: numeroNullableOpcional(),
  motivo_consulta: z.string().max(LEN.medio).optional(),
  vacunas_otras: z.string().max(LEN.medio).optional(),
  desparasitacion: z.boolean().optional(),
  desparasitacion_cuando: z.string().max(LEN.medio).optional(),
  enfermedades_previas: z.string().max(LEN.largo).optional(),
  intervenciones_previas: z.string().max(LEN.largo).optional(),
  estado_general: z.string().max(LEN.medio).optional(),
  apetito: z.string().max(LEN.medio).optional(),
  hidratacion: z.string().max(LEN.medio).optional(),
  mucosa: z.string().max(LEN.medio).optional(),
  ap_digestivo: z.string().max(LEN.largo).optional(),
  ap_genitourinario: z.string().max(LEN.largo).optional(),
  ap_respiratorio: z.string().max(LEN.largo).optional(),
  temperatura: numeroNullableOpcional(),
  fc: numeroNullableOpcional(),
  fr: numeroNullableOpcional(),
  observacion_clinica: z.string().max(LEN.largo).optional(),
  pruebas_complementarias: z.string().max(LEN.largo).optional(),
  diagnostico_presuntivo: z.string().max(LEN.largo).optional(),
  diagnostico_confirmativo: z.string().max(LEN.largo).optional(),
  pronostico: z.string().max(LEN.medio).optional(),
  tratamiento: z.string().max(LEN.largo).optional(),
  vacunas: z.array(vacunaItem).optional(),
  evoluciones: z.array(evolucionItem).optional(),
  // RF14: próxima dosis "de lote" aplicada a las vacunas registradas en esta
  // historia (no es columna de HistoriaClinica; el service la lee aparte). Debe
  // estar en el esquema para no ser descartada por el strip por defecto.
  proxima_dosis_vacunas: z.string().optional(),
};

/**
 * POST /historias — HistoriaService.create. Lo único obligatorio hoy es
 * mascota_id. ficha_id y atendido_por_id son opcionales (este último lo rellena
 * el service con el actor del JWT). created_by lo pone el service desde el JWT.
 */
export const createHistoriaSchema = z.object({
  mascota_id: z.string().min(1, "mascota_id es obligatorio"),
  ficha_id: z.string().nullable().optional(),
  atendido_por_id: z.string().nullable().optional(),
  ...camposEditables,
});

/**
 * PATCH /historias/:id — HistoriaService.update. El front manda `...form` (toda
 * la historia) por lo que llegan muchos campos no editables (id, folio, estado,
 * mascota, etc.): el strip por defecto los descarta, igual que pickCampos los
 * ignora hoy. Todo .partial(): el front solo edita algunos campos.
 */
export const updateHistoriaSchema = z
  .object({
    atendido_por_id: z.string().nullable().optional(),
    ...camposEditables,
  })
  .partial();
