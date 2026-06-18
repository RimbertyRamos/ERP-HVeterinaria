import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const requireRole = (...rolesPermitidos: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        const rol = await prisma.role.findUnique({
            where: { id: req.user.rol_id },
            select: { nombre: true }
        });

        // Comparación case-insensitive: la BD guarda los roles en MAYÚSCULAS
        // (ADMIN, CAJERO…) pero requireRole se invoca con 'Admin', 'Cajero'…
        const permitidos = rolesPermitidos.map((r) => r.toUpperCase().trim());
        const rolNormalizado = rol?.nombre.toUpperCase().trim();

        if (!rolNormalizado || !permitidos.includes(rolNormalizado)) {
            return res.status(403).json({ error: 'No autorizado para esta acción' });
        }

        next();
    };
};
