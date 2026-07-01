-- CreateEnum
CREATE TYPE "AccionBitacora" AS ENUM ('LOGIN', 'LOGOUT', 'LOGIN_FALLIDO', 'CAMBIO_PASSWORD', 'CREAR', 'ACTUALIZAR', 'ELIMINAR', 'CAMBIO_ESTADO', 'CAMBIO_ROL', 'APLICAR_DESCUENTO', 'ANULAR', 'CIERRE_CAJA', 'EXPORTAR', 'ACCESO_HISTORIA');

-- CreateTable
CREATE TABLE "Bitacora" (
    "id" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" TEXT,
    "actor_email" TEXT,
    "actor_nombre" TEXT,
    "actor_rol" TEXT,
    "accion" "AccionBitacora" NOT NULL,
    "entidad" TEXT,
    "entidad_id" TEXT,
    "descripcion" TEXT NOT NULL,
    "datos_antes" TEXT,
    "datos_despues" TEXT,
    "exito" BOOLEAN NOT NULL DEFAULT true,
    "ip" TEXT,
    "user_agent" TEXT,
    "metodo_http" TEXT,
    "ruta" TEXT,

    CONSTRAINT "Bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bitacora_fecha_hora_idx" ON "Bitacora"("fecha_hora");

-- CreateIndex
CREATE INDEX "Bitacora_usuario_id_idx" ON "Bitacora"("usuario_id");

-- CreateIndex
CREATE INDEX "Bitacora_entidad_entidad_id_idx" ON "Bitacora"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "Bitacora_accion_idx" ON "Bitacora"("accion");

-- AddForeignKey
ALTER TABLE "Bitacora" ADD CONSTRAINT "Bitacora_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

