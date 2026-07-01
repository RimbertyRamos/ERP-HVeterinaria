import { z } from "zod";
import { LEN, textoCorto } from "./common";

/**
 * POST /landing/leads — LandingService.crearLead. Campos opcionales (el service
 * exige nombre ≥2 y email válido por su cuenta). IMPORTANTE: se incluye `website`
 * (campo honeypot anti-bot) en el esquema para que NO sea descartado por el strip,
 * porque el controller lo lee DESPUÉS de la validación para detectar bots.
 */
export const crearLeadSchema = z.object({
  nombre: textoCorto().optional(),
  // Email laxo (no .email()) porque el service ya valida formato y devuelve un
  // mensaje propio; aquí solo acotamos longitud para no romper su contrato.
  email: z.string().max(254).optional(),
  telefono: textoCorto().optional(),
  empresa: textoCorto().optional(),
  mensaje: z.string().max(LEN.medio).optional(),
  origen: textoCorto().optional(),
  website: z.string().max(LEN.corto).optional(), // honeypot — debe sobrevivir al strip
});

/**
 * POST /landing/checkout — crearCheckout: { plan, email? }. El controller también
 * lee `website` (honeypot) tras la validación → se incluye en el esquema.
 */
export const crearCheckoutSchema = z.object({
  plan: textoCorto().optional(),
  email: z.string().max(254).optional(),
  website: z.string().max(LEN.corto).optional(), // honeypot — debe sobrevivir al strip
});
