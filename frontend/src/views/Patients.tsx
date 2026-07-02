import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icons } from "../constants";
import { cn } from "../utils/cn";
import { api } from "../utils/api";
import { toast } from "sonner";
import type { HistoriaResumen, HistoriaClinica } from "../types";
import { HistoriaClinicaFicha } from "../components/HistoriaClinicaFicha";
import { MascotaCarnet } from "../components/MascotaCarnet";

interface EspecieObj {
  id: string;
  nombre: string;
}
interface RazaObj {
  id: string;
  nombre: string;
  especie_id: string;
}

interface Mascota {
  id: string;
  nombre: string;
  especie: EspecieObj | string;
  raza: RazaObj | string | null;
  fecha_nacimiento: string | null;
  sexo: string;
  peso_actual: number | null;
  alergias: unknown;
  propietario: {
    id: string;
    nombre: string;
    email: string;
    telefono: string | null;
    ci?: string | null;
  };
  fichas?: {
    id: string;
    fecha_hora: string;
    servicio?: { nombre: string };
    estado: string;
    doctor?: { nombre: string } | null;
    consultorio?: { nombre: string } | null;
    soap?: { diagnostico: string | null; tratamiento: string | null } | null;
  }[];
}

interface PropietarioResult {
  id: string;
  nombre: string;
  email: string;
  ci?: string | null;
  telefono?: string | null;
  _count?: { mascotas: number };
}

const especieNombre = (e: EspecieObj | string | null | undefined): string =>
  !e ? "" : typeof e === "string" ? e : e.nombre;

const razaNombre = (r: RazaObj | string | null | undefined): string =>
  !r ? "" : typeof r === "string" ? r : r.nombre;

