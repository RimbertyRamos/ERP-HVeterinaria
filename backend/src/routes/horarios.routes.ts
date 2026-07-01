import { Router } from "express";
import { horarioController, permissionMiddleware } from "../container";
import { validate } from "../middlewares/validate.middleware";
import {
  crearHorarioSchema,
  actualizarHorarioSchema,
} from "../schemas/horario.schema";

// La sesión se valida al montar el router en index.ts. Toda la programación
// horaria requiere el permiso "gestionar_horarios" (asignado al ADMIN en el seed).
const router = Router();

const gestionar = permissionMiddleware.require("gestionar_horarios");

router.get("/", gestionar, horarioController.listar);
router.post(
  "/",
  gestionar,
  validate(crearHorarioSchema),
  horarioController.crear,
);
router.put(
  "/:id",
  gestionar,
  validate(actualizarHorarioSchema),
  horarioController.actualizar,
);
router.delete("/:id", gestionar, horarioController.eliminar);

export default router;
