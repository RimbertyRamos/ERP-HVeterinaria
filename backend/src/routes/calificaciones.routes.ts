import { Router } from "express";
import { calificacionController, permissionMiddleware } from "../container";
import { validate } from "../middlewares/validate.middleware";
import { createCalificacionSchema } from "../schemas/calificacion.schema";

const router = Router();

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
