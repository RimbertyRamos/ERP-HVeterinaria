/*
  Elimina los modelos muertos `Proveedor` y `CompraProveedor` y el enum
  `EstadoCompra` (no se usaban en ningún servicio/controlador/ruta; solo había
  datos dummy en el seed, ya removidos). También se elimina `KardexMovimiento.compra_id`
  (siempre null: ningún servicio lo poblaba). El kardex queda intacto.
*/
-- DropForeignKey
ALTER TABLE "CompraProveedor" DROP CONSTRAINT "CompraProveedor_proveedor_id_fkey";

-- DropForeignKey
ALTER TABLE "KardexMovimiento" DROP CONSTRAINT "KardexMovimiento_compra_id_fkey";

-- AlterTable
ALTER TABLE "KardexMovimiento" DROP COLUMN "compra_id";

-- DropTable
DROP TABLE "CompraProveedor";

-- DropTable
DROP TABLE "Proveedor";

-- DropEnum
DROP TYPE "EstadoCompra";
