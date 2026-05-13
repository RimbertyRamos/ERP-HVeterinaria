import prisma from '../config/db';

const reciboInclude = {
  ficha: {
    include: {
      mascota: { include: { propietario: { select: { id: true, nombre: true, ci: true } } } },
      servicio: true,
    },
  },
  cajero: { select: { id: true, nombre: true } },
  punto_caja: true,
  detalles: { include: { orden_lab: { include: { examen: true } }, producto: true } },
};

const genNumRecibo = async () => {
  const n = await prisma.reciboCaja.count();
  return `REC-${String(n + 1).padStart(5, '0')}`;
};

/** Fichas completadas aún no cobradas */
export const getFichasPendientePago = () =>
  prisma.fichaAtencion.findMany({
    where: { estado: 'COMPLETADA', estado_cobro: 'PENDIENTE' },
    include: {
      mascota: { include: { propietario: { select: { id: true, nombre: true } } } },
      servicio: true,
      soap: { include: { receta: { include: { detalles: { include: { producto: true } } } } } },
      ordenes_lab: { include: { examen: true } },
      consumos: { include: { producto: true } },
    },
    orderBy: { fecha_hora: 'asc' },
  });

export const getRecibos = () =>
  prisma.reciboCaja.findMany({ include: reciboInclude, orderBy: { fecha_pago: 'desc' } });

export const getReciboById = (id: string) =>
  prisma.reciboCaja.findUnique({ where: { id }, include: reciboInclude });

/**
 * Cobra una ficha completa.
 * Construye automáticamente los DetalleCobro desde el servicio, exámenes y receta.
 */
export const cobrarFicha = async (data: {
  ficha_id: string;
  cajero_id: string;
  punto_caja_id?: string;
  metodo_pago?: 'EFECTIVO' | 'TARJETA' | 'QR';
  monto_recibido?: number;
}) => {
  const ficha = await prisma.fichaAtencion.findUniqueOrThrow({
    where: { id: data.ficha_id },
    include: {
      servicio: true,
      ordenes_lab: { include: { examen: true } },
      soap: { include: { receta: { include: { detalles: { include: { producto: true } } } } } },
      consumos: { include: { producto: true } },
    },
  });

  type Detalle = {
    tipo: 'SERVICIO' | 'LABORATORIO' | 'FARMACIA' | 'SUMINISTRO';
    descripcion: string;
    precio_unit: number;
    cantidad: number;
    subtotal: number;
    orden_lab_id?: string;
    producto_id?: string;
  };

  const detalles: Detalle[] = [];

  // 1. Tarifa del servicio
  detalles.push({
    tipo: 'SERVICIO',
    descripcion: ficha.servicio.nombre,
    precio_unit: Number(ficha.servicio.precio_base),
    cantidad: 1,
    subtotal: Number(ficha.servicio.precio_base),
  });

  // 2. Órdenes de laboratorio
  for (const orden of ficha.ordenes_lab) {
    detalles.push({
      tipo: 'LABORATORIO',
      descripcion: orden.examen.nombre,
      precio_unit: Number(orden.examen.precio),
      cantidad: 1,
      subtotal: Number(orden.examen.precio),
      orden_lab_id: orden.id,
    });
  }

  // 3. Insumos/suministros usados en consulta (no descuentan stock aquí — lo hace Farmacia al dispensar)
  for (const cons of ficha.consumos) {
    const precio = Number(cons.producto.precio_venta);
    detalles.push({
      tipo: 'SUMINISTRO',
      descripcion: cons.producto.nombre,
      precio_unit: precio,
      cantidad: cons.cantidad,
      subtotal: precio * cons.cantidad,
      producto_id: cons.producto_id,
    });
  }

  // 4. Productos de la receta médica (no descuentan stock aquí — lo hace Farmacia al dispensar)
  if (ficha.soap?.receta) {
    for (const det of ficha.soap.receta.detalles) {
      const precio = Number(det.producto.precio_venta);
      detalles.push({
        tipo: 'FARMACIA',
        descripcion: det.producto.nombre,
        precio_unit: precio,
        cantidad: det.cantidad,
        subtotal: precio * det.cantidad,
        producto_id: det.producto_id,
      });
    }
  }

  const total = detalles.reduce((s, d) => s + d.subtotal, 0);
  const monto_recibido = data.monto_recibido ?? total;
  const cambio_devuelto = Math.max(0, monto_recibido - total);
  const num_recibo = await genNumRecibo();

  return prisma.$transaction(async (tx) => {
    const recibo = await tx.reciboCaja.create({
      data: {
        num_recibo,
        ficha_id: data.ficha_id,
        cajero_id: data.cajero_id,
        punto_caja_id: data.punto_caja_id,
        metodo_pago: data.metodo_pago ?? 'EFECTIVO',
        total,
        monto_recibido,
        cambio_devuelto,
        estado: 'PAGADO',
        detalles: { create: detalles },
      },
      include: reciboInclude,
    });

    await tx.fichaAtencion.update({
      where: { id: data.ficha_id },
      data: { estado_cobro: 'PAGADO' },
    });

    return recibo;
  });
};

