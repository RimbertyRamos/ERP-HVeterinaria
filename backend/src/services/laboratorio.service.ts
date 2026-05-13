import prisma from '../config/db';

const ordenInclude = {
  ficha: {
    include: {
      mascota: { include: { propietario: { select: { id: true, nombre: true } } } },
      doctor: { select: { id: true, nombre: true } },
    },
  },
  examen: true,
  resultado: true,
};

const genCodOrden = async () => {
  const last = await prisma.laboratorioOrden.findFirst({
    orderBy: { created_at: 'desc' },
    select: { cod_orden: true },
  });
  const num = last ? (parseInt(last.cod_orden.replace('ORD-', ''), 10) || 0) : 0;
  return `ORD-${String(num + 1).padStart(4, '0')}`;
};

export const getOrdenes = (estado?: string) =>
  prisma.laboratorioOrden.findMany({
    where: estado ? { estado: estado as 'SOLICITADO' | 'EN_PROCESO' | 'FINALIZADO' } : undefined,
    include: ordenInclude,
    orderBy: { created_at: 'desc' },
  });

export const getOrdenById = (id: string) =>
  prisma.laboratorioOrden.findUnique({ where: { id }, include: ordenInclude });

export const createOrden = async (data: {
  ficha_id: string;
  examen_id: string;
  prioridad?: 'URGENTE' | 'NORMAL';
}) => {
  const cod_orden = await genCodOrden();
  return prisma.laboratorioOrden.create({ data: { ...data, cod_orden }, include: ordenInclude });
};

export const updateEstadoOrden = (id: string, estado: 'EN_PROCESO' | 'FINALIZADO') =>
  prisma.laboratorioOrden.update({ where: { id }, data: { estado }, include: ordenInclude });

export const cargarResultado = (orden_id: string, data: {
  hallazgos?: string;
  observaciones?: string;
  archivo_url?: string;
}) =>
  prisma.$transaction(async (tx) => {
    const resultado = await tx.laboratorioResultado.upsert({
      where: { orden_id },
      create: { orden_id, ...data },
      update: data,
    });
    await tx.laboratorioOrden.update({ where: { id: orden_id }, data: { estado: 'FINALIZADO' } });
    return resultado;
  });
