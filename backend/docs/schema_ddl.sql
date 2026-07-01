-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoSala" AS ENUM ('CONSULTORIO', 'LABORATORIO', 'QUIROFANO', 'SALA_ESPERA', 'OTRO');

-- CreateEnum
CREATE TYPE "ConsultorioEstado" AS ENUM ('LIBRE', 'OCUPADO', 'LIMPIEZA');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('SOLICITADA', 'PROGRAMADA', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO');

-- CreateEnum
CREATE TYPE "TipoCita" AS ENUM ('CONSULTA', 'CONTROL', 'VACUNACION', 'CIRUGIA', 'PELUQUERIA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoFicha" AS ENUM ('ESPERA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('URGENTE', 'NORMAL');

-- CreateEnum
CREATE TYPE "EstadoCobro" AS ENUM ('PENDIENTE', 'PAGADO', 'EXENTO');

-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('MEDICAMENTO', 'INSUMO_MEDICO', 'VACUNA', 'ALIMENTO');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('INGRESO', 'SALIDA');

-- CreateEnum
CREATE TYPE "OrigenLead" AS ENUM ('CONTACTO', 'DEMO', 'PLAN', 'NEWSLETTER');

-- CreateEnum
CREATE TYPE "EstadoSuscripcion" AS ENUM ('PENDIENTE', 'PAGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'QR');

-- CreateEnum
CREATE TYPE "TipoDescuento" AS ENUM ('PORCENTAJE', 'MONTO');

-- CreateEnum
CREATE TYPE "EstadoRecibo" AS ENUM ('EMITIDO', 'PAGADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "TipoDetalleCobro" AS ENUM ('SERVICIO', 'FARMACIA', 'SUMINISTRO');

-- CreateEnum
CREATE TYPE "EstadoHistoria" AS ENUM ('BORRADOR', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('CITA', 'RECORDATORIO', 'SISTEMA');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "telefono" TEXT,
    "ci" TEXT,
    "rol_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "debe_cambiar_password" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Especie" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Especie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Raza" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "especie_id" TEXT NOT NULL,

    CONSTRAINT "Raza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorMascota" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "ColorMascota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alergia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Alergia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogoServicio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio_base" DECIMAL(65,30) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CatalogoServicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mascota" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "especie_id" TEXT NOT NULL,
    "raza_id" TEXT,
    "color_id" TEXT,
    "fecha_nacimiento" TIMESTAMP(3),
    "sexo" CHAR(1),
    "peso_actual" DECIMAL(65,30),
    "esterilizado" BOOLEAN NOT NULL DEFAULT false,
    "propietario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mascota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PacienteAlergia" (
    "mascota_id" TEXT NOT NULL,
    "alergia_id" TEXT NOT NULL,
    "severidad" TEXT NOT NULL,

    CONSTRAINT "PacienteAlergia_pkey" PRIMARY KEY ("mascota_id","alergia_id")
);

-- CreateTable
CREATE TABLE "Consultorio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "especialidad" TEXT,
    "tipo" "TipoSala" NOT NULL DEFAULT 'CONSULTORIO',
    "estado" "ConsultorioEstado" NOT NULL DEFAULT 'LIBRE',
    "responsable_id" TEXT,

    CONSTRAINT "Consultorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FichaAtencion" (
    "id" TEXT NOT NULL,
    "cod_ficha" TEXT NOT NULL,
    "mascota_id" TEXT NOT NULL,
    "doctor_id" TEXT,
    "consultorio_id" TEXT,
    "servicio_id" TEXT NOT NULL,
    "creado_por_id" TEXT,
    "motivo" TEXT,
    "estado" "EstadoFicha" NOT NULL DEFAULT 'ESPERA',
    "prioridad" "Prioridad" NOT NULL DEFAULT 'NORMAL',
    "estado_cobro" "EstadoCobro" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FichaAtencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL,
    "mascota_id" TEXT NOT NULL,
    "doctor_id" TEXT,
    "consultorio_id" TEXT,
    "fecha_hora" TIMESTAMP(3) NOT NULL,
    "duracion_min" INTEGER NOT NULL DEFAULT 30,
    "tipo" "TipoCita" NOT NULL DEFAULT 'CONSULTA',
    "motivo" TEXT NOT NULL,
    "notas" TEXT,
    "estado" "EstadoCita" NOT NULL DEFAULT 'PROGRAMADA',
    "recordatorio_enviado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroSOAP" (
    "id" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "motivo_detalle" TEXT,
    "anamnesis" TEXT,
    "peso" DECIMAL(65,30),
    "temperatura" DECIMAL(65,30),
    "fc" INTEGER,
    "fr" INTEGER,
    "hallazgos" TEXT,
    "diagnostico" TEXT,
    "tratamiento" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroSOAP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaProducto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo_item" "TipoProducto" NOT NULL DEFAULT 'MEDICAMENTO',

    CONSTRAINT "CategoriaProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria_id" TEXT,
    "precio_venta" DECIMAL(65,30) NOT NULL,
    "stock_actual" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumoConsulta" (
    "id" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsumoConsulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FichaServicio" (
    "id" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "servicio_id" TEXT NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FichaServicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KardexMovimiento" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "saldo_final" INTEGER NOT NULL,
    "motivo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KardexMovimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PuntoCaja" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT,

    CONSTRAINT "PuntoCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReciboCaja" (
    "id" TEXT NOT NULL,
    "num_recibo" TEXT NOT NULL,
    "ficha_id" TEXT,
    "cajero_id" TEXT NOT NULL,
    "nombre_cliente" TEXT,
    "punto_caja_id" TEXT,
    "total" DECIMAL(65,30) NOT NULL,
    "descuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tipo_descuento" "TipoDescuento",
    "metodo_pago" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',
    "monto_recibido" DECIMAL(65,30),
    "cambio_devuelto" DECIMAL(65,30),
    "estado" "EstadoRecibo" NOT NULL DEFAULT 'EMITIDO',
    "motivo_anulacion" TEXT,
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReciboCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CierreCaja" (
    "id" TEXT NOT NULL,
    "cajero_id" TEXT NOT NULL,
    "fecha_desde" TIMESTAMP(3) NOT NULL,
    "fecha_hasta" TIMESTAMP(3) NOT NULL,
    "total_efectivo" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_tarjeta" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_qr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_general" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cantidad_recibos" INTEGER NOT NULL DEFAULT 0,
    "efectivo_contado" DECIMAL(65,30),
    "diferencia" DECIMAL(65,30),
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CierreCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "empresa" TEXT,
    "mensaje" TEXT,
    "origen" "OrigenLead" NOT NULL DEFAULT 'CONTACTO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suscripcion" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "nombre" TEXT,
    "email" TEXT,
    "monto" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'usd',
    "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'PENDIENTE',
    "stripe_session_id" TEXT,
    "cuenta_provisionada" BOOLEAN NOT NULL DEFAULT false,
    "usuario_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Suscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleCobro" (
    "id" TEXT NOT NULL,
    "recibo_id" TEXT NOT NULL,
    "tipo" "TipoDetalleCobro" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio_unit" DECIMAL(65,30) NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "producto_id" TEXT,

    CONSTRAINT "DetalleCobro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriaClinica" (
    "id" TEXT NOT NULL,
    "folio" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mascota_id" TEXT NOT NULL,
    "ficha_id" TEXT,
    "atendido_por_id" TEXT,
    "propietario_nombre" TEXT,
    "domicilio" TEXT,
    "telefono" TEXT,
    "celular" TEXT,
    "edad" TEXT,
    "peso" DECIMAL(65,30),
    "motivo_consulta" TEXT,
    "vacunas_otras" TEXT,
    "desparasitacion" BOOLEAN NOT NULL DEFAULT false,
    "desparasitacion_cuando" TEXT,
    "enfermedades_previas" TEXT,
    "intervenciones_previas" TEXT,
    "estado_general" TEXT,
    "apetito" TEXT,
    "hidratacion" TEXT,
    "mucosa" TEXT,
    "ap_digestivo" TEXT,
    "ap_genitourinario" TEXT,
    "ap_respiratorio" TEXT,
    "temperatura" DECIMAL(65,30),
    "fc" INTEGER,
    "fr" INTEGER,
    "observacion_clinica" TEXT,
    "pruebas_complementarias" TEXT,
    "diagnostico_presuntivo" TEXT,
    "diagnostico_confirmativo" TEXT,
    "pronostico" TEXT,
    "tratamiento" TEXT,
    "estado" "EstadoHistoria" NOT NULL DEFAULT 'BORRADOR',
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalized_by_id" TEXT,
    "finalized_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistoriaClinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolucionTratamiento" (
    "id" TEXT NOT NULL,
    "historia_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "EvolucionTratamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vacuna" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Vacuna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriaVacuna" (
    "historia_id" TEXT NOT NULL,
    "vacuna_id" TEXT NOT NULL,
    "fecha_aplicacion" TIMESTAMP(3),

    CONSTRAINT "HistoriaVacuna_pkey" PRIMARY KEY ("historia_id","vacuna_id")
);

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

-- CreateIndex
CREATE UNIQUE INDEX "Role_nombre_key" ON "Role"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_codigo_key" ON "Permiso"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Especie_nombre_key" ON "Especie"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Raza_nombre_especie_id_key" ON "Raza"("nombre", "especie_id");

-- CreateIndex
CREATE UNIQUE INDEX "ColorMascota_descripcion_key" ON "ColorMascota"("descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "Alergia_nombre_key" ON "Alergia"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogoServicio_nombre_key" ON "CatalogoServicio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "FichaAtencion_cod_ficha_key" ON "FichaAtencion"("cod_ficha");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroSOAP_ficha_id_key" ON "RegistroSOAP"("ficha_id");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaProducto_nombre_key" ON "CategoriaProducto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "PuntoCaja_nombre_key" ON "PuntoCaja"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ReciboCaja_num_recibo_key" ON "ReciboCaja"("num_recibo");

-- CreateIndex
CREATE UNIQUE INDEX "ReciboCaja_ficha_id_key" ON "ReciboCaja"("ficha_id");

-- CreateIndex
CREATE UNIQUE INDEX "Suscripcion_stripe_session_id_key" ON "Suscripcion"("stripe_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "HistoriaClinica_folio_key" ON "HistoriaClinica"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "HistoriaClinica_ficha_id_key" ON "HistoriaClinica"("ficha_id");

-- CreateIndex
CREATE UNIQUE INDEX "Vacuna_nombre_key" ON "Vacuna"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Calificacion_ficha_id_key" ON "Calificacion"("ficha_id");

-- AddForeignKey
ALTER TABLE "RolePermiso" ADD CONSTRAINT "RolePermiso_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermiso" ADD CONSTRAINT "RolePermiso_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "Permiso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Raza" ADD CONSTRAINT "Raza_especie_id_fkey" FOREIGN KEY ("especie_id") REFERENCES "Especie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mascota" ADD CONSTRAINT "Mascota_especie_id_fkey" FOREIGN KEY ("especie_id") REFERENCES "Especie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mascota" ADD CONSTRAINT "Mascota_raza_id_fkey" FOREIGN KEY ("raza_id") REFERENCES "Raza"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mascota" ADD CONSTRAINT "Mascota_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "ColorMascota"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mascota" ADD CONSTRAINT "Mascota_propietario_id_fkey" FOREIGN KEY ("propietario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacienteAlergia" ADD CONSTRAINT "PacienteAlergia_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "Mascota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacienteAlergia" ADD CONSTRAINT "PacienteAlergia_alergia_id_fkey" FOREIGN KEY ("alergia_id") REFERENCES "Alergia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultorio" ADD CONSTRAINT "Consultorio_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaAtencion" ADD CONSTRAINT "FichaAtencion_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "Mascota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaAtencion" ADD CONSTRAINT "FichaAtencion_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaAtencion" ADD CONSTRAINT "FichaAtencion_consultorio_id_fkey" FOREIGN KEY ("consultorio_id") REFERENCES "Consultorio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaAtencion" ADD CONSTRAINT "FichaAtencion_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "CatalogoServicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaAtencion" ADD CONSTRAINT "FichaAtencion_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "Mascota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_consultorio_id_fkey" FOREIGN KEY ("consultorio_id") REFERENCES "Consultorio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroSOAP" ADD CONSTRAINT "RegistroSOAP_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "FichaAtencion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "CategoriaProducto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumoConsulta" ADD CONSTRAINT "ConsumoConsulta_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "FichaAtencion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumoConsulta" ADD CONSTRAINT "ConsumoConsulta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaServicio" ADD CONSTRAINT "FichaServicio_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "FichaAtencion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaServicio" ADD CONSTRAINT "FichaServicio_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "CatalogoServicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KardexMovimiento" ADD CONSTRAINT "KardexMovimiento_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReciboCaja" ADD CONSTRAINT "ReciboCaja_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "FichaAtencion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReciboCaja" ADD CONSTRAINT "ReciboCaja_cajero_id_fkey" FOREIGN KEY ("cajero_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReciboCaja" ADD CONSTRAINT "ReciboCaja_punto_caja_id_fkey" FOREIGN KEY ("punto_caja_id") REFERENCES "PuntoCaja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CierreCaja" ADD CONSTRAINT "CierreCaja_cajero_id_fkey" FOREIGN KEY ("cajero_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCobro" ADD CONSTRAINT "DetalleCobro_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "ReciboCaja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCobro" ADD CONSTRAINT "DetalleCobro_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriaClinica" ADD CONSTRAINT "HistoriaClinica_mascota_id_fkey" FOREIGN KEY ("mascota_id") REFERENCES "Mascota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriaClinica" ADD CONSTRAINT "HistoriaClinica_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "FichaAtencion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriaClinica" ADD CONSTRAINT "HistoriaClinica_atendido_por_id_fkey" FOREIGN KEY ("atendido_por_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriaClinica" ADD CONSTRAINT "HistoriaClinica_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriaClinica" ADD CONSTRAINT "HistoriaClinica_finalized_by_id_fkey" FOREIGN KEY ("finalized_by_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolucionTratamiento" ADD CONSTRAINT "EvolucionTratamiento_historia_id_fkey" FOREIGN KEY ("historia_id") REFERENCES "HistoriaClinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriaVacuna" ADD CONSTRAINT "HistoriaVacuna_historia_id_fkey" FOREIGN KEY ("historia_id") REFERENCES "HistoriaClinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriaVacuna" ADD CONSTRAINT "HistoriaVacuna_vacuna_id_fkey" FOREIGN KEY ("vacuna_id") REFERENCES "Vacuna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calificacion" ADD CONSTRAINT "Calificacion_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "FichaAtencion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calificacion" ADD CONSTRAINT "Calificacion_propietario_id_fkey" FOREIGN KEY ("propietario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

