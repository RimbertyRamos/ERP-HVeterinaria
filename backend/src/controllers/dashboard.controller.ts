import { Request, Response } from 'express';
import * as svc from '../services/dashboard.service';

export const getKpis = async (_: Request, res: Response) => {
  try {
    res.json(await svc.getKpis());
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Error' });
  }
};
