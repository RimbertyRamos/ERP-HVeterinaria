import { Router } from 'express';
import * as ctrl from '../controllers/agenda.controller';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.get('/', ctrl.getCitas);
router.post('/', ctrl.createCita);
router.put('/:id', ctrl.updateCita);
router.put('/:id/estado', ctrl.updateEstado);
// Check-in convierte cita en ficha de atención: mismas restricciones que crear ficha
router.post('/:id/checkin', requireRole('Recepcionista', 'Admin', 'Veterinario'), ctrl.checkIn);
router.delete('/:id', ctrl.deleteCita);

export default router;
