import { Router } from "express";
import { bitacoraController } from "../container";

// La autenticación y el permiso "bitacora.ver" se aplican al montar este router
// en routes/index.ts (authMiddleware.authenticate + permissionMiddleware.require).
const router = Router();

// Reporte y resumen ANTES de "/:id" para que no los capture como id.
router.get("/reporte", bitacoraController.reporte);
router.get("/resumen", bitacoraController.resumen);
router.get("/", bitacoraController.list);
router.get("/:id", bitacoraController.getById);

export default router;
