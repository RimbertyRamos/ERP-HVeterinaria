import prisma from '../config/db';
import bcrypt from 'bcryptjs';

const mascotaInclude = {
  especie: true,
  raza: true,
  color: true,
  propietario: { select: { id: true, nombre: true, email: true, telefono: true, ci: true } },
  alergias: { include: { alergia: true } },
  fichas: {
    orderBy: { fecha_hora: 'desc' as const },
    take: 20,
    include: {
      servicio: true,
      doctor: { select: { id: true, nombre: true } },
      consultorio: { select: { nombre: true } },
      soap: { select: { diagnostico: true, tratamiento: true } },
      recibo: {
        select: { id: true, num_recibo: true, total: true, metodo_pago: true, fecha_pago: true, estado: true },
      },
    },
  },
};

export const getMascotas = (search?: string, propietario_id?: string) =>
  prisma.mascota.findMany({
    where: {
      ...(propietario_id ? { propietario_id } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { propietario: { nombre: { contains: search, mode: 'insensitive' } } },
              { propietario: { email: { contains: search, mode: 'insensitive' } } },
              { propietario: { ci: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: mascotaInclude,
    orderBy: { nombre: 'asc' },
  });

export const getMascotaById = (id: string) =>
  prisma.mascota.findUnique({ where: { id }, include: mascotaInclude });

export const createMascotaConPropietario = async (data: {
  mascota: {
    nombre: string;
    especie_id: string;
    raza_id?: string;
    color_id?: string;
    fecha_nacimiento?: string;
    sexo?: string;
    peso_actual?: number;
    esterilizado?: boolean;
    alergias?: { alergia_id: string; severidad: string }[];
  };
  propietario?: {
    nombre: string;
    email: string;
    telefono?: string;
    ci?: string;
    password?: string;
  };
  propietario_id?: string;
}) => {
  let propietario: { id: string } | null = null;

  if (data.propietario_id) {
    propietario = await prisma.usuario.findUnique({ where: { id: data.propietario_id } });
    if (!propietario) throw new Error('Propietario no encontrado');
  } else {
    if (!data.propietario) throw new Error('Se requieren datos del propietario');
    const normalizedEmail = data.propietario.email.trim().toLowerCase();
    const rolCliente = await prisma.role.findFirst({ where: { nombre: 'CLIENTE' } });
    if (!rolCliente) throw new Error('Rol CLIENTE no encontrado en la base de datos');

    propietario = await prisma.usuario.findUnique({ where: { email: normalizedEmail } });
    if (!propietario) {
      const rawPassword = data.propietario.password ?? data.propietario.ci ?? 'cliente123';
      const hash = await bcrypt.hash(rawPassword, 10);
      propietario = await prisma.usuario.create({
        data: {
          nombre: data.propietario.nombre,
          email: normalizedEmail,
          password_hash: hash,
          telefono: data.propietario.telefono,
          ci: data.propietario.ci,
          rol_id: rolCliente.id,
        },
      });
    }
  }

  const { alergias, ...mascotaData } = data.mascota;

  return prisma.mascota.create({
    data: {
      ...mascotaData,
      peso_actual: mascotaData.peso_actual ?? undefined,
      fecha_nacimiento: mascotaData.fecha_nacimiento ? new Date(mascotaData.fecha_nacimiento) : undefined,
      propietario_id: propietario!.id,
      alergias: alergias?.length
        ? { create: alergias.map((a) => ({ alergia_id: a.alergia_id, severidad: a.severidad })) }
        : undefined,
    },
    include: mascotaInclude,
  });
};

export const updateMascota = (id: string, data: Record<string, unknown>) =>
  prisma.mascota.update({
    where: { id },
    data: {
      nombre: data.nombre as string | undefined,
      especie_id: data.especie_id as string | undefined,
      raza_id: data.raza_id as string | undefined,
      color_id: data.color_id as string | undefined,
      sexo: data.sexo as string | undefined,
      esterilizado: data.esterilizado as boolean | undefined,
      peso_actual: data.peso_actual != null ? Number(data.peso_actual) : undefined,
      fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento as string) : undefined,
    },
    include: mascotaInclude,
  });

export const deleteMascota = (id: string) => prisma.mascota.delete({ where: { id } });
