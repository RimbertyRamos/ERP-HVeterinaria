import prisma from '../config/db';

const consultorioInclude = {
  responsable: { select: { id: true, nombre: true, rol: { select: { nombre: true } } } }
};

export const getConsultorios = () =>
  prisma.consultorio.findMany({
    include: consultorioInclude,
    orderBy: { nombre: 'asc' },
  });

export const getConsultorioById = (id: string) =>
  prisma.consultorio.findUnique({ where: { id }, include: consultorioInclude });

export const createConsultorio = (data: {
  nombre: string;
  especialidad?: string;
  tipo?: 'CONSULTORIO' | 'LABORATORIO' | 'QUIROFANO' | 'SALA_ESPERA' | 'OTRO';
  responsable_id?: string;
}) =>
  prisma.consultorio.create({ 
    data: {
      ...data,
      tipo: data.tipo || 'CONSULTORIO'
    },
    include: consultorioInclude 
  });

export const updateConsultorio = (id: string, data: {
  nombre?: string;
  especialidad?: string;
  tipo?: 'CONSULTORIO' | 'LABORATORIO' | 'QUIROFANO' | 'SALA_ESPERA' | 'OTRO';
  estado?: 'LIBRE' | 'OCUPADO' | 'LIMPIEZA';
  responsable_id?: string;
}) =>
  prisma.consultorio.update({ 
    where: { id }, 
    data, 
    include: consultorioInclude 
  });

export const updateEstado = (id: string, estado: 'LIBRE' | 'OCUPADO' | 'LIMPIEZA') =>
  prisma.consultorio.update({ where: { id }, data: { estado }, include: consultorioInclude });

export const deleteConsultorio = (id: string) =>
  prisma.consultorio.delete({ where: { id } });
