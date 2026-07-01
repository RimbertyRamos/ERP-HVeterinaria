import { Router } from "express";
import {
  historiaController,
  authMiddleware,
  roleMiddleware,
} from "../container";
import { validate } from "../middlewares/validate.middleware";
import {
  createHistoriaSchema,
  updateHistoriaSchema,
} from "../schemas/historia.schema";

const router = Router();

// Todas requieren sesión válida
router.use(authMiddleware.authenticate);

// Lectura (cualquier usuario logueado puede consultar el historial)
router.get("/", historiaController.list);
router.get("/:id", historiaController.getById);

// Escritura: solo personal clínico
router.post(
  "/",
  roleMiddleware.require("Veterinario", "Admin"),
  validate(createHistoriaSchema),
  historiaController.create,
);
router.patch(
  "/:id",
  roleMiddleware.require("Veterinario", "Admin"),
  validate(updateHistoriaSchema),
  historiaController.update,
);
// finalizar = transición de estado: toma id de params + actor del JWT, NO usa
// req.body → sin validate()
router.post(
  "/:id/finalizar",
  roleMiddleware.require("Veterinario", "Admin"),
  historiaController.finalizar,
);
router.delete(
  "/:id",
  roleMiddleware.require("Veterinario", "Admin"),
  historiaController.remove,
);

export default router;
