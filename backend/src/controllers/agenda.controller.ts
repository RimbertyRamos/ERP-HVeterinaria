import { Request, Response } from 'express';
import * as svc from '../services/agenda.service';

export const getCitas = async (req: Request, res: Response) => {
  try {
    const { fecha, doctor_id } = req.query;
    res.json(await svc.getCitas(fecha as string, doctor_id as string));
  } catch { res.status(500).json({ error: 'Error al obtener citas' }); }
};

export const createCita = async (req: Request, res: Response) => {
  try { res.status(201).json(await svc.createCita(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message ?? 'Error al crear cita' }); }
};

export const updateCita = async (req: Request, res: Response) => {
  try { res.json(await svc.updateCita(req.params.id as string, req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message ?? 'Error al actualizar cita' }); }
};

export const updateEstado = async (req: Request, res: Response) => {
  try {
    const { estado } = req.body;
    res.json(await svc.updateEstadoCita(req.params.id as string, estado));
  } catch { res.status(400).json({ error: 'Error al actualizar estado' }); }
};

export const deleteCita = async (req: Request, res: Response) => {
  try {
    await svc.deleteCita(req.params.id as string);
    res.status(204).send();
  } catch { res.status(400).json({ error: 'Error al eliminar cita' }); }
};

export const checkIn = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    res.status(201).json(await svc.checkInCita(req.params.id as string, user?.id));
  } catch (e: any) { res.status(400).json({ error: e.message ?? 'Error en check-in' }); }
};
