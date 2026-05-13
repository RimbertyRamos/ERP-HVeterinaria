import { Router } from 'express';
import * as ctrl from '../controllers/farmacia.controller';

const router = Router();

router.get('/recetas', ctrl.getRecetasPendientes);
router.put('/recetas/:id/dispensar', ctrl.dispensarReceta);

export default router;
