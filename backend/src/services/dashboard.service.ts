import prisma from '../config/db';

const diaBuckets = () =>
  Array.from({ length: 7 }, (_, i) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (6 - i));
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const label = start.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    return { start, end, label };
  });

export const getKpis = async () => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);

  const buckets = diaBuckets();

  const [
    fichasHoy,
    fichasEspera,
    fichasEnCurso,
    consultorios,
    stockCritico,
    ingresosHoy,
    recibosRecientes,
    totalMascotas,
    semanaDatos,
  ] = await Promise.all([
    prisma.fichaAtencion.count({ where: { fecha_hora: { gte: hoy, lt: manana } } }),
    prisma.fichaAtencion.count({ where: { estado: 'ESPERA' } }),
    prisma.fichaAtencion.count({ where: { estado: 'EN_CURSO' } }),
    prisma.consultorio.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.producto.findMany({
      where: { stock_actual: { lte: prisma.producto.fields.stock_minimo } },
      select: { id: true, nombre: true, stock_actual: true, stock_minimo: true },
    }),
    prisma.reciboCaja.aggregate({
      where: { fecha_pago: { gte: hoy, lt: manana }, estado: 'PAGADO' },
      _sum: { total: true },
    }),
    prisma.reciboCaja.findMany({
      where: { estado: 'PAGADO' },
      take: 10,
      orderBy: { fecha_pago: 'desc' },
      include: {
        ficha: { include: { mascota: { select: { nombre: true } }, servicio: true } },
        cajero: { select: { nombre: true } },
      },
    }),
    prisma.mascota.count(),
    Promise.all(
      buckets.map(async ({ start, end, label }) => {
        const [ingresos, fichas] = await Promise.all([
          prisma.reciboCaja.aggregate({
            where: { fecha_pago: { gte: start, lt: end }, estado: 'PAGADO' },
            _sum: { total: true },
          }),
          prisma.fichaAtencion.count({ where: { fecha_hora: { gte: start, lt: end } } }),
        ]);
        return { dia: label, ingresos: Number(ingresos._sum.total ?? 0), fichas };
      })
    ),
  ]);

  return {
    fichas_hoy: fichasHoy,
    en_espera: fichasEspera,
    en_curso: fichasEnCurso,
    consultorios: consultorios.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      especialidad: c.especialidad,
      estado: c.estado,
    })),
    stock_critico: stockCritico.length,
    productos_criticos: stockCritico,
    ingresos_hoy: Number(ingresosHoy._sum.total ?? 0),
    recibos_recientes: recibosRecientes,
    total_mascotas: totalMascotas,
    semana: semanaDatos,
  };
};
