import prisma from '../config/db';

const productoInclude = { categoria: true };

export const getProductos = (search?: string, categoria_id?: string) =>
  prisma.producto.findMany({
    where: {
      ...(categoria_id ? { categoria_id } : {}),
      ...(search ? { nombre: { contains: search, mode: 'insensitive' as const } } : {}),
    },
    include: productoInclude,
    orderBy: { nombre: 'asc' },
  });

export const getProductoById = (id: string) =>
  prisma.producto.findUnique({ where: { id }, include: productoInclude });

export const createProducto = (data: {
  nombre: string;
  descripcion?: string;
  categoria_id?: string;
  precio_venta: number;
  stock_actual?: number;
  stock_minimo?: number;
}) =>
  prisma.producto.create({ data, include: productoInclude });

export const updateProducto = (id: string, data: Partial<{
  nombre: string;
  descripcion: string;
  categoria_id: string;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
}>) =>
  prisma.producto.update({ where: { id }, data, include: productoInclude });

export const deleteProducto = (id: string) =>
  prisma.producto.delete({ where: { id } });

export const ajustarStock = async (id: string, cantidad: number, tipo: 'INGRESO' | 'SALIDA', motivo?: string) => {
  const prod = await prisma.producto.findUniqueOrThrow({ where: { id } });
  const nuevo_stock = tipo === 'INGRESO' ? prod.stock_actual + cantidad : prod.stock_actual - cantidad;
  const [updated] = await prisma.$transaction([
    prisma.producto.update({ where: { id }, data: { stock_actual: nuevo_stock }, include: productoInclude }),
    prisma.kardexMovimiento.create({
      data: { producto_id: id, tipo, cantidad, saldo_final: nuevo_stock, motivo },
    }),
  ]);
  return updated;
};
