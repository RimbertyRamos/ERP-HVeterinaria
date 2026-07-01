-- Descuento en el recibo (CU17). `descuento` por defecto 0 (los recibos
-- existentes quedan sin descuento); `tipo_descuento` indica si es PORCENTAJE o
-- MONTO. El `total` sigue almacenado como snapshot del cobro (cambia su fórmula
-- de cálculo en caja.service.ts, no su semántica de columna).

-- CreateEnum
CREATE TYPE "TipoDescuento" AS ENUM ('PORCENTAJE', 'MONTO');

-- AlterTable
ALTER TABLE "ReciboCaja" ADD COLUMN     "descuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "tipo_descuento" "TipoDescuento";
