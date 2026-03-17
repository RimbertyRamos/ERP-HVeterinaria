import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { generateToken } from '../helpers/jwt';

export const registerUser = async (data: any) => {
    const { nombre, email, password, telefono, rol_id } = data;

    const existingUser = await prisma.usuario.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new Error('Email is already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await prisma.usuario.create({
        data: {
            nombre,
            email,
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

    const user = await prisma.usuario.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    const { password_hash: _, ...userWithoutPassword } = user;

    const token = generateToken({ id: user.id, rol_id: user.rol_id });

    return { user: userWithoutPassword, token };
};