export const anularRecibo = (id: string, motivo_anulacion: string) =>
  prisma.reciboCaja.update({ where: { id }, data: { estado: 'ANULADO', motivo_anulacion }, include: reciboInclude });

export const ventaDirecta = async (data: {
  cajero_id: string;
  nombre_cliente?: string;
  punto_caja_id?: string;
  metodo_pago?: 'EFECTIVO' | 'TARJETA' | 'QR';
  monto_recibido?: number;
  productos: { id: string; cantidad: number }[];
}) => {
  const num_recibo = await genNumRecibo();

  // Validate and get products
  const productIds = data.productos.map(p => p.id);
  const dbProducts = await prisma.producto.findMany({ where: { id: { in: productIds } } });
  
  if (dbProducts.length !== productIds.length) {
    throw new Error('Algunos productos no existen en el inventario.');
  }

  const detalles = dbProducts.map(prod => {
    const pInput = data.productos.find(p => p.id === prod.id)!;
    const subtotal = Number(prod.precio_venta) * pInput.cantidad;
    return {
      tipo: 'FARMACIA' as const,
      descripcion: prod.nombre,
      precio_unit: Number(prod.precio_venta),
      cantidad: pInput.cantidad,
      subtotal,
      producto_id: prod.id,
    };
  });

  const total = detalles.reduce((s, d) => s + d.subtotal, 0);
  const monto_recibido = data.monto_recibido ?? total;
  const cambio_devuelto = Math.max(0, monto_recibido - total);

  return prisma.$transaction(async (tx) => {
    // Check stock explicitly to avoid errors if stock goes negative (if you want to prevent negative stock)
    for (const det of detalles) {
      const prod = dbProducts.find(p => p.id === det.producto_id)!;
      if (prod.stock_actual < det.cantidad) {
        throw new Error(`Stock insuficiente para el producto ${prod.nombre}`);
      }
    }

    const recibo = await tx.reciboCaja.create({
      data: {
        num_recibo,
        cajero_id: data.cajero_id,
        nombre_cliente: data.nombre_cliente,
        punto_caja_id: data.punto_caja_id,
        metodo_pago: data.metodo_pago ?? 'EFECTIVO',
        total,
        monto_recibido,
        cambio_devuelto,
        estado: 'PAGADO',
        detalles: { create: detalles },
      },
      include: reciboInclude,
    });

    // Descontar stock
    for (const det of detalles) {
      const prod = dbProducts.find(p => p.id === det.producto_id)!;
      const nuevo = prod.stock_actual - det.cantidad;
      await tx.producto.update({ where: { id: det.producto_id! }, data: { stock_actual: nuevo } });
      await tx.kardexMovimiento.create({
        data: { 
          producto_id: det.producto_id!, 
          tipo: 'SALIDA', 
          cantidad: det.cantidad, 
          saldo_final: nuevo, 
          motivo: `Venta directa POS, Recibo ${num_recibo}` 
        },
      });
    }

    return recibo;
  });
};
