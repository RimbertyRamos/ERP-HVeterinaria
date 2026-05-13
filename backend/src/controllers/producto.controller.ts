import { Request, Response } from 'express';
import * as svc from '../services/producto.service';

const id = (req: Request) => req.params['id'] as string;

export const getProductos = async (req: Request, res: Response) => {
  const { search, categoria_id } = req.query as Record<string, string>;
  res.json(await svc.getProductos(search, categoria_id));
};

export const getProductoById = async (req: Request, res: Response) => {
  const p = await svc.getProductoById(id(req));
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(p);
};

export const createProducto = async (req: Request, res: Response) => {
  try {
    res.status(201).json(await svc.createProducto(req.body));
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Error' });
  }
};

export const updateProducto = async (req: Request, res: Response) => {
  try {
    res.json(await svc.updateProducto(id(req), req.body));
  } catch {
    res.status(400).json({ error: 'Error al actualizar producto' });
  }
};

export const deleteProducto = async (req: Request, res: Response) => {
  await svc.deleteProducto(id(req));
  res.json({ ok: true });
};

export const ajustarStock = async (req: Request, res: Response) => {
  try {
    const { cantidad, tipo, motivo } = req.body;
    res.json(await svc.ajustarStock(id(req), cantidad, tipo, motivo));
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Error' });
  }
};
