/*
  Normaliza HistoriaClinica.vacunas (String[]) a las tablas `Vacuna` + `HistoriaVacuna`.

  Orden DELIBERADO (la migración de datos DEBE correr ANTES del DROP COLUMN):
    1. Crear tablas Vacuna / HistoriaVacuna + índices + FKs.
    2. Sembrar las vacunas comunes (idempotente vía ON CONFLICT).
    3. Migrar datos: partir el array `vacunas` de cada historia en filas
       HistoriaVacuna (match por nombre, case-insensitive). Lo NO reconocido se
       concatena a `vacunas_otras`.
    4. Recién entonces, eliminar la columna `vacunas`.

  `vacunas_otras String?` se conserva intacto para texto libre.
*/

-- 1. CreateTable -------------------------------------------------------------
CREATE TABLE "Vacuna" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Vacuna_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HistoriaVacuna" (
    "historia_id" TEXT NOT NULL,
    "vacuna_id" TEXT NOT NULL,
    "fecha_aplicacion" TIMESTAMP(3),

    CONSTRAINT "HistoriaVacuna_pkey" PRIMARY KEY ("historia_id","vacuna_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vacuna_nombre_key" ON "Vacuna"("nombre");

-- AddForeignKey
ALTER TABLE "HistoriaVacuna" ADD CONSTRAINT "HistoriaVacuna_historia_id_fkey" FOREIGN KEY ("historia_id") REFERENCES "HistoriaClinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HistoriaVacuna" ADD CONSTRAINT "HistoriaVacuna_vacuna_id_fkey" FOREIGN KEY ("vacuna_id") REFERENCES "Vacuna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2. Seed de vacunas comunes (mismo catálogo que src/seed.ts) ----------------
INSERT INTO "Vacuna" ("id", "nombre") VALUES
    (gen_random_uuid()::text, 'Rabia'),
    (gen_random_uuid()::text, 'Quíntuple / Polivalente'),
    (gen_random_uuid()::text, 'Moquillo'),
    (gen_random_uuid()::text, 'Parvovirus'),
    (gen_random_uuid()::text, 'Leptospirosis'),
    (gen_random_uuid()::text, 'Hepatitis'),
    (gen_random_uuid()::text, 'Bordetella'),
    (gen_random_uuid()::text, 'Antirrábica felina'),
    (gen_random_uuid()::text, 'Triple felina')
ON CONFLICT ("nombre") DO NOTHING;

-- 3a. Migrar datos: elementos del array que SÍ coinciden con una vacuna ------
INSERT INTO "HistoriaVacuna" ("historia_id", "vacuna_id")
SELECT h.id, v.id
FROM "HistoriaClinica" h
CROSS JOIN LATERAL unnest(h."vacunas") AS elem(nombre)
JOIN "Vacuna" v ON lower(trim(v."nombre")) = lower(trim(elem.nombre))
WHERE trim(elem.nombre) <> ''
ON CONFLICT ("historia_id", "vacuna_id") DO NOTHING;

-- 3b. Lo NO reconocido se concatena a vacunas_otras (preservando lo previo) --
UPDATE "HistoriaClinica" h
SET "vacunas_otras" = NULLIF(
    trim(both ', ' FROM concat_ws(', ', NULLIF(h."vacunas_otras", ''), sub.no_reconocidas)),
    ''
)
FROM (
    SELECT h2.id, string_agg(DISTINCT trim(elem.nombre), ', ') AS no_reconocidas
    FROM "HistoriaClinica" h2
    CROSS JOIN LATERAL unnest(h2."vacunas") AS elem(nombre)
    WHERE trim(elem.nombre) <> ''
      AND NOT EXISTS (
          SELECT 1 FROM "Vacuna" v
          WHERE lower(trim(v."nombre")) = lower(trim(elem.nombre))
      )
    GROUP BY h2.id
) sub
WHERE h.id = sub.id;

-- 4. Recién ahora se elimina la columna vieja --------------------------------
ALTER TABLE "HistoriaClinica" DROP COLUMN "vacunas";
