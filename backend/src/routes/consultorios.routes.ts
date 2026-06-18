import { Router } from 'express';
import * as ctrl from '../controllers/consultorio.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Todas las rutas requieren sesión válida
router.use(authenticate);

// Lectura y cambio de estado operativo: cualquier usuario logueado
router.get('/', ctrl.getConsultorios);
router.put('/:id/estado', ctrl.updateEstado);

// Gestión del catálogo de salas (crear/editar/borrar): solo Administrador
router.post('/', requireRole('Admin'), ctrl.createConsultorio);
router.put('/:id', requireRole('Admin'), ctrl.updateConsultorio);
router.delete('/:id', requireRole('Admin'), ctrl.deleteConsultorio);

export default router;
