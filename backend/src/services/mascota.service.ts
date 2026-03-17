import prisma from '../config/db';

export const createMascota = async (data: any) => {
    return await prisma.mascota.create({ data });
};

export const getMascotas = async () => {
    return await prisma.mascota.findMany({
        include: { propietario: true }
    });
};

export const getMascotaById = async (id: string) => {
    return await prisma.mascota.findUnique({
        where: { id },
        include: { propietario: true }
    });
};

export const updateMascota = async (id: string, data: any) => {
    return await prisma.mascota.update({
        where: { id },
        data
    });
};

export const deleteMascota = async (id: string) => {
    return await prisma.mascota.delete({
        where: { id }
    });
};
