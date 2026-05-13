import { Router } from 'express';
import * as ctrl from '../controllers/consultorio.controller';

const router = Router();

router.get('/', ctrl.getConsultorios);
router.post('/', ctrl.createConsultorio);
router.put('/:id/estado', ctrl.updateEstado);
router.put('/:id', ctrl.updateConsultorio);
router.delete('/:id', ctrl.deleteConsultorio);

export default router;
