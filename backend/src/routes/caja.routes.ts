import { Router } from "express";
import { cajaController, authMiddleware, roleMiddleware } from "../container";
import { validate } from "../middlewares/validate.middleware";
import {
  cobrarFichaSchema,
  ventaDirectaSchema,
  anularReciboSchema,
  registrarCierreSchema,
} from "../schemas/caja.schema";

const router = Router();

// Todas las rutas de caja requieren sesión válida
router.use(authMiddleware.authenticate);

// Lectura: cualquier usuario logueado
router.get("/pendientes", cajaController.getPendientes);
router.get("/recibos", cajaController.getRecibos);
router.get("/recibos/:id", cajaController.getReciboById);

// Escritura: solo Cajero o Administrador
router.post(
  "/recibos",
  roleMiddleware.require("Cajero", "Admin"),
  validate(cobrarFichaSchema),
  cajaController.cobrarFicha,
);
router.post(
  "/venta-directa",
  roleMiddleware.require("Cajero", "Admin"),
  validate(ventaDirectaSchema),
  cajaController.ventaDirecta,
);
router.put(
  "/recibos/:id/anular",
  roleMiddleware.require("Cajero", "Admin"),
  validate(anularReciboSchema),
  cajaController.anularRecibo,
);

// Arqueo y cierre de caja: solo Cajero o Administrador
router.get(
  "/arqueo",
  roleMiddleware.require("Cajero", "Admin"),
  cajaController.getArqueo,
);
router.get(
  "/cierres",
  roleMiddleware.require("Cajero", "Admin"),
  cajaController.getCierres,
);
// Reporte de ingresos exportable (CSV/PDF): mismo acceso que la caja.
router.get(
  "/reporte",
  roleMiddleware.require("Cajero", "Admin"),
  cajaController.reporte,
);
router.post(
  "/cierres",
  roleMiddleware.require("Cajero", "Admin"),
  validate(registrarCierreSchema),
  cajaController.registrarCierre,
);

export default router;
