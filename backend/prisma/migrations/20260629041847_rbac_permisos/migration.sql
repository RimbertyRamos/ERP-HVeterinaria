/*
  Warnings:

  - You are about to drop the column `permisos` on the `Role` table. All the data in
    the column will be lost. Los permisos se re-crean normalizados en las tablas
    `Permiso` y `RolePermiso` mediante el seed (npm run seed), que migra los antiguos
    buckets del JSON (all / clinical / fichas / pacientes / caja) a filas RolePermiso.
*/
-- AlterTable
ALTER TABLE "Role" DROP COLUMN "permisos";

-- CreateTable
CREATE TABLE "Permiso" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Permiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermiso" (
    "role_id" TEXT NOT NULL,
    "permiso_id" TEXT NOT NULL,

    CONSTRAINT "RolePermiso_pkey" PRIMARY KEY ("role_id","permiso_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_codigo_key" ON "Permiso"("codigo");

-- AddForeignKey
ALTER TABLE "RolePermiso" ADD CONSTRAINT "RolePermiso_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermiso" ADD CONSTRAINT "RolePermiso_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "Permiso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
