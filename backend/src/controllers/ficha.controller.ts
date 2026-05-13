import { Request, Response } from 'express';
import * as svc from '../services/ficha.service';

const id = (req: Request) => req.params['id'] as string;

export const getFichas = async (req: Request, res: Response) => {
  const { estado, doctor_id, fecha } = req.query as Record<string, string>;
  res.json(await svc.getFichas({ estado, doctor_id, fecha }));
};

export const getFichaById = async (req: Request, res: Response) => {
  const ficha = await svc.getFichaById(id(req));
  if (!ficha) return res.status(404).json({ error: 'Ficha no encontrada' });
  res.json(ficha);
};

export const createFicha = async (req: Request, res: Response) => {
  try {
    res.status(201).json(await svc.createFicha(req.body));
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Error' });
  }
};

export const iniciarFicha = async (req: Request, res: Response) => {
  try { res.json(await svc.iniciarFicha(id(req), req.body)); }
  catch { res.status(400).json({ error: 'Error al iniciar ficha' }); }
};

export const completarFicha = async (req: Request, res: Response) => {
  try { res.json(await svc.completarFicha(id(req))); }
  catch { res.status(400).json({ error: 'Error al completar ficha' }); }
};

export const cancelarFicha = async (req: Request, res: Response) => {
  try { res.json(await svc.cancelarFicha(id(req))); }
  catch { res.status(400).json({ error: 'Error al cancelar ficha' }); }
};

export const updateFicha = async (req: Request, res: Response) => {
  try { res.json(await svc.updateFicha(id(req), req.body)); }
  catch { res.status(400).json({ error: 'Error al actualizar ficha' }); }
};

export const getSoap = async (req: Request, res: Response) => {
  const soap = await svc.getSoap(id(req));
  if (!soap) return res.status(404).json({ error: 'SOAP no encontrado' });
  res.json(soap);
};

export const upsertSoap = async (req: Request, res: Response) => {
  try { res.json(await svc.upsertSoap(id(req), req.body)); }
  catch { res.status(400).json({ error: 'Error al guardar SOAP' }); }
};

export const createReceta = async (req: Request, res: Response) => {
  try { res.status(201).json(await svc.createReceta(id(req), req.body)); }
  catch { res.status(400).json({ error: 'Error al crear receta' }); }
};

export const getConsumos = async (req: Request, res: Response) => {
  try { res.json(await svc.getConsumos(id(req))); }
  catch { res.status(500).json({ error: 'Error al obtener consumos' }); }
};

export const addConsumo = async (req: Request, res: Response) => {
  try { res.status(201).json(await svc.addConsumo(id(req), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message ?? 'Error al registrar consumo' }); }
};

export const removeConsumo = async (req: Request, res: Response) => {
  try {
    await svc.removeConsumo(req.params['consumoId'] as string);
    res.json({ ok: true });
  } catch { res.status(400).json({ error: 'Error al eliminar consumo' }); }
};
