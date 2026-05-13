import { Router } from 'express';
import * as ctrl from '../controllers/chatbot.controller';

const router = Router();

router.post('/emergencia', ctrl.handleEmergencyChat);

export default router;
