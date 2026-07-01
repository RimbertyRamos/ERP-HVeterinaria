import { Router } from "express";
import { catalogoController, permissionMiddleware } from "../container";
import { validate } from "../middlewares/validate.middleware";
import {
  especieSchema,
  createRazaSchema,
  updateRazaSchema,
} from "../schemas/catalogo.schema";

const router = Router();

// Lectura: cualquier usuario logueado (la sesión se valida al montar el router).
router.get("/especies", catalogoController.getEspecies);
router.get("/razas", catalogoController.getRazas);
router.get("/colores", catalogoController.getColores);
router.get("/alergias", catalogoController.getAlergias);
router.get("/servicios", catalogoController.getServicios);
router.get("/categorias", catalogoController.getCategorias);
router.get("/roles", catalogoController.getRoles);
router.get("/veterinarios", catalogoController.getVeterinarios);
router.get("/propietarios", catalogoController.getPropietarios);

// Gestión de catálogos base (crear/editar/eliminar especies y razas): requiere el
// permiso "gestionar_catalogos" (asignado al ADMIN en el seed) — no se hardcodea el rol.
const gestionar = permissionMiddleware.require("gestionar_catalogos");

router.post(
  "/especies",
  gestionar,
  validate(especieSchema),
  catalogoController.createEspecie,
);
router.put(
  "/especies/:id",
  gestionar,
  validate(especieSchema),
  catalogoController.updateEspecie,
);
router.delete("/especies/:id", gestionar, catalogoController.deleteEspecie);

router.post(
  "/razas",
  gestionar,
  validate(createRazaSchema),
  catalogoController.createRaza,
);
router.put(
  "/razas/:id",
  gestionar,
  validate(updateRazaSchema),
  catalogoController.updateRaza,
);
router.delete("/razas/:id", gestionar, catalogoController.deleteRaza);

export default router;
