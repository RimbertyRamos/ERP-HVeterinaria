import { Router } from "express";
import {
  servicioController,
  authMiddleware,
  roleMiddleware,
} from "../container";
import { validate } from "../middlewares/validate.middleware";
import {
  createServicioSchema,
  updateServicioSchema,
} from "../schemas/servicio.schema";

const router = Router();

// Todas requieren sesión válida
router.use(authMiddleware.authenticate);

// Lectura del catálogo: cualquier usuario logueado (veterinario, recepción…)
router.get("/", servicioController.getServicios);

// Gestión del catálogo (crear/editar/eliminar): solo Administrador
router.post(
  "/",
  roleMiddleware.require("Admin"),
  validate(createServicioSchema),
  servicioController.createServicio,
);
router.put(
  "/:id",
  roleMiddleware.require("Admin"),
  validate(updateServicioSchema),
  servicioController.updateServicio,
);
router.delete(
  "/:id",
  roleMiddleware.require("Admin"),
  servicioController.deleteServicio,
);

export default router;
