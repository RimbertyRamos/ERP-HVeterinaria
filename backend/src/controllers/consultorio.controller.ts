import { Request, Response } from 'express';
import { ConsultorioEstado } from '@prisma/client';
import * as svc from '../services/consultorio.service';

export const getConsultorios = async (_: Request, res: Response) => {
  res.json(await svc.getConsultorios());
};

export const createConsultorio = async (req: Request, res: Response) => {
  try {
    res.status(201).json(await svc.createConsultorio(req.body));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ error: msg });
  }
};

export const updateEstado = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const { estado } = req.body;
    res.json(await svc.updateEstado(id, estado));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ error: msg });
  }
};

export const updateConsultorio = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const { nombre, especialidad, estado } = req.body;
    await svc.updateConsultorio(id, {
      ...(nombre !== undefined && { nombre }),
      ...(especialidad !== undefined && { especialidad }),
      ...(estado !== undefined && { estado: estado as ConsultorioEstado }),
    });
    res.json(await svc.getConsultorios().then(list => list.find(c => c.id === id)));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ error: msg });
  }
};

export const deleteConsultorio = async (req: Request, res: Response) => {
  await svc.deleteConsultorio(req.params['id'] as string);
  res.json({ ok: true });
};
