import prisma from '../config/db';
import bcrypt from 'bcryptjs';

const usuarioSelect = {
  id: true, nombre: true, email: true, telefono: true, ci: true,
  rol: true, created_at: true,
  _count: { select: { mascotas: true } },
};

export const getUsuarios = (rol?: string, search?: string) =>
  prisma.usuario.findMany({
    where: {
      ...(rol ? { rol: { nombre: rol } } : {}),
      ...(search ? {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { ci: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    select: usuarioSelect,
    orderBy: { nombre: 'asc' },
  });

export const getUsuarioById = (id: string) =>
  prisma.usuario.findUnique({ where: { id }, select: usuarioSelect });

export const createUsuario = async (data: {
  nombre: string; email: string; password?: string;
  telefono?: string; ci?: string; rol_id: string;
}) => {
  const { password, ...rest } = data;
  const normalizedEmail = data.email.trim().toLowerCase();
  const hash = await bcrypt.hash(password ?? 'cambiar123', 10);
  return prisma.usuario.create({ data: { ...rest, email: normalizedEmail, password_hash: hash }, select: usuarioSelect });
};

export const updateUsuario = (id: string, data: Partial<{
  nombre: string; email: string; telefono: string; ci: string; rol_id: string;
}>) =>
  prisma.usuario.update({ where: { id }, data, select: usuarioSelect });

export const deleteUsuario = (id: string) =>
  prisma.usuario.delete({ where: { id } });
