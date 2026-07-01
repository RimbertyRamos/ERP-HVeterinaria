export type ViewType =
  | "dashboard"
  | "clinical"
  | "agenda"
  | "inventory"
  | "pos"
  | "consultorios"
  | "financial"
  | "settings"
  | "waiting-room"
  | "users"
  | "servicios"
  | "consultation"
  | "solicitudes"
  | "bitacora"
  | "catalogos"
  | "horarios";

// ── Catálogos ────────────────────────────────────────────────────────
export interface Especie {
  id: string;
  nombre: string;
  razas: Raza[];
}
export interface Raza {
  id: string;
  nombre: string;
  especie_id: string;
}
export interface ColorMascota {
  id: string;
  nombre: string;
}
export interface Alergia {
  id: string;
  nombre: string;
  descripcion?: string;
}
export interface CatalogoServicio {
  id: string;
  nombre: string;
  precio_base: string | number;
  duracion_min?: number;
  descripcion?: string;
  activo?: boolean;
}
export interface CategoriaProducto {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo_item?: string;
}

// ── Usuarios ─────────────────────────────────────────────────────────
export interface UsuarioResumen {
  id: string;
  nombre: string;
  email: string;
  ci?: string;
  telefono?: string;
}

// ── Mascota ──────────────────────────────────────────────────────────
export interface Mascota {
  id: string;
  nombre: string;
  especie: Especie;
  raza?: Raza;
  color?: ColorMascota;
  fecha_nacimiento?: string;
  sexo: "MACHO" | "HEMBRA";
  propietario: UsuarioResumen;
  alergias: { alergia: Alergia }[];
}

// ── Consultorio ──────────────────────────────────────────────────────
export type TipoSala =
  | "CONSULTORIO"
  | "LABORATORIO"
  | "QUIROFANO"
  | "SALA_ESPERA"
  | "OTRO";

export interface Consultorio {
  id: string;
  nombre: string;
  especialidad?: string;
  tipo: TipoSala;
  estado: "LIBRE" | "OCUPADO" | "LIMPIEZA";
  responsable_id?: string;
  responsable?: UsuarioResumen;
}

// ── Ficha de Atención ────────────────────────────────────────────────
export interface FichaAtencion {
  id: string;
  cod_ficha: string;
  fecha_hora: string;
  estado: "ESPERA" | "EN_CURSO" | "COMPLETADA" | "CANCELADA";
  estado_cobro: "PENDIENTE" | "PAGADO" | "EXENTO";
  prioridad: "NORMAL" | "URGENTE";
  motivo?: string;
  mascota: Mascota;
  servicio: CatalogoServicio;
  doctor?: UsuarioResumen;
  consultorio?: Consultorio;
  soap?: RegistroSOAP;
  recibo?: ReciboCaja;
  consumos?: ConsumoConsulta[];
  servicios_realizados?: FichaServicio[];
}

// ── Servicios realizados en la consulta ──────────────────────────────
export interface FichaServicio {
  id: string;
  servicio_id: string;
  servicio: CatalogoServicio;
  precio: string | number;
  cantidad: number;
}

// ── Historia Clínica (ficha de consulta externa) ─────────────────────
export type EstadoHistoria = "BORRADOR" | "FINALIZADA";

export interface EvolucionTratamiento {
  id?: string;
  fecha?: string;
  descripcion: string;
}

export interface HistoriaResumen {
  id: string;
  folio: number;
  fecha: string;
  motivo_consulta?: string | null;
  diagnostico_presuntivo?: string | null;
  diagnostico_confirmativo?: string | null;
  estado: EstadoHistoria;
  atendido_por?: { nombre: string } | null;
}

export interface HistoriaClinica {
  id: string;
  folio: number;
  fecha: string;
  mascota_id: string;
  ficha_id?: string | null;
  estado: EstadoHistoria;

  propietario_nombre?: string | null;
  domicilio?: string | null;
  telefono?: string | null;
  celular?: string | null;
  edad?: string | null;
  peso?: string | number | null;

  motivo_consulta?: string | null;
  vacunas?: string[];
  vacunas_otras?: string | null;
  desparasitacion?: boolean;
  desparasitacion_cuando?: string | null;
  enfermedades_previas?: string | null;
  intervenciones_previas?: string | null;

