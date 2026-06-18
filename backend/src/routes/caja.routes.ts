import { Router } from 'express';
import * as ctrl from '../controllers/caja.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Todas las rutas de caja requieren sesión válida
router.use(authenticate);

// Lectura: cualquier usuario logueado
router.get('/pendientes', ctrl.getPendientes);
router.get('/recibos', ctrl.getRecibos);
router.get('/recibos/:id', ctrl.getReciboById);

// Escritura: solo Cajero o Administrador
router.post('/recibos', requireRole('Cajero', 'Admin'), ctrl.cobrarFicha);
router.post('/venta-directa', requireRole('Cajero', 'Admin'), ctrl.ventaDirecta);
router.put('/recibos/:id/anular', requireRole('Cajero', 'Admin'), ctrl.anularRecibo);

export default router;
