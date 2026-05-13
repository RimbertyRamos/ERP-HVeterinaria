import { Request, Response } from 'express';
import * as svc from '../services/caja.service';

const id = (req: Request) => req.params['id'] as string;

export const getPendientes = async (_: Request, res: Response) => {
  res.json(await svc.getFichasPendientePago());
};

export const getRecibos = async (_: Request, res: Response) => {
  res.json(await svc.getRecibos());
};

export const getReciboById = async (req: Request, res: Response) => {
  const recibo = await svc.getReciboById(id(req));
  if (!recibo) return res.status(404).json({ error: 'Recibo no encontrado' });
  res.json(recibo);
};

export const cobrarFicha = async (req: Request, res: Response) => {
  try {
    res.status(201).json(await svc.cobrarFicha(req.body));
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Error al cobrar' });
  }
};

export const ventaDirecta = async (req: Request, res: Response) => {
  try {
    res.status(201).json(await svc.ventaDirecta(req.body));
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Error al procesar venta directa' });
  }
};

export const anularRecibo = async (req: Request, res: Response) => {
  try {
    const { motivo_anulacion } = req.body;
    res.json(await svc.anularRecibo(id(req), motivo_anulacion));
  } catch {
    res.status(400).json({ error: 'Error al anular recibo' });
  }
};
