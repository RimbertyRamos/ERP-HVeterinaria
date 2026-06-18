import prisma from '../config/db';

const fichaInclude = {
  mascota: {
    include: {
      especie: true,
      raza: true,
      propietario: { select: { id: true, nombre: true, email: true, telefono: true, ci: true } },
      alergias: { include: { alergia: true } },
    },
  },
  servicio: true,
  doctor: { select: { id: true, nombre: true, email: true } },
  consultorio: true,
  creado_por: { select: { id: true, nombre: true } },
  soap: {
    include: {
      receta: { include: { detalles: { include: { producto: true } } } },
    },
  },
  ordenes_lab: { include: { examen: true, resultado: true } },
  consumos: { include: { producto: true } },
  recibo: true,
};

/**
 * Genera un código de turno corto estilo banco (Ej: C-01, E-05)
 * Se reinicia cada día.
 */
const genTurnoDiario = async (prioridad: string, servicioId: string) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Determinar el prefijo
  let prefix = 'T'; // Default: Turno
  
  if (prioridad === 'URGENTE') {
    prefix = 'E'; // Emergencia
  } else {
    const servicio = await prisma.catalogoServicio.findUnique({ where: { id: servicioId } });
    const nombre = servicio?.nombre.toLowerCase() || '';
    if (nombre.includes('laboratorio')) prefix = 'L';
    else if (nombre.includes('consulta')) prefix = 'C';
  }

  // 2. Buscar el mayor número ya asignado hoy para ese prefijo
  const last = await prisma.fichaAtencion.findFirst({
    where: {
      cod_ficha: { startsWith: `${prefix}-` },
      fecha_hora: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { fecha_hora: 'desc' },
    select: { cod_ficha: true },
  });

  const lastNum = last ? (parseInt(last.cod_ficha.replace(`${prefix}-`, ''), 10) || 0) : 0;
  return `${prefix}-${String(lastNum + 1).padStart(2, '0')}`;
};

export const getFichas = (filters?: { estado?: string; doctor_id?: string; fecha?: string }) => {
  const where: any = {};
  if (filters?.estado) where.estado = filters.estado;
  if (filters?.doctor_id) where.doctor_id = filters.doctor_id;
  if (filters?.fecha) {
    const d = new Date(filters.fecha);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    where.fecha_hora = { gte: d, lt: next };
  }
  return prisma.fichaAtencion.findMany({ where, include: fichaInclude, orderBy: { fecha_hora: 'desc' } });
};

export const getFichaById = (id: string) =>
  prisma.fichaAtencion.findUnique({ where: { id }, include: fichaInclude });

export const createFicha = async (data: {
  mascota_id: string;
  servicio_id: string;
  motivo?: string;
  prioridad?: 'URGENTE' | 'NORMAL';
  creado_por_id?: string;
}) => {
  // GENERACIÓN DEL TURNO CORTO ESTILO BANCO
  const cod_ficha = await genTurnoDiario(data.prioridad || 'NORMAL', data.servicio_id);
  
  return prisma.fichaAtencion.create({ 
    data: { ...data, cod_ficha }, 
    include: fichaInclude 
  });
};

export const iniciarFicha = (id: string, data: { doctor_id?: string; consultorio_id: string }, actorId: string) =>
  prisma.$transaction(async (tx) => {
    await tx.consultorio.update({ where: { id: data.consultorio_id }, data: { estado: 'OCUPADO' } });
    return tx.fichaAtencion.update({
      where: { id },
      // asignación deliberada (body) si viene; si no, el actor que inicia la atención
      data: { doctor_id: data.doctor_id ?? actorId, consultorio_id: data.consultorio_id, estado: 'EN_CURSO' },
      include: fichaInclude,
    });
  });

export const completarFicha = (id: string) =>
  prisma.$transaction(async (tx) => {
    const ficha = await tx.fichaAtencion.findUnique({ where: { id }, select: { consultorio_id: true } });
    if (ficha?.consultorio_id) {
      await tx.consultorio.update({ where: { id: ficha.consultorio_id }, data: { estado: 'LIBRE' } });
    }
    return tx.fichaAtencion.update({ where: { id }, data: { estado: 'COMPLETADA' }, include: fichaInclude });
  });

export const cancelarFicha = (id: string) =>
  prisma.$transaction(async (tx) => {
    const ficha = await tx.fichaAtencion.findUnique({ where: { id }, select: { consultorio_id: true } });
    if (ficha?.consultorio_id) {
      await tx.consultorio.update({ where: { id: ficha.consultorio_id }, data: { estado: 'LIBRE' } });
    }
    return tx.fichaAtencion.update({ where: { id }, data: { estado: 'CANCELADA' }, include: fichaInclude });
  });

export const updateFicha = (id: string, data: any) =>
  prisma.fichaAtencion.update({ where: { id }, data, include: fichaInclude });

// ── SOAP ────────────────────────────────────────────────────────────
export const getSoap = (ficha_id: string) =>
  prisma.registroSOAP.findUnique({
    where: { ficha_id },
    include: { receta: { include: { detalles: { include: { producto: true } } } } },
  });

export const upsertSoap = (ficha_id: string, data: {
  motivo_detalle?: string; anamnesis?: string;
  peso?: number; temperatura?: number; fc?: number; fr?: number;
  hallazgos?: string; diagnostico?: string; tratamiento?: string;
}) =>
  prisma.registroSOAP.upsert({
    where: { ficha_id },
    create: { ficha_id, ...data },
    update: data,
    include: { receta: { include: { detalles: { include: { producto: true } } } } },
  });

// ── CONSUMOS EN CONSULTA ────────────────────────────────────────────
export const getConsumos = (ficha_id: string) =>
  prisma.consumoConsulta.findMany({
    where: { ficha_id },
    include: { producto: true },
  });

export const addConsumo = (ficha_id: string, data: { producto_id: string; cantidad: number }) =>
  prisma.consumoConsulta.create({
    data: { ficha_id, ...data },
    include: { producto: true },
  });

export const removeConsumo = (id: string) =>
  prisma.consumoConsulta.delete({ where: { id } });

// ── RECETA ──────────────────────────────────────────────────────────
export const createReceta = async (ficha_id: string, data: {
  indicaciones?: string;
  detalles: { producto_id: string; cantidad: number; instrucciones?: string }[];
}) => {
  let soap = await prisma.registroSOAP.findUnique({ where: { ficha_id } });
  if (!soap) soap = await prisma.registroSOAP.create({ data: { ficha_id } });
  return prisma.recetaMedica.create({
    data: { soap_id: soap.id, indicaciones: data.indicaciones, detalles: { create: data.detalles } },
    include: { detalles: { include: { producto: true } } },
  });
};
