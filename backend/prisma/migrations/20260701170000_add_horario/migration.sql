-- CreateTable
CREATE TABLE "HorarioConsultorio" (
    "id" TEXT NOT NULL,
    "consultorio_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "nota" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HorarioConsultorio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HorarioConsultorio_consultorio_id_inicio_idx" ON "HorarioConsultorio"("consultorio_id", "inicio");

-- CreateIndex
CREATE INDEX "HorarioConsultorio_doctor_id_inicio_idx" ON "HorarioConsultorio"("doctor_id", "inicio");

-- AddForeignKey
ALTER TABLE "HorarioConsultorio" ADD CONSTRAINT "HorarioConsultorio_consultorio_id_fkey" FOREIGN KEY ("consultorio_id") REFERENCES "Consultorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioConsultorio" ADD CONSTRAINT "HorarioConsultorio_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

