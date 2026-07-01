-- Calificación de servicio (CU20): el propietario califica la atención de una
-- ficha COMPLETADA. Relación 1–1 con la ficha (ficha_id @unique → un solo voto).

-- CreateTable
CREATE TABLE "Calificacion" (
    "id" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "propietario_id" TEXT NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "comentario" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Calificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Calificacion_ficha_id_key" ON "Calificacion"("ficha_id");

-- AddForeignKey
ALTER TABLE "Calificacion" ADD CONSTRAINT "Calificacion_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "FichaAtencion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calificacion" ADD CONSTRAINT "Calificacion_propietario_id_fkey" FOREIGN KEY ("propietario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
