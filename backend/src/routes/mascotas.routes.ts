import { Router } from "express";
import { mascotaController } from "../container";
import { validate } from "../middlewares/validate.middleware";
import {
  createMascotaSchema,
  updateMascotaSchema,
} from "../schemas/mascota.schema";

const router = Router();

router.post("/", validate(createMascotaSchema), mascotaController.createMascota);
router.get("/", mascotaController.getMascotas);
router.get("/:id", mascotaController.getMascotaById);
router.put("/:id", validate(updateMascotaSchema), mascotaController.updateMascota);
router.delete("/:id", mascotaController.deleteMascota);

export default router;
