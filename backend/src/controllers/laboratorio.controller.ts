import { Request, Response } from 'express';
import * as svc from '../services/laboratorio.service';

const id = (req: Request) => req.params['id'] as string;

export const getOrdenes = async (req: Request, res: Response) => {
  res.json(await svc.getOrdenes(req.query.estado as string | undefined));
};

export const getOrdenById = async (req: Request, res: Response) => {
  const orden = await svc.getOrdenById(id(req));
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
  res.json(orden);
};

export const createOrden = async (req: Request, res: Response) => {
  try {
    res.status(201).json(await svc.createOrden(req.body));
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Error' });
  }
};

export const updateEstado = async (req: Request, res: Response) => {
  try {
    res.json(await svc.updateEstadoOrden(id(req), req.body.estado));
  } catch {
    res.status(400).json({ error: 'Error al actualizar estado' });
  }
};

export const cargarResultado = async (req: Request, res: Response) => {
  try {
    res.json(await svc.cargarResultado(id(req), req.body));
  } catch {
    res.status(400).json({ error: 'Error al cargar resultado' });
  }
};
