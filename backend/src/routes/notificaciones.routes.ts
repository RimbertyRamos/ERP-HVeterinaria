import { Router } from "express";
import { notificacionController } from "../container";

const router = Router();

// Notificaciones del usuario autenticado (la sesión se valida al montar el router).
router.get("/", notificacionController.listar);
router.patch("/:id/leida", notificacionController.marcarLeida);

export default router;
