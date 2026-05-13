import { Request, Response } from 'express';
import * as svc from '../services/catalogo.service';

export const getEspecies = async (_: Request, res: Response) => {
  res.json(await svc.getEspecies());
};
export const getRazas = async (req: Request, res: Response) => {
  res.json(await svc.getRazas(req.query.especie_id as string));
};
export const getColores = async (_: Request, res: Response) => {
  res.json(await svc.getColores());
};
export const getAlergias = async (_: Request, res: Response) => {
  res.json(await svc.getAlergias());
};
export const getServicios = async (_: Request, res: Response) => {
  res.json(await svc.getServicios());
};
export const getExamenes = async (_: Request, res: Response) => {
  res.json(await svc.getExamenes());
};
export const getCategorias = async (req: Request, res: Response) => {
  res.json(await svc.getCategorias());
};

export const getRoles = async (req: Request, res: Response) => {
  res.json(await svc.getRoles());
};

