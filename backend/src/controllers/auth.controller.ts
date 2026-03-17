import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await registerUser(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await loginUser(req.body);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
};
