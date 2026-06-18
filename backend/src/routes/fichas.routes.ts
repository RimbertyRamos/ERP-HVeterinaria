import { Router } from 'express';
import * as ctrl from '../controllers/ficha.controller';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.get('/', ctrl.getFichas);
// Crear ficha: solo personal que registra pacientes (resto del flujo clínico queda solo con authenticate)
router.post('/', requireRole('Recepcionista', 'Admin', 'Veterinario'), ctrl.createFicha);
router.get('/:id', ctrl.getFichaById);
router.put('/:id', ctrl.updateFicha);
router.put('/:id/iniciar', ctrl.iniciarFicha);
router.put('/:id/completar', ctrl.completarFicha);
router.put('/:id/cancelar', ctrl.cancelarFicha);

// SOAP anidado en ficha
router.get('/:id/soap', ctrl.getSoap);
router.post('/:id/soap', ctrl.upsertSoap);
router.put('/:id/soap', ctrl.upsertSoap);
router.post('/:id/receta', ctrl.createReceta);

// Consumos/insumos usados en consulta
router.get('/:id/consumos', ctrl.getConsumos);
router.post('/:id/consumos', ctrl.addConsumo);
router.delete('/:id/consumos/:consumoId', ctrl.removeConsumo);

export default router;
