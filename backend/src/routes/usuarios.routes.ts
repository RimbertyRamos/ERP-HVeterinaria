import { Router } from "express";
import { usuariosController } from "../container";
import { validate } from "../middlewares/validate.middleware";
import {
  createUsuarioSchema,
  updateUsuarioSchema,
} from "../schemas/usuarios.schema";

const router = Router();

router.get("/", usuariosController.getUsuarios);
router.post("/", validate(createUsuarioSchema), usuariosController.createUsuario);
router.get("/:id", usuariosController.getUsuarioById);
router.put(
  "/:id",
  validate(updateUsuarioSchema),
  usuariosController.updateUsuario,
);
router.delete("/:id", usuariosController.deleteUsuario);

export default router;
