import { Router } from 'express';
import * as ctrl from '../controllers/caja.controller';

const router = Router();

router.get('/pendientes', ctrl.getPendientes);
router.get('/recibos', ctrl.getRecibos);
router.post('/recibos', ctrl.cobrarFicha);
router.get('/recibos/:id', ctrl.getReciboById);
router.post('/venta-directa', ctrl.ventaDirecta);
router.put('/recibos/:id/anular', ctrl.anularRecibo);

export default router;
