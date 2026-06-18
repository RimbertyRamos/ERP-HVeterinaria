import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.post('/register', authenticate, requireRole('Admin'), register);
router.post('/login', login);

export default router;
