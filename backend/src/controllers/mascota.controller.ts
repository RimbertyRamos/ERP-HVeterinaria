import { Request, Response } from 'express';
import * as mascotaService from '../services/mascota.service';

export const createMascota = async (req: Request, res: Response) => {
    try {
        const mascota = await mascotaService.createMascota(req.body);
        res.status(201).json(mascota);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getMascotas = async (req: Request, res: Response) => {
    try {
        const mascotas = await mascotaService.getMascotas();
        res.status(200).json(mascotas);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getMascotaById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const mascota = await mascotaService.getMascotaById(id);
        if (!mascota) return res.status(404).json({ message: 'Mascota no encontrada' });
        res.status(200).json(mascota);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateMascota = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const mascota = await mascotaService.updateMascota(id, req.body);
        res.status(200).json(mascota);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteMascota = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await mascotaService.deleteMascota(id);
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
