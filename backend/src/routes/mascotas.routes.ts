import { Router } from 'express';
import * as mascotaController from '../controllers/mascota.controller';

const router = Router();

router.post('/', mascotaController.createMascota);
router.get('/', mascotaController.getMascotas);
router.get('/:id', mascotaController.getMascotaById);
router.put('/:id', mascotaController.updateMascota);
router.delete('/:id', mascotaController.deleteMascota);

export default router;
