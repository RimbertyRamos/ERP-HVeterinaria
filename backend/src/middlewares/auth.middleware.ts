import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../helpers/jwt';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    if (!payload || typeof payload !== 'object') {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    req.user = {
        id: (payload as { id: string }).id,
        rol_id: (payload as { rol_id: string }).rol_id
    };

    next();
};

/**
 * Obtiene el id del usuario autenticado de forma segura.
 * Las rutas que lo usan DEBEN pasar antes por `authenticate`.
 * Si por un error de configuración la ruta quedara sin proteger,
 * lanza un error controlado en lugar de reventar con un TypeError;
 * el try/catch de cada controlador lo convierte en una respuesta de error.
 */
export const getUserId = (req: Request): string => {
    if (!req.user?.id) {
        throw new Error('Usuario no autenticado');
    }
    return req.user.id;
};
