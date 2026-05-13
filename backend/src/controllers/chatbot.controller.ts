import { Request, Response } from 'express';
import * as svc from '../services/chatbot.service';

export const handleEmergencyChat = async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensaje requerido' });

    const reply = await svc.getEmergencyAdvice(message, history);
    res.json({ reply });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
