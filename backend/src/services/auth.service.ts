import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { generateToken } from '../helpers/jwt';
import { validatePassword } from '../helpers/password';

export const registerUser = async (data: any) => {
    const { nombre, email, password, telefono, rol_id } = data;
    const normalizedEmail = String(email).trim().toLowerCase();

    validatePassword(password);

    const existingUser = await prisma.usuario.findUnique({
        where: { email: normalizedEmail }
    });

    if (existingUser) {
        throw new Error('Email is already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await prisma.usuario.create({
        data: {
            nombre,
            email: normalizedEmail,
            password_hash,
            telefono,
            rol_id
        }
    });

    const { password_hash: _, ...userWithoutPassword } = user;

    const token = generateToken({ id: user.id, rol_id: user.rol_id });

    return { user: userWithoutPassword, token };
};

export const loginUser = async (data: any) => {
    const { email, password } = data;
    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await prisma.usuario.findUnique({
        where: { email: normalizedEmail },
        include: { rol: { select: { nombre: true } } }
    });

    if (!user) {
        throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    // Login único (no se filtra por rol), pero las cuentas desactivadas no entran.
    if (!user.activo) {
        throw new Error('Cuenta desactivada');
    }

    // userWithoutPassword incluye debe_cambiar_password y activo para que el frontend reaccione.
    const { password_hash: _, ...userWithoutPassword } = user;

    const token = generateToken({ id: user.id, rol_id: user.rol_id });

    return { user: userWithoutPassword, token };
};
