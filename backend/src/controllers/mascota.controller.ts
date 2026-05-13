import { Request, Response } from 'express';
import * as svc from '../services/mascota.service';

export const getMascotas = async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const propietario_id = req.query.propietario_id as string | undefined;
  res.json(await svc.getMascotas(search, propietario_id));
};

export const getMascotaById = async (req: Request, res: Response) => {
  const mascota = await svc.getMascotaById(req.params['id'] as string);
  if (!mascota) return res.status(404).json({ error: 'Mascota no encontrada' });
  res.json(mascota);
};

export const createMascota = async (req: Request, res: Response) => {
  try {
    res.status(201).json(await svc.createMascotaConPropietario(req.body));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al crear mascota';
    res.status(400).json({ error: msg });
  }
};

export const updateMascota = async (req: Request, res: Response) => {
  try {
    res.json(await svc.updateMascota(req.params['id'] as string, req.body));
  } catch {
    res.status(400).json({ error: 'Error al actualizar mascota' });
  }
};

export const deleteMascota = async (req: Request, res: Response) => {
  await svc.deleteMascota(req.params['id'] as string);
  res.json({ ok: true });
};
