import prisma from '../config/db';

export const getEspecies = () =>
  prisma.especie.findMany({ include: { razas: true }, orderBy: { nombre: 'asc' } });

export const getRazas = (especie_id?: string) =>
  prisma.raza.findMany({
    where: especie_id ? { especie_id } : undefined,
    include: { especie: true },
    orderBy: { nombre: 'asc' },
  });

export const getColores = () =>
  prisma.colorMascota.findMany({ orderBy: { descripcion: 'asc' } });

export const getAlergias = () =>
  prisma.alergia.findMany({ orderBy: { nombre: 'asc' } });

export const getServicios = () =>
  prisma.catalogoServicio.findMany({ orderBy: { nombre: 'asc' } });

export const getExamenes = () =>
  prisma.catalogoExamen.findMany({ orderBy: { nombre: 'asc' } });

export const getCategorias = () =>
  prisma.categoriaProducto.findMany({ orderBy: { nombre: 'asc' } });

export const getRoles = () =>
  prisma.role.findMany({ orderBy: { nombre: 'asc' } });
