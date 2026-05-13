import { Request, Response } from 'express';
import * as svc from '../services/usuarios.service';

const id = (req: Request) => req.params['id'] as string;

export const getUsuarios = async (req: Request, res: Response) => {
  const { rol, search } = req.query as { rol?: string; search?: string };
  res.json(await svc.getUsuarios(rol, search));
};

export const getUsuarioById = async (req: Request, res: Response) => {
  const u = await svc.getUsuarioById(id(req));
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(u);
};

export const createUsuario = async (req: Request, res: Response) => {
  try {
    res.status(201).json(await svc.createUsuario(req.body));
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Error' });
  }
};

export const updateUsuario = async (req: Request, res: Response) => {
  try {
    res.json(await svc.updateUsuario(id(req), req.body));
  } catch {
    res.status(400).json({ error: 'Error al actualizar usuario' });
  }
};

export const deleteUsuario = async (req: Request, res: Response) => {
  await svc.deleteUsuario(id(req));
  res.json({ ok: true });
};
