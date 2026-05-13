import prisma from '../config/db';

const citaInclude = {
  mascota: { include: { propietario: { select: { id: true, nombre: true, telefono: true } } } },
  doctor: { select: { id: true, nombre: true } },
  consultorio: { select: { id: true, nombre: true, tipo: true } },
};

export const getCitas = (fecha?: string, doctor_id?: string) => {
  const where: any = {};
  if (fecha) {
    const start = new Date(fecha); start.setHours(0, 0, 0, 0);
    const end = new Date(fecha);   end.setHours(23, 59, 59, 999);
    where.fecha_hora = { gte: start, lte: end };
  }
  if (doctor_id) where.doctor_id = doctor_id;

  return prisma.cita.findMany({ where, include: citaInclude, orderBy: { fecha_hora: 'asc' } });
};

export const createCita = (data: {
  mascota_id: string;
  doctor_id?: string;
  consultorio_id?: string;
  fecha_hora: string;
  motivo: string;
  notas?: string;
}) =>
  prisma.cita.create({
    data: { ...data, fecha_hora: new Date(data.fecha_hora) },
    include: citaInclude,
  });

export const updateCita = (id: string, data: {
  doctor_id?: string;
  consultorio_id?: string;
  fecha_hora?: string;
  motivo?: string;
  notas?: string;
}) => {
  const payload: any = { ...data };
  if (data.fecha_hora) payload.fecha_hora = new Date(data.fecha_hora);
  return prisma.cita.update({ where: { id }, data: payload, include: citaInclude });
};

export const updateEstadoCita = (id: string, estado: 'PROGRAMADA' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO') =>
  prisma.cita.update({ where: { id }, data: { estado }, include: citaInclude });

export const deleteCita = (id: string) => prisma.cita.delete({ where: { id } });

/** Convierte una cita en FichaAtencion (check-in del paciente) */
export const checkInCita = async (cita_id: string, creado_por_id?: string) => {
  const cita = await prisma.cita.findUniqueOrThrow({
    where: { id: cita_id },
    include: { mascota: true },
  });

  // Buscar servicio genérico "Consulta" o el primero disponible
  const servicio = await prisma.catalogoServicio.findFirst({
    where: { nombre: { contains: 'Consulta', mode: 'insensitive' } },
  }) ?? await prisma.catalogoServicio.findFirst();

  if (!servicio) throw new Error('No hay servicios configurados en el catálogo');

  // Generar código de turno
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();   endOfDay.setHours(23, 59, 59, 999);
  const last = await prisma.fichaAtencion.findFirst({
    where: { cod_ficha: { startsWith: 'C-' }, fecha_hora: { gte: startOfDay, lte: endOfDay } },
    orderBy: { fecha_hora: 'desc' }, select: { cod_ficha: true },
  });
  const lastNum = last ? (parseInt(last.cod_ficha.replace('C-', ''), 10) || 0) : 0;
  const cod_ficha = `C-${String(lastNum + 1).padStart(2, '0')}`;

  const [ficha] = await prisma.$transaction([
    prisma.fichaAtencion.create({
      data: {
        cod_ficha,
        mascota_id: cita.mascota_id,
        servicio_id: servicio.id,
        doctor_id: cita.doctor_id ?? undefined,
        consultorio_id: cita.consultorio_id ?? undefined,
        motivo: cita.motivo,
        creado_por_id,
      },
    }),
    prisma.cita.update({ where: { id: cita_id }, data: { estado: 'CONFIRMADA' } }),
  ]);

  return ficha;
};
