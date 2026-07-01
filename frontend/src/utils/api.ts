const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

const headers = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const checkOk = async (r: Response) => {
  const data = await r.json().catch(() => null);
  if (!r.ok)
    throw new Error(data?.message ?? data?.error ?? `Error HTTP ${r.status}`);
  return data;
};

const get = (url: string) =>
  fetch(`${BASE}${url}`, { headers: headers() }).then(checkOk);
const post = (url: string, body: unknown) =>
  fetch(`${BASE}${url}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  }).then(checkOk);
const put = (url: string, body?: unknown) =>
  fetch(`${BASE}${url}`, {
    method: "PUT",
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  }).then(checkOk);
const patch = (url: string, body?: unknown) =>
  fetch(`${BASE}${url}`, {
    method: "PATCH",
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  }).then(checkOk);
const del = (url: string) =>
  fetch(`${BASE}${url}`, { method: "DELETE", headers: headers() }).then(
    checkOk,
  );

// Descarga un endpoint protegido (GET) como blob usando el token y dispara la
// descarga en el navegador. Reutilizado por la bitácora y por finanzas.
const descargarConToken = async (path: string, filename: string) => {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const api = {
  // Auth (sin checkOk — el login maneja 401 como error de credenciales)
  login: (email: string, password: string) =>
    fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then((r) => r.json()),

  // Perfil del usuario autenticado: cambiar la propia contraseña
  changePassword: (currentPassword: string, newPassword: string) =>
    patch("/perfil/password", { currentPassword, newPassword }),

  // Landing pública: leads de contacto y pago de planes (Stripe)
  crearLead: (data: unknown) => post("/leads", data),
  crearCheckout: (plan: string, email?: string) =>
    post("/checkout", { plan, email }),
  verificarCheckout: (sessionId: string) =>
    get(`/checkout/verify?session_id=${encodeURIComponent(sessionId)}`),
  // Admin: ver suscripciones y leads recibidos desde la landing
  getSuscripciones: () => get("/suscripciones"),
  getLeads: () => get("/leads"),

  // Dashboard
  getKpis: () => get("/dashboard/kpis"),

  // Mascotas
  getMascotas: (search?: string, propietario_id?: string) => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (propietario_id) p.set("propietario_id", propietario_id);
    const qs = p.toString();
    return get(`/mascotas${qs ? `?${qs}` : ""}`);
  },
  getMascota: (id: string) => get(`/mascotas/${id}`),
  createMascota: (data: unknown) => post("/mascotas", data),
  updateMascota: (id: string, data: unknown) => put(`/mascotas/${id}`, data),
  deleteMascota: (id: string) => del(`/mascotas/${id}`),

  // Fichas
  getFichas: (params?: { estado?: string; fecha?: string }) => {
    const qs = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    return get(`/fichas${qs}`);
  },
  getFicha: (id: string) => get(`/fichas/${id}`),
  createFicha: (data: unknown) => post("/fichas", data),
  updateFicha: (id: string, data: unknown) => put(`/fichas/${id}`, data),
  iniciarFicha: (
    id: string,
    data: { doctor_id: string; consultorio_id: string },
  ) => put(`/fichas/${id}/iniciar`, data),
  completarFicha: (id: string) => put(`/fichas/${id}/completar`),
  cancelarFicha: (id: string) => put(`/fichas/${id}/cancelar`),
  getSoap: (id: string) => get(`/fichas/${id}/soap`),
  upsertSoap: (id: string, data: unknown) => put(`/fichas/${id}/soap`, data),

  // Consultorios
  getConsultorios: () => get("/consultorios"),
  createConsultorio: (data: unknown) => post("/consultorios", data),
  updateConsultorio: (id: string, data: unknown) =>
    put(`/consultorios/${id}`, data),
  updateConsultorioEstado: (id: string, estado: string) =>
    put(`/consultorios/${id}/estado`, { estado }),
  deleteConsultorio: (id: string) => del(`/consultorios/${id}`),

  // Productos
  getProductos: () => get("/productos"),
  getProducto: (id: string) => get(`/productos/${id}`),
  createProducto: (data: unknown) => post("/productos", data),
  updateProducto: (id: string, data: unknown) => put(`/productos/${id}`, data),
  deleteProducto: (id: string) => del(`/productos/${id}`),
  ajustarStock: (
    id: string,
    data: { cantidad: number; tipo: "INGRESO" | "SALIDA"; motivo?: string },
  ) => post(`/productos/${id}/stock`, data),

  // Caja
  getCajaPendientes: () => get("/caja/pendientes"),
  getRecibos: () => get("/caja/recibos"),
  getRecibo: (id: string) => get(`/caja/recibos/${id}`),
  cobrarFicha: (data: {
    ficha_id: string;
    cajero_id: string;
    metodo_pago: string;
    monto_recibido: number;
    descuento?: number;
    tipo_descuento?: "MONTO" | "PORCENTAJE";
  }) => post("/caja/recibos", data),
  ventaDirecta: (data: {
    cajero_id: string;
    nombre_cliente?: string;
    metodo_pago: string;
    monto_recibido: number;
    descuento?: number;
    tipo_descuento?: "MONTO" | "PORCENTAJE";
    productos: { id: string; cantidad: number }[];
  }) => post("/caja/venta-directa", data),
  anularRecibo: (id: string, motivo_anulacion: string) =>
    put(`/caja/recibos/${id}/anular`, { motivo_anulacion }),
  // Arqueo y cierre de caja
  getArqueo: (fecha?: string) =>
    get(`/caja/arqueo${fecha ? `?fecha=${fecha}` : ""}`),
  getCierres: () => get("/caja/cierres"),
  registrarCierre: (data: unknown) => post("/caja/cierres", data),

  // Catálogos
  getEspecies: () => get("/catalogos/especies"),
  getRazas: (especie_id?: string) =>
    get(`/catalogos/razas${especie_id ? `?especie_id=${especie_id}` : ""}`),
  // Gestión de catálogos base (solo permiso gestionar_catalogos)
  createEspecie: (data: { nombre: string }) =>
    post("/catalogos/especies", data),
  updateEspecie: (id: string, data: { nombre: string }) =>
    put(`/catalogos/especies/${id}`, data),
  deleteEspecie: (id: string) => del(`/catalogos/especies/${id}`),
  createRaza: (data: { nombre: string; especie_id: string }) =>
    post("/catalogos/razas", data),
  updateRaza: (id: string, data: { nombre?: string; especie_id?: string }) =>
    put(`/catalogos/razas/${id}`, data),
  deleteRaza: (id: string) => del(`/catalogos/razas/${id}`),
  getColores: () => get("/catalogos/colores"),
  getAlergias: () => get("/catalogos/alergias"),
  getServicios: () => get("/catalogos/servicios"),
  getCategorias: () => get("/catalogos/categorias"),

  // Servicios (catálogo gestionable por Admin)
  getServiciosCatalogo: () => get("/servicios"),
  getServiciosActivos: () => get("/servicios?activos=true"),
  createServicio: (data: unknown) => post("/servicios", data),
  updateServicio: (id: string, data: unknown) => put(`/servicios/${id}`, data),
  deleteServicio: (id: string) => del(`/servicios/${id}`),

  // Servicios realizados en una ficha (consulta)
  getFichaServicios: (id: string) => get(`/fichas/${id}/servicios`),
  addFichaServicio: (
    id: string,
    data: { servicio_id: string; cantidad?: number },
  ) => post(`/fichas/${id}/servicios`, data),
  removeFichaServicio: (id: string, servicioId: string) =>
    del(`/fichas/${id}/servicios/${servicioId}`),

  // Historia clínica
  getHistoriasMascota: (mascotaId: string) =>
    get(`/historias?mascota_id=${mascotaId}`),
  getHistoriaByFicha: (fichaId: string) =>
    get(`/historias?ficha_id=${fichaId}`),
  getHistoria: (id: string) => get(`/historias/${id}`),
  createHistoria: (data: unknown) => post("/historias", data),
  updateHistoria: (id: string, data: unknown) =>
    patch(`/historias/${id}`, data),
  finalizarHistoria: (id: string) => post(`/historias/${id}/finalizar`, {}),
  deleteHistoria: (id: string) => del(`/historias/${id}`),
  getRoles: () => get("/catalogos/roles"),
  getVeterinarios: () => get("/catalogos/veterinarios"),
  getPropietarios: (search?: string) =>
    get(`/catalogos/propietarios${search ? `?search=${encodeURIComponent(search)}` : ""}`),

  // Usuarios
  getUsuarios: (rol?: string, search?: string) => {
    const p = new URLSearchParams();
    if (rol) p.set("rol", rol);
    if (search) p.set("search", search);
    const qs = p.toString();
    return get(`/usuarios${qs ? `?${qs}` : ""}`);
  },
  getUsuario: (id: string) => get(`/usuarios/${id}`),
  createUsuario: (data: unknown) => post("/usuarios", data),
  updateUsuario: (id: string, data: unknown) => put(`/usuarios/${id}`, data),
  deleteUsuario: (id: string) => del(`/usuarios/${id}`),

  // Agenda
  getCitas: (
    fecha?: string,
    doctor_id?: string,
    desde?: string,
    hasta?: string,
  ) => {
    const p = new URLSearchParams();
    if (fecha) p.set("fecha", fecha);
    if (doctor_id) p.set("doctor_id", doctor_id);
    if (desde) p.set("desde", desde);
    if (hasta) p.set("hasta", hasta);
    const qs = p.toString();
    return get(`/agenda${qs ? `?${qs}` : ""}`);
  },
  createCita: (data: unknown) => post("/agenda", data),
  getSolicitudes: () => get("/agenda/solicitudes"),
  updateCita: (id: string, data: unknown) => put(`/agenda/${id}`, data),
  updateEstadoCita: (id: string, estado: string) =>
    put(`/agenda/${id}/estado`, { estado }),
  checkInCita: (id: string) => post(`/agenda/${id}/checkin`, {}),
  deleteCita: (id: string) => del(`/agenda/${id}`),

  getDisponibilidad: (fecha: string, doctor_id?: string, duracion?: number) => {
    const p = new URLSearchParams();
    p.set("fecha", fecha);
    if (doctor_id) p.set("doctor_id", doctor_id);
    if (duracion) p.set("duracion", String(duracion));
    return get(`/agenda/disponibilidad?${p.toString()}`);
  },

  // Autoservicio del propietario (rol CLIENTE)
  getMisCitas: () => get("/agenda/mis-citas"),
  getMisMascotas: () => get("/agenda/mis-mascotas"),
  solicitarCita: (data: unknown) => post("/agenda/solicitar", data),

  // Consumos en consulta
  getConsumos: (ficha_id: string) => get(`/fichas/${ficha_id}/consumos`),
  addConsumo: (
    ficha_id: string,
    data: { producto_id: string; cantidad: number },
  ) => post(`/fichas/${ficha_id}/consumos`, data),
  removeConsumo: (ficha_id: string, consumoId: string) =>
    del(`/fichas/${ficha_id}/consumos/${consumoId}`),

  // Chatbot IA
  getEmergencyAdvice: (message: string, history: unknown[]) =>
    post("/chatbot/emergencia", { message, history }),

  // Sesión
  logout: () => post("/auth/logout", {}),

  // Notificaciones in-app (persistidas) del usuario autenticado
  getNotificaciones: () => get("/notificaciones"),
  marcarNotificacionLeida: (id: string) => patch(`/notificaciones/${id}/leida`),

  // Calificación del servicio (CU20) — el CLIENTE califica una ficha COMPLETADA
  calificar: (data: {
    ficha_id: string;
    puntaje: number;
    comentario?: string;
  }) => post("/calificaciones", data),
  getPromedioServicio: (servicioId: string) =>
    get(`/calificaciones/servicio/${servicioId}/promedio`),

  // Programación horaria de consultorios (solo permiso gestionar_horarios)
  getHorarios: (qs = "") => get(`/horarios${qs ? `?${qs}` : ""}`),
  createHorario: (data: {
    consultorio_id: string;
    doctor_id: string;
    inicio: string;
    fin: string;
    nota?: string;
  }) => post("/horarios", data),
  updateHorario: (id: string, data: unknown) => put(`/horarios/${id}`, data),
  deleteHorario: (id: string) => del(`/horarios/${id}`),

  // Bitácora / auditoría (solo permiso bitacora.ver)
  getBitacora: (qs: string) => get(`/bitacora${qs ? `?${qs}` : ""}`),
  getBitacoraById: (id: string) => get(`/bitacora/${id}`),
  getBitacoraResumen: (qs: string) =>
    get(`/bitacora/resumen${qs ? `?${qs}` : ""}`),

  // Descarga de reportes protegidos (GET → blob con el token).
  descargarBitacora: (qs: string, formato: "csv" | "pdf") =>
    descargarConToken(
      `/bitacora/reporte?${qs}${qs ? "&" : ""}formato=${formato}`,
      `bitacora-${new Date().toISOString().slice(0, 10)}.${formato}`,
    ),
  descargarReporteCaja: (qs: string, formato: "csv" | "pdf") =>
    descargarConToken(
      `/caja/reporte?${qs}${qs ? "&" : ""}formato=${formato}`,
      `finanzas-${new Date().toISOString().slice(0, 10)}.${formato}`,
    ),
};
