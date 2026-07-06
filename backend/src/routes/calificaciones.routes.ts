import { Router } from "express";
import {
  calificacionController,
  permissionMiddleware,
  roleMiddleware,
} from "../container";
import { validate } from "../middlewares/validate.middleware";
import { createCalificacionSchema } from "../schemas/calificacion.schema";

const router = Router();

// Panel de satisfacción (promedios + comentarios recientes): solo ADMIN —
// es información de gestión para la toma de decisiones.
router.get(
  "/resumen",
  roleMiddleware.require("Admin"),
  calificacionController.resumen,
);

// Crear calificación: requiere el permiso `calificar_servicio` (rol CLIENTE).
// Las reglas de negocio (ser el propietario de la mascota y ficha COMPLETADA)
// se validan en CalificacionService.
router.post(
  "/",
  permissionMiddleware.require("calificar_servicio"),
  validate(createCalificacionSchema),
  calificacionController.registrar,
);

// Promedio por servicio: cualquier usuario autenticado.
router.get(
  "/servicio/:servicioId/promedio",
  calificacionController.promedioPorServicio,
);

export default router;
