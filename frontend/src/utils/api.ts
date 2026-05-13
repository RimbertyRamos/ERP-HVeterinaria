const BASE = 'http://localhost:4000/api';

const headers = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const checkOk = async (r: Response) => {
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.error ?? `Error HTTP ${r.status}`);
  return data;
};

const get = (url: string) => fetch(`${BASE}${url}`, { headers: headers() }).then(checkOk);
const post = (url: string, body: unknown) =>
  fetch(`${BASE}${url}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(checkOk);
const put = (url: string, body?: unknown) =>
  fetch(`${BASE}${url}`, { method: 'PUT', headers: headers(), body: body ? JSON.stringify(body) : undefined }).then(checkOk);
const del = (url: string) => fetch(`${BASE}${url}`, { method: 'DELETE', headers: headers() }).then(checkOk);

export const api = {
  // Auth (sin checkOk — el login maneja 401 como error de credenciales)
  login: (email: string, password: string) =>
    fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(r => r.json()),

  // Dashboard
  getKpis: () => get('/dashboard/kpis'),

  // Mascotas
  getMascotas: (search?: string, propietario_id?: string) => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (propietario_id) p.set('propietario_id', propietario_id);
    const qs = p.toString();
    return get(`/mascotas${qs ? `?${qs}` : ''}`);
  },
  getMascota: (id: string) => get(`/mascotas/${id}`),
  createMascota: (data: unknown) => post('/mascotas', data),
  updateMascota: (id: string, data: unknown) => put(`/mascotas/${id}`, data),
  deleteMascota: (id: string) => del(`/mascotas/${id}`),

  // Fichas
  getFichas: (params?: { estado?: string; fecha?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return get(`/fichas${qs}`);
  },
  getFicha: (id: string) => get(`/fichas/${id}`),
  createFicha: (data: unknown) => post('/fichas', data),
  updateFicha: (id: string, data: unknown) => put(`/fichas/${id}`, data),
  iniciarFicha: (id: string, data: { doctor_id: string; consultorio_id: string }) => put(`/fichas/${id}/iniciar`, data),
  completarFicha: (id: string) => put(`/fichas/${id}/completar`),
  cancelarFicha: (id: string) => put(`/fichas/${id}/cancelar`),
  getSoap: (id: string) => get(`/fichas/${id}/soap`),
  upsertSoap: (id: string, data: unknown) => put(`/fichas/${id}/soap`, data),
  createReceta: (id: string, data: unknown) => post(`/fichas/${id}/receta`, data),

  // Consultorios
  getConsultorios: () => get('/consultorios'),
  createConsultorio: (data: unknown) => post('/consultorios', data),
  updateConsultorio: (id: string, data: unknown) => put(`/consultorios/${id}`, data),
  updateConsultorioEstado: (id: string, estado: string) => put(`/consultorios/${id}/estado`, { estado }),
  deleteConsultorio: (id: string) => del(`/consultorios/${id}`),

  // Productos
  getProductos: () => get('/productos'),
  getProducto: (id: string) => get(`/productos/${id}`),
  createProducto: (data: unknown) => post('/productos', data),
  updateProducto: (id: string, data: unknown) => put(`/productos/${id}`, data),
  deleteProducto: (id: string) => del(`/productos/${id}`),
  ajustarStock: (id: string, data: { cantidad: number; tipo: 'INGRESO' | 'SALIDA'; motivo?: string }) =>
    post(`/productos/${id}/stock`, data),

  // Caja
  getCajaPendientes: () => get('/caja/pendientes'),
  getRecibos: () => get('/caja/recibos'),
  getRecibo: (id: string) => get(`/caja/recibos/${id}`),
  cobrarFicha: (data: { ficha_id: string; cajero_id: string; metodo_pago: string; monto_recibido: number }) =>
    post('/caja/recibos', data),
  ventaDirecta: (data: { cajero_id: string; nombre_cliente?: string; metodo_pago: string; monto_recibido: number; productos: { id: string; cantidad: number }[] }) =>
    post('/caja/venta-directa', data),
  anularRecibo: (id: string, motivo_anulacion: string) => put(`/caja/recibos/${id}/anular`, { motivo_anulacion }),

  // Laboratorio
  getOrdenes: (estado?: string) => get(`/laboratorio${estado ? `?estado=${estado}` : ''}`),
  createOrden: (data: unknown) => post('/laboratorio', data),
  updateEstadoOrden: (id: string, estado: string) => put(`/laboratorio/${id}/estado`, { estado }),
  cargarResultado: (id: string, data: unknown) => post(`/laboratorio/${id}/resultado`, data),

  // Catálogos
  getEspecies: () => get('/catalogos/especies'),
  getRazas: (especie_id?: string) => get(`/catalogos/razas${especie_id ? `?especie_id=${especie_id}` : ''}`),
  getColores: () => get('/catalogos/colores'),
  getAlergias: () => get('/catalogos/alergias'),
  getServicios: () => get('/catalogos/servicios'),
  getExamenes: () => get('/catalogos/examenes'),
  getCategorias: () => get('/catalogos/categorias'),
  getRoles: () => get('/catalogos/roles'),

  // Usuarios
  getUsuarios: (rol?: string, search?: string) => {
    const p = new URLSearchParams();
    if (rol) p.set('rol', rol);
    if (search) p.set('search', search);
    const qs = p.toString();
    return get(`/usuarios${qs ? `?${qs}` : ''}`);
  },
  getUsuario: (id: string) => get(`/usuarios/${id}`),
  createUsuario: (data: unknown) => post('/usuarios', data),
  updateUsuario: (id: string, data: unknown) => put(`/usuarios/${id}`, data),
  deleteUsuario: (id: string) => del(`/usuarios/${id}`),

  // Agenda
  getCitas: (fecha?: string, doctor_id?: string) => {
    const p = new URLSearchParams();
    if (fecha) p.set('fecha', fecha);
    if (doctor_id) p.set('doctor_id', doctor_id);
    const qs = p.toString();
    return get(`/agenda${qs ? `?${qs}` : ''}`);
  },
  createCita: (data: unknown) => post('/agenda', data),
  updateCita: (id: string, data: unknown) => put(`/agenda/${id}`, data),
  updateEstadoCita: (id: string, estado: string) => put(`/agenda/${id}/estado`, { estado }),
  checkInCita: (id: string) => post(`/agenda/${id}/checkin`, {}),
  deleteCita: (id: string) => del(`/agenda/${id}`),

  // Consumos en consulta
  getConsumos: (ficha_id: string) => get(`/fichas/${ficha_id}/consumos`),
  addConsumo: (ficha_id: string, data: { producto_id: string; cantidad: number }) =>
    post(`/fichas/${ficha_id}/consumos`, data),
  removeConsumo: (ficha_id: string, consumoId: string) =>
    del(`/fichas/${ficha_id}/consumos/${consumoId}`),

  // Farmacia
  getRecetasPendientes: () => get('/farmacia/recetas'),
  dispensarReceta: (id: string) => put(`/farmacia/recetas/${id}/dispensar`, {}),

  // Chatbot IA
  getEmergencyAdvice: (message: string, history: unknown[]) => post('/chatbot/emergencia', { message, history }),
};