  estado_general?: string | null;
  apetito?: string | null;
  hidratacion?: string | null;
  mucosa?: string | null;
  ap_digestivo?: string | null;
  ap_genitourinario?: string | null;
  ap_respiratorio?: string | null;
  temperatura?: string | number | null;
  fc?: number | null;
  fr?: number | null;
  observacion_clinica?: string | null;
  pruebas_complementarias?: string | null;
  diagnostico_presuntivo?: string | null;
  diagnostico_confirmativo?: string | null;
  pronostico?: string | null;
  tratamiento?: string | null;

  evoluciones?: EvolucionTratamiento[];
  mascota?: Mascota;
  atendido_por?: { id: string; nombre: string } | null;
  created_by?: { id: string; nombre: string } | null;
  finalized_by?: { id: string; nombre: string } | null;
  created_at?: string;
  finalized_at?: string | null;
}

// ── Consumos ──────────────────────────────────────────────────────────
export interface ConsumoConsulta {
  id: string;
  ficha_id: string;
  producto_id: string;
  cantidad: number;
  observacion?: string;
  creado_por: string;
  creado_en: string;
  producto: Producto;
}

// ── SOAP ─────────────────────────────────────────────────────────────
export interface RegistroSOAP {
  id: string;
  ficha_id: string;
  peso?: number;
  temperatura?: number;
  fc?: number;
  fr?: number;
  diagnostico?: string;
  tratamiento?: string;
  consumos?: ConsumoConsulta[];
}

// ── Producto ─────────────────────────────────────────────────────────
export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria_id?: string | null;
  categoria?: CategoriaProducto | null;
  precio_venta: string | number;
  stock_actual: number;
  stock_minimo: number;
}

// ── Caja / Recibos ───────────────────────────────────────────────────
export interface ReciboCaja {
  id: string;
  num_recibo: string;
  fecha_pago: string;
  total: string | number;
  monto_recibido: string | number;
  cambio_devuelto: string | number;
  metodo_pago: "EFECTIVO" | "TARJETA" | "QR";
  estado: "PAGADO" | "ANULADO";
  nombre_cliente?: string;
  ficha?: Pick<FichaAtencion, "id" | "cod_ficha"> & {
    mascota: Pick<Mascota, "nombre" | "propietario">;
    servicio: CatalogoServicio;
  };
  cajero: UsuarioResumen;
  detalles: DetalleCobro[];
}

export interface DetalleCobro {
  id: string;
  tipo: "SERVICIO" | "FARMACIA" | "SUMINISTRO";
  descripcion: string;
  precio_unit: string | number;
  cantidad: number;
  subtotal: string | number;
}

// ── Ficha pendiente de cobro (vista POS) ─────────────────────────────
export interface FichaPendiente {
  id: string;
  cod_ficha: string;
  fecha_hora: string;
  motivo?: string;
  mascota: {
    id: string;
    nombre: string;
    propietario: { id: string; nombre: string };
  };
  servicio: CatalogoServicio;
  servicios_realizados?: {
    servicio: { nombre: string };
    precio: string | number;
    cantidad: number;
  }[];
  consumos?: {
    producto: { nombre: string; precio_venta: string | number };
    cantidad: number;
  }[];
}

// ── Dashboard KPIs ───────────────────────────────────────────────────
export interface DashboardKpis {
  fichas_hoy: number;
  en_espera: number;
  en_curso: number;
  consultorios: Consultorio[];
  stock_critico: number;
  productos_criticos: Producto[];
  ingresos_hoy: number;
  recibos_recientes: ReciboCaja[];
  total_mascotas: number;
  semana: { dia: string; ingresos: number; fichas: number }[];
}

// ── Agenda ───────────────────────────────────────────────────────────
export type EstadoCita =
  | "SOLICITADA"
  | "PROGRAMADA"
  | "CONFIRMADA"
  | "COMPLETADA"
  | "CANCELADA"
  | "NO_ASISTIO";

export type TipoCita =
  | "CONSULTA"
  | "CONTROL"
  | "VACUNACION"
  | "CIRUGIA"
  | "PELUQUERIA"
  | "OTRO";

export interface Cita {
  id: string;
  mascota_id: string;
  mascota: Mascota;
  doctor_id?: string;
  doctor?: UsuarioResumen;
  consultorio_id?: string;
  fecha_hora: string;
  duracion_min?: number;
  tipo?: TipoCita;
  motivo: string;
  notas?: string;
  estado: EstadoCita;
  created_at: string;
}
