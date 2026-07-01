-- AlterTable
ALTER TABLE "HistoriaVacuna" ADD COLUMN     "proxima_dosis" TIMESTAMP(3),
ADD COLUMN     "recordatorio_enviado" BOOLEAN NOT NULL DEFAULT false;

