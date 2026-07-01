import { Router } from "express";
import { fichaController, roleMiddleware } from "../container";
import { validate } from "../middlewares/validate.middleware";
import {
  createFichaSchema,
  iniciarFichaSchema,
  updateFichaSchema,
  upsertSoapSchema,
  addConsumoSchema,
  addServicioRealizadoSchema,
} from "../schemas/ficha.schema";

const router = Router();

router.get("/", fichaController.getFichas);
// Crear ficha: solo personal que registra pacientes (resto del flujo clínico queda solo con authenticate)
router.post(
  "/",
  roleMiddleware.require("Recepcionista", "Admin", "Veterinario"),
  validate(createFichaSchema),
  fichaController.createFicha,
);
router.get("/:id", fichaController.getFichaById);
router.put("/:id", validate(updateFichaSchema), fichaController.updateFicha);
router.put(
  "/:id/iniciar",
  validate(iniciarFichaSchema),
  fichaController.iniciarFicha,
);
// completar/cancelar son transiciones de estado SIN body (toman id de params) → sin validate()
router.put("/:id/completar", fichaController.completarFicha);
router.put("/:id/cancelar", fichaController.cancelarFicha);

// SOAP anidado en ficha
router.get("/:id/soap", fichaController.getSoap);
router.post("/:id/soap", validate(upsertSoapSchema), fichaController.upsertSoap);
router.put("/:id/soap", validate(upsertSoapSchema), fichaController.upsertSoap);

// Consumos/insumos usados en consulta
router.get("/:id/consumos", fichaController.getConsumos);
router.post(
  "/:id/consumos",
  validate(addConsumoSchema),
  fichaController.addConsumo,
);
router.delete("/:id/consumos/:consumoId", fichaController.removeConsumo);

// Servicios realizados durante la consulta
router.get("/:id/servicios", fichaController.getServiciosRealizados);
router.post(
  "/:id/servicios",
  validate(addServicioRealizadoSchema),
  fichaController.addServicioRealizado,
);
router.delete(
  "/:id/servicios/:servicioId",
  fichaController.removeServicioRealizado,
);

export default router;
