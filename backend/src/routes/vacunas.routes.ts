import { Router } from "express";
import { vacunaController, authMiddleware, roleMiddleware } from "../container";

const router = Router();

router.use(authMiddleware.authenticate);

// Barrido de vencimientos de vacunas — disparo manual o por cron externo.
// Solo Administrador (además del cron in-process que corre a diario).
router.post(
  "/revisar-vencimientos",
  roleMiddleware.require("Admin"),
  vacunaController.revisar,
);

export default router;
