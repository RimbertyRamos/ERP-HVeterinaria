-- Notificaciones in-app. Complementan los correos (no los reemplazan): el
-- recordatorio de cita persiste aquí además de enviarse por email.

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('CITA', 'RECORDATORIO', 'SISTEMA');

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