const speciesEmojis: Record<string, string> = {
  Perro: "🐕",
  Gato: "🐈",
  Ave: "🦜",
  Conejo: "🐇",
  Reptil: "🦎",
  Hamster: "🐹",
  Pez: "🐠",
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Mascota[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Mascota | null>(null);
  const [view, setView] = useState<"list" | "detail" | "new">("list");
  const [detailTab, setDetailTab] = useState<"history" | "soap">("history");
  const [historias, setHistorias] = useState<HistoriaResumen[]>([]);
  const [historiaAbierta, setHistoriaAbierta] =
    useState<HistoriaClinica | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [especies, setEspecies] = useState<EspecieObj[]>([]);
  const [razas, setRazas] = useState<RazaObj[]>([]);

  // Formulario nuevo paciente
  const [propietarioMode, setPropietarioMode] = useState<"nuevo" | "existente">(
    "nuevo",
  );
  const [propietarioSearch, setPropietarioSearch] = useState("");
  const [propietarioResults, setPropietarioResults] = useState<
    PropietarioResult[]
  >([]);
  const [selectedPropietarioId, setSelectedPropietarioId] = useState("");
  const [selectedPropietario, setSelectedPropietario] =
    useState<PropietarioResult | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    especie_id: "",
    raza_id: "",
    sexo: "M",
    fecha_nacimiento: "",
    peso_actual: "",
    alergias: "",
    propietario_nombre: "",
    propietario_email: "",
    propietario_telefono: "",
    propietario_ci: "",
  });

  const [soapForm, setSoapForm] = useState({
    motivo: "",
    diagnostico: "",
    tratamiento: "",
    hallazgos: "",
    peso: "",
    temp: "",
    fc: "",
    fr: "",
  });
  const [isSavingSoap, setIsSavingSoap] = useState(false);

  useEffect(() => {
    // La carga inicial del listado la dispara el efecto de búsqueda (debounce).
    api.getEspecies().then(setEspecies).catch(console.error);
  }, []);

  useEffect(() => {
    if (!form.especie_id) {
      setRazas([]);
      return;
    }
    api.getRazas(form.especie_id).then(setRazas).catch(console.error);
    setForm((f) => ({ ...f, raza_id: "" }));
  }, [form.especie_id]);

  const PAGE_SIZE = 20;
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Consulta server-side (paginada + liviana). El detalle sigue usando su propio
  // endpoint con datos completos (selectPatient → api.getMascota).
  const fetchList = useCallback(async (q: string, pg: number) => {
    setLoading(true);
    try {
      const res: any = await api.buscarMascotas({
        q: q.trim() || undefined,
        page: pg,
        pageSize: PAGE_SIZE,
      });
      setPatients(res.items ?? []);
      setTotal(res.total ?? 0);
      setPage(res.page ?? pg);
    } catch (err: any) {
      toast.error(err.message ?? "Error cargando pacientes");
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresca la vista actual (misma búsqueda y página) tras crear/emitir/eliminar.
  const loadPatients = () => fetchList(searchQuery, page);

  // Búsqueda con debounce (~350ms); al escribir vuelve a la página 1.
  useEffect(() => {
    const t = setTimeout(() => fetchList(searchQuery, 1), 350);
    return () => clearTimeout(t);
  }, [searchQuery, fetchList]);

  const irAPagina = (pg: number) => {
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (pg < 1 || pg > totalPages) return;
    fetchList(searchQuery, pg);
  };

  const selectPatient = async (id: string) => {
    try {
      const data = await api.getMascota(id);
      setSelectedPatient(data);
      setDetailTab("history");
      setView("detail");
      api
        .getHistoriasMascota(id)
        .then(setHistorias)
        .catch(() => setHistorias([]));
    } catch (err: any) {
      toast.error(err.message ?? "Error cargando paciente");
    }
  };

  const openHistoria = async (id: string) => {
    try {
      setHistoriaAbierta(await api.getHistoria(id));
    } catch (e: any) {
      toast.error(e.message ?? "Error al abrir la historia clínica");
    }
  };

  const emitTicket = async (mascotaId: string, mascotaNombre: string) => {
    try {
      const servicios = await api.getServicios();
      const serv =
        (servicios as any[]).find(
          (s) => s.nombre.toLowerCase() === "consulta general",
        ) ||
        (servicios as any[]).find((s) =>
          s.nombre.toLowerCase().includes("consulta"),
        ) ||
        servicios[0];
      if (!serv) throw new Error("No hay servicios configurados en el sistema");
      await api.createFicha({
        mascota_id: mascotaId,
        servicio_id: serv.id,
        motivo: "INGRESO MANUAL POR RECEPCIÓN",
      });
      toast.success(`Turno emitido para ${mascotaNombre}`);
      if (selectedPatient?.id === mascotaId) {
        selectPatient(mascotaId);
      } else {
        loadPatients();
      }
    } catch (err: any) {
      toast.error(err.message ?? "Error al emitir el turno");
    }
  };

  const handleSearchPropietario = async () => {
    if (!propietarioSearch.trim()) return;
    try {
      const results = await api.getPropietarios(propietarioSearch.trim());
      setPropietarioResults(results as PropietarioResult[]);
      if ((results as PropietarioResult[]).length === 0) {
        toast.info("No se encontró ningún propietario con esos datos");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Error buscando propietario");
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (propietarioMode === "existente" && !selectedPropietarioId) {
      toast.error("Debes seleccionar un propietario existente");
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        mascota: {
          nombre: form.nombre,
          especie_id: form.especie_id,
          raza_id: form.raza_id || undefined,
          sexo: form.sexo,
          fecha_nacimiento: form.fecha_nacimiento || undefined,
          peso_actual: form.peso_actual
            ? parseFloat(form.peso_actual)
            : undefined,
        },
      };

      if (propietarioMode === "existente") {
        payload.propietario_id = selectedPropietarioId;
      } else {
        payload.propietario = {
          nombre: form.propietario_nombre,
          email: form.propietario_email,
          telefono: form.propietario_telefono || undefined,
          ci: form.propietario_ci || undefined,
        };
      }

      const mascota = await api.createMascota(payload);
      toast.success(`Paciente ${mascota.nombre} registrado correctamente`);
      await emitTicket(mascota.id, mascota.nombre);

      // Reset
      setForm({
        nombre: "",
        especie_id: "",
        raza_id: "",
        sexo: "M",
        fecha_nacimiento: "",
        peso_actual: "",
        alergias: "",
        propietario_nombre: "",
        propietario_email: "",
        propietario_telefono: "",
        propietario_ci: "",
      });
      setPropietarioMode("nuevo");
      setPropietarioSearch("");
      setPropietarioResults([]);
      setSelectedPropietarioId("");
      setSelectedPropietario(null);
      setView("list");
      loadPatients();
    } catch (err: any) {
      toast.error(err.message ?? "Error al registrar paciente");
    }
  };

  const handleSaveSoap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setIsSavingSoap(true);
    try {
      const servicios = await api.getServicios();
      const servConsulta =
        (servicios as any[]).find(
          (s) => s.nombre.toLowerCase() === "consulta general",
        ) ||
        (servicios as any[]).find((s) =>
          s.nombre.toLowerCase().includes("consulta"),
        ) ||
        servicios[0];

      const ficha = await api.createFicha({
        mascota_id: selectedPatient.id,
        servicio_id: servConsulta?.id,
        motivo: soapForm.motivo,
      });

      await api.upsertSoap(ficha.id, {
        motivo_detalle: soapForm.motivo,
        hallazgos: soapForm.hallazgos,
        diagnostico: soapForm.diagnostico,
        tratamiento: soapForm.tratamiento,
        peso: soapForm.peso ? parseFloat(soapForm.peso) : undefined,
        temperatura: soapForm.temp ? parseFloat(soapForm.temp) : undefined,
        fc: soapForm.fc ? parseInt(soapForm.fc) : undefined,
        fr: soapForm.fr ? parseInt(soapForm.fr) : undefined,
      });

      await api.completarFicha(ficha.id);
      toast.success("Consulta finalizada correctamente");

      setSoapForm({
        motivo: "",
        diagnostico: "",
        tratamiento: "",
        hallazgos: "",
        peso: "",
        temp: "",
        fc: "",
        fr: "",
      });
      setDetailTab("history");
      await selectPatient(selectedPatient.id);
    } catch (err: any) {
      toast.error(err.message ?? "Error al guardar la consulta");
    }
    setIsSavingSoap(false);
  };

  // ─── Vista: FORMULARIO NUEVO PACIENTE ──────────────────────────────────
  if (view === "new") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 max-w-3xl mx-auto space-y-6"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView("list")}
            className="text-muted hover:text-brand-ink transition-colors"
          >
            <Icons.ArrowRight className="rotate-180" size={20} />
          </button>
          <h2 className="text-2xl font-bold text-ink">
            Registrar Nuevo Paciente
          </h2>
        </div>

        <form onSubmit={handleCreatePatient} className="space-y-6">
          {/* Datos de la mascota */}
          <div className="bg-surface rounded-card border border-line p-6 space-y-4">
            <h3 className="font-bold text-ink border-b border-line pb-2">
              Datos de la Mascota
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre *
                </label>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Especie *
                </label>
                <select
                  required
                  value={form.especie_id}
                  onChange={(e) =>
                    setForm({ ...form, especie_id: e.target.value })
                  }
                  className="w-full bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                >
                  <option value="">— Seleccionar —</option>
                  {especies.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Raza</label>
                <select
                  value={form.raza_id}
                  onChange={(e) =>
                    setForm({ ...form, raza_id: e.target.value })
                  }
                  disabled={razas.length === 0}
                  className="w-full bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none disabled:opacity-50"
                >
                  <option value="">— Sin especificar —</option>
                  {razas.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sexo *</label>
                <select
                  value={form.sexo}
                  onChange={(e) => setForm({ ...form, sexo: e.target.value })}
                  className="w-full bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                >
                  <option value="M">Macho</option>
                  <option value="H">Hembra</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fecha Nacimiento
                </label>
                <input
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(e) =>
                    setForm({ ...form, fecha_nacimiento: e.target.value })
                  }
                  className="w-full bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.peso_actual}
                  onChange={(e) =>
                    setForm({ ...form, peso_actual: e.target.value })
                  }
                  className="w-full bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                />
              </div>
            </div>
          </div>

          {/* Propietario */}
          <div className="bg-surface rounded-card border border-line p-6 space-y-4">
            <h3 className="font-bold text-ink border-b border-line pb-2">
              Propietario
            </h3>

            {/* Toggle modo */}
            <div className="flex rounded-lg overflow-hidden border border-line w-fit">
              <button
                type="button"
                onClick={() => {
                  setPropietarioMode("nuevo");
                  setSelectedPropietarioId("");
                  setSelectedPropietario(null);
                }}
                className={cn(
                  "px-4 py-2 text-sm font-bold transition-colors",
                  propietarioMode === "nuevo"
                    ? "bg-brand text-white"
                    : "bg-surface text-muted hover:bg-surface-2",
                )}
              >
                Crear nuevo propietario
              </button>
              <button
                type="button"
                onClick={() => {
                  setPropietarioMode("existente");
                }}
                className={cn(
                  "px-4 py-2 text-sm font-bold transition-colors",
                  propietarioMode === "existente"
                    ? "bg-brand text-white"
                    : "bg-surface text-muted hover:bg-surface-2",
                )}
              >
                Propietario ya registrado
              </button>
            </div>

            {propietarioMode === "nuevo" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nombre Propietario *
                  </label>
                  <input
                    required
                    value={form.propietario_nombre}
                    onChange={(e) =>
                      setForm({ ...form, propietario_nombre: e.target.value })
                    }
                    className="w-full bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={form.propietario_email}
                    onChange={(e) =>
                      setForm({ ...form, propietario_email: e.target.value })
                    }
                    className="w-full bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Teléfono
                  </label>
                  <input
                    value={form.propietario_telefono}
                    onChange={(e) =>
                      setForm({ ...form, propietario_telefono: e.target.value })
                    }
                    className="w-full bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    CI / Carnet
                  </label>
                  <input
                    autoComplete="off"
                    value={form.propietario_ci}
                    onChange={(e) =>
                      setForm({ ...form, propietario_ci: e.target.value })
                    }
                    className="w-full bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] text-muted">
                    Se creará una cuenta de acceso para el propietario con la
                    contraseña temporal <strong>123456</strong>. El propietario
                    podrá cambiarla desde <strong>Mi Perfil</strong> cuando
                    inicie sesión.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, CI o correo..."
                    value={propietarioSearch}
                    onChange={(e) => setPropietarioSearch(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleSearchPropietario())
                    }
                    className="flex-1 bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSearchPropietario}
                    className="px-4 py-2 bg-surface-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-brand hover:text-white transition-colors"
                  >
                    <Icons.Search size={16} /> Buscar
                  </button>
                </div>

                {propietarioResults.length > 0 && (
                  <div className="border border-line rounded-lg overflow-hidden">
                    {propietarioResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPropietarioId(p.id);
                          setSelectedPropietario(p);
                          setPropietarioResults([]);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 border-b border-line last:border-0 hover:bg-brand-soft/30 transition-colors",
                          selectedPropietarioId === p.id
                            ? "bg-brand-soft"
                            : "bg-surface",
                        )}
                      >
                        <p className="font-bold text-sm">{p.nombre}</p>
                        <p className="text-xs text-muted">
                          {p.email}
                          {p.ci ? ` · CI: ${p.ci}` : ""}
                        </p>
                        {p._count && (
                          <p className="text-xs text-brand-ink font-bold mt-0.5">
                            {p._count.mascotas} mascota
                            {p._count.mascotas !== 1 ? "s" : ""} registrada
                            {p._count.mascotas !== 1 ? "s" : ""}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {selectedPropietario && (
                  <div className="p-4 bg-brand-soft/30 border border-brand/20 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-brand-ink">
                        {selectedPropietario.nombre}
                      </p>
                      <p className="text-xs text-muted">
                        {selectedPropietario.email}
                      </p>
                      {selectedPropietario._count && (
                        <p className="text-xs text-muted mt-0.5">
                          {selectedPropietario._count.mascotas} mascota
                          {selectedPropietario._count.mascotas !== 1 ? "s" : ""}{" "}
                          registrada
                          {selectedPropietario._count.mascotas !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPropietarioId("");
                        setSelectedPropietario(null);
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Icons.X size={18} />
                    </button>
                  </div>
                )}

                {propietarioMode === "existente" && !selectedPropietarioId && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                    Busca y selecciona un propietario registrado para continuar
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setView("list")}
              className="px-6 py-2 rounded-lg border border-line text-muted font-bold hover:bg-surface-2 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-brand text-white font-bold hover:bg-brand-strong transition-colors"
            >
              Registrar y Dar Turno
            </button>
          </div>
        </form>
      </motion.div>
    );
  }

  // ─── Vista: DETALLE DE PACIENTE ────────────────────────────────────────
  if (view === "detail" && selectedPatient) {
    const isInQueue = selectedPatient.fichas?.some(
      (f) => f.estado === "ESPERA" || f.estado === "EN_CURSO",
    );

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col h-full overflow-hidden"
      >
        {/* Info del paciente */}
        <div className="flex-shrink-0 bg-surface border-b border-line px-8 py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-5">
              <button
                onClick={() => setView("list")}
                className="text-muted hover:text-brand-ink transition-colors flex-shrink-0"
              >
                <Icons.ArrowRight className="rotate-180" size={20} />
              </button>
              <div className="h-16 w-16 rounded-2xl bg-surface-2 flex items-center justify-center text-3xl flex-shrink-0">
                {speciesEmojis[especieNombre(selectedPatient.especie)] ?? "🐾"}
              </div>
              <div>
                <h2 className="text-2xl font-black text-ink">
                  {selectedPatient.nombre}
                </h2>
                <p className="text-sm text-muted">
                  {especieNombre(selectedPatient.especie)}
                  {razaNombre(selectedPatient.raza)
                    ? ` · ${razaNombre(selectedPatient.raza)}`
                    : ""}
                  {selectedPatient.sexo
                    ? ` · ${selectedPatient.sexo === "M" ? "Macho" : "Hembra"}`
                    : ""}
                  {selectedPatient.peso_actual
                    ? ` · ${selectedPatient.peso_actual} kg`
                    : ""}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Icons.User size={14} className="text-slate-400" />
                <span className="font-bold text-ink text-sm">
                  {selectedPatient.propietario.nombre}
                </span>
              </div>
              {selectedPatient.propietario.email && (
                <p className="text-xs text-muted">
                  {selectedPatient.propietario.email}
                </p>
              )}
              {selectedPatient.propietario.telefono && (
                <p className="text-xs text-muted">
                  {selectedPatient.propietario.telefono}
                </p>
              )}
              <div className="mt-3 flex items-center justify-end gap-2">
                <MascotaCarnet mascota={selectedPatient} />
                {isInQueue ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-black uppercase tracking-widest">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />{" "}
                    En cola de espera
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      emitTicket(selectedPatient.id, selectedPatient.nombre)
                    }
                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Emitir Turno
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 border-b border-line -mb-[1px]">
            <button
              onClick={() => setDetailTab("history")}
              className={cn(
                "px-5 py-2.5 text-sm font-bold border-b-2 transition-colors",
                detailTab === "history"
                  ? "border-brand text-brand-ink"
                  : "border-transparent text-muted hover:text-ink",
              )}
            >
              <Icons.History size={14} className="inline mr-1.5" />
              Historia Clínica ({historias.length})
            </button>
            <button
              onClick={() => setDetailTab("soap")}
              className={cn(
                "px-5 py-2.5 text-sm font-bold border-b-2 transition-colors",
                detailTab === "soap"
                  ? "border-brand text-brand-ink"
                  : "border-transparent text-muted hover:text-ink",
              )}
            >
              <Icons.FileText size={14} className="inline mr-1.5" />
              Nueva Atención
            </button>
          </div>
        </div>

        {/* Contenido del tab */}
        <div className="flex-1 overflow-y-auto bg-bg p-8">
          <AnimatePresence mode="wait">
            {detailTab === "history" ? (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-3xl mx-auto space-y-4"
              >
                <h3 className="text-sm font-black text-muted uppercase tracking-widest mb-6">
                  Historias Clínicas · {historias.length} registro
                  {historias.length === 1 ? "" : "s"}
                </h3>
                {historias.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 opacity-30 space-y-3">
                    <Icons.FileText size={56} />
                    <p className="font-bold text-lg">Sin historias clínicas</p>
                    <p className="text-sm">
                      Las historias se generan al atender al paciente en "Mi
                      Consulta".
                    </p>
                  </div>
                ) : (
                  historias.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => openHistoria(h.id)}
                      className="w-full text-left bg-surface rounded-card border border-line p-5 hover:border-brand/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs font-black text-brand-ink block">
                            {formatDate(h.fecha)} · Nº{" "}
                            {String(h.folio).padStart(6, "0")}
                          </span>
                          <h4 className="font-bold text-ink">
                            {h.motivo_consulta || "Consulta"}
                          </h4>
                          {h.atendido_por?.nombre && (
                            <p className="text-xs text-muted mt-0.5">
                              {h.atendido_por.nombre}
                            </p>
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border",
                            h.estado === "FINALIZADA"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400"
                              : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
                          )}
                        >
                          {h.estado === "FINALIZADA" ? "Finalizada" : "Borrador"}
                        </span>
                      </div>
                      {(h.diagnostico_confirmativo ||
                        h.diagnostico_presuntivo) && (
                        <p className="text-sm text-ink mt-2 pt-2 border-t border-line">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">
                            Diagnóstico
                          </span>
                          {h.diagnostico_confirmativo ||
                            h.diagnostico_presuntivo}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="soap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-3xl mx-auto"
              >
                <h3 className="text-sm font-black text-muted uppercase tracking-widest mb-6">
                  Nueva Atención Clínica para {selectedPatient.nombre}
                </h3>
                <form onSubmit={handleSaveSoap} className="space-y-5">
                  <div className="bg-surface rounded-card border border-line p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">
                        Motivo de consulta *
                      </label>
                      <input
                        required
                        value={soapForm.motivo}
                        onChange={(e) =>
                          setSoapForm({ ...soapForm, motivo: e.target.value })
                        }
                        placeholder="Ej: Control de rutina, vacunación, malestar general..."
                        className="w-full bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1 text-muted">
                          Peso (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={soapForm.peso}
                          onChange={(e) =>
                            setSoapForm({ ...soapForm, peso: e.target.value })
                          }
                          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-muted">
                          Temp (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={soapForm.temp}
                          onChange={(e) =>
                            setSoapForm({ ...soapForm, temp: e.target.value })
                          }
                          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-muted">
                          FC (lpm)
                        </label>
                        <input
                          type="number"
                          value={soapForm.fc}
                          onChange={(e) =>
                            setSoapForm({ ...soapForm, fc: e.target.value })
                          }
                          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-muted">
                          FR (rpm)
                        </label>
                        <input
                          type="number"
                          value={soapForm.fr}
                          onChange={(e) =>
                            setSoapForm({ ...soapForm, fr: e.target.value })
                          }
                          className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-1">
                        Hallazgos del examen físico
                      </label>
                      <textarea
                        value={soapForm.hallazgos}
                        onChange={(e) =>
                          setSoapForm({
                            ...soapForm,
                            hallazgos: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-1">
                        Diagnóstico
                      </label>
                      <textarea
                        value={soapForm.diagnostico}
                        onChange={(e) =>
                          setSoapForm({
                            ...soapForm,
                            diagnostico: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-1">
                        Tratamiento / Indicaciones
                      </label>
                      <textarea
                        value={soapForm.tratamiento}
                        onChange={(e) =>
                          setSoapForm({
                            ...soapForm,
                            tratamiento: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none resize-none"
                      />
                    </div>

                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setDetailTab("history")}
                      className="px-6 py-2 rounded-lg border border-line text-muted font-bold hover:bg-surface-2 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingSoap}
                      className="px-8 py-3 bg-brand text-white font-black rounded-xl hover:bg-brand-strong transition-colors disabled:opacity-50"
                    >
                      {isSavingSoap ? "Guardando..." : "Finalizar Atención"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {historiaAbierta && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/80 p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setHistoriaAbierta(null);
            }}
          >
            <div className="relative my-6 w-full max-w-[880px]">
              <button
                onClick={() => setHistoriaAbierta(null)}
                className="absolute -top-3 -right-3 z-10 h-8 w-8 rounded-full bg-white text-slate-700 shadow flex items-center justify-center"
              >
                <Icons.X size={18} />
              </button>
              <HistoriaClinicaFicha historia={historiaAbierta} readOnly />
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // ─── Vista: LISTA DE PACIENTES ─────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">
            Pacientes
          </h2>
          <p className="text-muted">
            Listado general de pacientes y propietarios
          </p>
        </div>
        <button
          onClick={() => setView("new")}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-strong shadow-sm transition-colors"
        >
          <Icons.Plus size={18} />
          Nuevo Paciente
        </button>
      </header>

      <div className="relative">
        <Icons.Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre de mascota, dueño o CI..."
          className="w-full pl-9 pr-4 py-2 bg-surface border border-line rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            Buscando…
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">
          Cargando pacientes...
        </div>
      ) : patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-30 space-y-4">
          <Icons.Patients size={64} />
          <p className="font-bold text-lg">No se encontraron pacientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {patients.map((p) => {
            const isInQueue = p.fichas?.some(
              (f) => f.estado === "ESPERA" || f.estado === "EN_CURSO",
            );
            return (
              <div
                key={p.id}
                className="bg-surface rounded-card border border-line p-5 transition-all"
              >
                <div
                  onClick={() => selectPatient(p.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="h-14 w-14 rounded-full bg-surface-2 flex items-center justify-center text-3xl flex-shrink-0">
                      {speciesEmojis[especieNombre(p.especie)] ?? "🐾"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-ink truncate">
                        {p.nombre}
                      </h3>
                      <p className="text-xs text-muted truncate">
                        {especieNombre(p.especie)}
                        {razaNombre(p.raza) ? ` · ${razaNombre(p.raza)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
                    <Icons.User
                      size={11}
                      className="text-slate-400 flex-shrink-0"
                    />
                    <span className="font-medium truncate">
                      {p.propietario.nombre}
                    </span>
                  </div>
                  {p.propietario.telefono && (
                    <p className="text-xs text-slate-400 pl-4 truncate">
                      {p.propietario.telefono}
                    </p>
                  )}
                </div>

                {isInQueue ? (
                  <div className="w-full mt-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest text-center border border-blue-200 dark:border-blue-800">
                    En cola de espera
                  </div>
                ) : (
                  <button
                    onClick={() => emitTicket(p.id, p.nombre)}
                    className="w-full mt-4 py-2 bg-brand-soft text-brand-ink border border-brand/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all"
                  >
                    Emitir Turno
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && total > 0 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-muted">
            {total} paciente{total === 1 ? "" : "s"} · página {page} de{" "}
            {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => irAPagina(page - 1)}
              disabled={loading || page <= 1}
              className="px-4 py-1.5 rounded-lg bg-surface-2 text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Anterior
            </button>
            <button
              onClick={() => irAPagina(page + 1)}
              disabled={loading || page >= Math.ceil(total / PAGE_SIZE)}
              className="px-4 py-1.5 rounded-lg bg-surface-2 text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
