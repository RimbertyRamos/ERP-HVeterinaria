import { Router } from 'express';
import authRoutes from './auth.routes';
import mascotasRoutes from './mascotas.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/mascotas', mascotasRoutes);


export default router;
