import { Request, Response } from 'express';
import * as svc from '../services/farmacia.service';

export const getRecetasPendientes = async (_req: Request, res: Response) => {
  try { res.json(await svc.getRecetasPendientes()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const dispensarReceta = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const recetaId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    res.json(await svc.dispensarReceta(recetaId, user?.id ?? 'system'));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
};
