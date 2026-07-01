import { Router } from "express";
import { agendaController, roleMiddleware } from "../container";
import { validate } from "../middlewares/validate.middleware";
import {
  createCitaSchema,
  updateCitaSchema,
  solicitarCitaSchema,
  updateEstadoCitaSchema,
} from "../schemas/agenda.schema";

const router = Router();

// Disponibilidad de horarios: la consultan tanto el personal como el propietario.
router.get("/disponibilidad", agendaController.getDisponibilidad);

// El propietario (CLIENTE) puede ver y solicitar citas para SUS mascotas.
// Estas rutas literales van antes que las de personal/parámetros.
router.get("/mis-citas", agendaController.getMisCitas);
router.get("/mis-mascotas", agendaController.getMisMascotas);
router.post(
  "/solicitar",
  validate(solicitarCitaSchema),
  agendaController.solicitarCita,
);

// ── Rutas de personal (recepción / admin / veterinario) ──────────────────────
const soloPersonal = roleMiddleware.require(
  "Recepcionista",
  "Admin",
  "Veterinario",
);

router.get("/solicitudes", soloPersonal, agendaController.getSolicitudes);
router.get("/", soloPersonal, agendaController.getCitas);
router.post(
  "/",
  soloPersonal,
  validate(createCitaSchema),
  agendaController.createCita,
);
router.put(
  "/:id",
  soloPersonal,
  validate(updateCitaSchema),
  agendaController.updateCita,
);
router.put(
  "/:id/estado",
  soloPersonal,
  validate(updateEstadoCitaSchema),
  agendaController.updateEstado,
);
// Check-in convierte cita en ficha de atención: toma id de params + actor del JWT,
// NO usa req.body → sin validate()
router.post("/:id/checkin", soloPersonal, agendaController.checkIn);
router.delete("/:id", soloPersonal, agendaController.deleteCita);

export default router;
