import { Router } from 'express';
import * as ctrl from '../controllers/laboratorio.controller';

const router = Router();

router.get('/', ctrl.getOrdenes);
router.post('/', ctrl.createOrden);
router.get('/:id', ctrl.getOrdenById);
router.put('/:id/estado', ctrl.updateEstado);
router.post('/:id/resultado', ctrl.cargarResultado);

export default router;
