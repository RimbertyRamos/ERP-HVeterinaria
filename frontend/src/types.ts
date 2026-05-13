export type ViewType = 'dashboard' | 'clinical' | 'agenda' | 'inventory' | 'pos' | 'laboratory' | 'consultorios' | 'financial' | 'settings' | 'waiting-room' | 'users' | 'consultation' | 'farmacia';

// ── Catálogos ────────────────────────────────────────────────────────
export interface Especie { id: string; nombre: string; razas: Raza[] }
export interface Raza { id: string; nombre: string; especie_id: string }
export interface ColorMascota { id: string; nombre: string }
export interface Alergia { id: string; nombre: string; descripcion?: string }
export interface CatalogoServicio { id: string; nombre: string; precio_base: string | number; duracion_min: number; descripcion?: string }
export interface CatalogoExamen { id: string; nombre: string; precio: string | number; descripcion?: string; tipo_muestra?: string }
export interface CategoriaProducto { id: string; nombre: string; descripcion?: string; tipo_item?: string }

// ── Usuarios ─────────────────────────────────────────────────────────
export interface UsuarioResumen { id: string; nombre: string; email: string; ci?: string; telefono?: string }

// ── Mascota ──────────────────────────────────────────────────────────
export interface Mascota {
  id: string;
  nombre: string;
  especie: Especie;
  raza?: Raza;
  color?: ColorMascota;
  fecha_nacimiento?: string;
  sexo: 'MACHO' | 'HEMBRA';
  propietario: UsuarioResumen;
  alergias: { alergia: Alergia }[];
}

// ── Consultorio ──────────────────────────────────────────────────────
export type TipoSala = 'CONSULTORIO' | 'LABORATORIO' | 'QUIROFANO' | 'SALA_ESPERA' | 'OTRO';

export interface Consultorio {
  id: string;
  nombre: string;
  especialidad?: string;
  tipo: TipoSala;
  estado: 'LIBRE' | 'OCUPADO' | 'MANTENIMIENTO';
  responsable_id?: string;
  responsable?: UsuarioResumen;
}

// ── Ficha de Atención ────────────────────────────────────────────────
export interface FichaAtencion {
  id: string;
  cod_ficha: string;
  fecha_hora: string;
  estado: 'ESPERA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';
  estado_cobro: 'PENDIENTE' | 'PAGADO' | 'EXENTO';
  prioridad: 'NORMAL' | 'URGENTE';
  motivo?: string;
  mascota: Mascota;
  servicio: CatalogoServicio;
  doctor?: UsuarioResumen;
  consultorio?: Consultorio;
  soap?: RegistroSOAP;
  ordenes_lab: LaboratorioOrden[];
  recibo?: ReciboCaja;
  consumos?: ConsumoConsulta[];
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
  receta?: RecetaMedica;
  consumos?: ConsumoConsulta[];
}

export interface RecetaMedica {
  id: string;
  indicaciones?: string;
  estado_entrega?: 'PENDIENTE' | 'ENTREGADO' | 'PARCIAL';
  detalles: DetalleReceta[];
}

export interface DetalleReceta {
  id: string;
  producto_id: string;
  producto: Producto;
  cantidad: number;
  instrucciones?: string;
}

// ── Producto ─────────────────────────────────────────────────────────
export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria_id: string;
  categoria: CategoriaProducto;
  precio_venta: string | number;
  stock_actual: number;
  stock_minimo: number;
}

// ── Laboratorio ──────────────────────────────────────────────────────
export interface LaboratorioOrden {
  id: string;
  cod_orden: string;
  ficha_id: string;
  examen: CatalogoExamen;
  prioridad: 'URGENTE' | 'NORMAL';
  estado: 'SOLICITADO' | 'EN_PROCESO' | 'FINALIZADO';
  resultado?: { id: string; hallazgos?: string; observaciones?: string; archivo_url?: string };
  ficha: {
    mascota: { nombre: string; propietario: { id: string; nombre: string } };
    doctor?: { id: string; nombre: string } | null;
  };
}

// ── Caja / Recibos ───────────────────────────────────────────────────
export interface ReciboCaja {
  id: string;
  num_recibo: string;
  fecha_pago: string;
  total: string | number;
  monto_recibido: string | number;
  cambio_devuelto: string | number;
  metodo_pago: 'EFECTIVO' | 'TARJETA' | 'QR';
  estado: 'PAGADO' | 'ANULADO';
  nombre_cliente?: string;
  ficha?: Pick<FichaAtencion, 'id' | 'cod_ficha'> & { mascota: Pick<Mascota, 'nombre' | 'propietario'>; servicio: CatalogoServicio };
  cajero: UsuarioResumen;
  detalles: DetalleCobro[];
}

export interface DetalleCobro {
  id: string;
  tipo: 'SERVICIO' | 'LABORATORIO' | 'FARMACIA' | 'SUMINISTRO';
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
  mascota: { id: string; nombre: string; propietario: { id: string; nombre: string } };
  servicio: CatalogoServicio;
  soap?: { receta?: { detalles: { producto: { nombre: string; precio_venta: string | number }; cantidad: number }[] } };
  ordenes_lab: { examen: CatalogoExamen }[];
  consumos?: { producto: { nombre: string; precio_venta: string | number }; cantidad: number }[];
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
export type EstadoCita = 'PROGRAMADA' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO';

export interface Cita {
  id: string;
  mascota_id: string;
  mascota: Mascota;
  doctor_id?: string;
  doctor?: UsuarioResumen;
  fecha_hora: string;
  motivo: string;
  notas?: string;
  estado: EstadoCita;
  created_at: string;
}
