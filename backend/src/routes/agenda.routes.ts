import { Router } from 'express';
import * as ctrl from '../controllers/agenda.controller';

const router = Router();

router.get('/', ctrl.getCitas);
router.post('/', ctrl.createCita);
router.put('/:id', ctrl.updateCita);
router.put('/:id/estado', ctrl.updateEstado);
router.post('/:id/checkin', ctrl.checkIn);
router.delete('/:id', ctrl.deleteCita);

export default router;
