import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icons } from "../constants";
import { cn } from "../utils/cn";
import { api } from "../utils/api";
import { Cita, Mascota, UsuarioResumen } from "../types";
import { toast } from "sonner";
import { SlotPicker } from "../components/SlotPicker";

const fmtISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

// Devuelve los 7 días (lunes → domingo) de la semana que contiene a dateStr.
const getSemana = (dateStr: string): Date[] => {
  const d = new Date(dateStr + "T00:00:00");
  const dow = (d.getDay() + 6) % 7; // 0 = lunes
  const monday = new Date(d);
  monday.setDate(d.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd;
  });
};

export const Agenda: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const rol = user?.rol?.nombre;

  const [selectedDate, setSelectedDate] = useState(fmtISO(new Date()));
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"dia" | "semana">("dia");
  const [solicitudes, setSolicitudes] = useState<Cita[]>([]);

  // Formulario para nueva cita
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [doctores, setDoctores] = useState<UsuarioResumen[]>([]);
  const [consultorios, setConsultorios] = useState<any[]>([]);
  const [searchMascota, setSearchMascota] = useState("");
  const [form, setForm] = useState({
    mascota_id: "",
    doctor_id: "",
    consultorio_id: "",
    tipo: "CONSULTA",
    duracion: "30",
    fecha: selectedDate,
    hora: "09:00",
    motivo: "",
    notas: "",
  });

  const loadCitas = useCallback(async () => {
    setLoading(true);
    try {
      const doctorFilter = rol === "VETERINARIO" ? user.id : undefined;
      let data;
      if (viewMode === "semana") {
        const dias = getSemana(selectedDate);
        data = await api.getCitas(
          undefined,
          doctorFilter,
          fmtISO(dias[0]),
          fmtISO(dias[6]),
        );
      } else {
        data = await api.getCitas(selectedDate, doctorFilter);
      }
      setCitas(data);
    } catch (err) {
      console.error("Error cargando citas:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, rol, user.id, viewMode]);

  const shiftWeek = (delta: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(fmtISO(d));
  };

  const loadSolicitudes = useCallback(async () => {
    try {
      const s = await api.getSolicitudes();
      setSolicitudes(s);
    } catch {
      setSolicitudes([]);
    }
  }, []);

  useEffect(() => {
    loadSolicitudes();
  }, [loadSolicitudes]);

  useEffect(() => {
    loadCitas();
  }, [loadCitas]);

  useEffect(() => {
    if (isModalOpen) {
      api.getVeterinarios().then(setDoctores).catch(console.error);
      api.getConsultorios().then(setConsultorios).catch(console.error);
      // Carga inicial de mascotas para que el selector esté listo
      api.getMascotas().then(setMascotas).catch(console.error);
    }
  }, [isModalOpen]);

  const handleSearchMascota = async () => {
    try {
      const data = await api.getMascotas(searchMascota.trim() || undefined);
      setMascotas(data);
    } catch (err: any) {
      toast.error(err.message ?? "Error buscando pacientes");
    }
  };

  const handleCreateCita = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCita({
        mascota_id: form.mascota_id,
        doctor_id: form.doctor_id || undefined,
        consultorio_id: form.consultorio_id || undefined,
        tipo: form.tipo,
        duracion_min: Number(form.duracion) || 30,
        fecha_hora: `${form.fecha}T${form.hora}:00`,
        motivo: form.motivo,
        notas: form.notas,
      });
      setIsModalOpen(false);
      toast.success("Cita programada correctamente");
      loadCitas();
      setForm({
        ...form,
        mascota_id: "",
        consultorio_id: "",
        motivo: "",
        notas: "",
      });
      setSearchMascota("");
    } catch (err: any) {
      toast.error(err?.message ?? "Error al crear la cita");
    }
  };

  const handleUpdateEstado = async (id: string, estado: Cita["estado"]) => {
    try {
      await api.updateEstadoCita(id, estado);
      toast.success(`Cita marcada como ${estado.toLowerCase()}`);
      loadCitas();
      loadSolicitudes();
    } catch (err: any) {
      toast.error(err?.message ?? "Error al actualizar estado");
    }
  };

  const handleCheckIn = async (cita: Cita) => {
    try {
      // El backend crea la ficha de atención (turno) y marca la cita como
      // CONFIRMADA — una sola fuente de verdad, sin duplicar lógica aquí.
      await api.checkInCita(cita.id);
      toast.success(`Check-in: ${cita.mascota.nombre} pasó a sala de espera`, {
        description: "Se creó la ficha de atención correctamente.",
      });
      loadCitas();
    } catch (err: any) {
      toast.error(err?.message ?? "Error al procesar el check-in");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8 h-full flex flex-col"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Agenda Médica
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Gestión de citas y programación de servicios
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-slate-900 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
        >
          <Icons.Plus size={20} />
          Nueva Cita
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 overflow-hidden">
        {/* Calendario lateral y filtros */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Icons.Agenda size={18} className="text-primary" />
              Seleccionar Fecha
            </h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
            />
            <div className="mt-6 space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Atajos
              </p>
              <button
                onClick={() => setSelectedDate(fmtISO(new Date()))}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(fmtISO(tomorrow));
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Mañana
              </button>
            </div>
          </section>

          <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-2">
              Resumen del Día
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Total Citas
                </span>
                <span className="text-lg font-black">{citas.length}</span>
              </div>
              <div className="flex justify-between items-center text-amber-600">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Pendientes
                </span>
                <span className="text-lg font-black">
                  {citas.filter((c) => c.estado === "PROGRAMADA").length}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Lista de Citas */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 justify-between items-center">
            <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest text-sm">
              {viewMode === "dia"
                ? `Citas — ${new Date(
                    selectedDate + "T00:00:00",
                  ).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`
                : `Semana — ${getSemana(selectedDate)[0].toLocaleDateString(
                    "es-ES",
                    { day: "numeric", month: "short" },
                  )} al ${getSemana(selectedDate)[6].toLocaleDateString(
                    "es-ES",
                    { day: "numeric", month: "short" },
                  )}`}
            </h3>
            <div className="flex items-center gap-2">
              {viewMode === "semana" && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => shiftWeek(-7)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Semana anterior"
                  >
                    <Icons.ChevronRight size={16} className="rotate-180" />
                  </button>
                  <button
                    onClick={() => shiftWeek(7)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Semana siguiente"
                  >
                    <Icons.ChevronRight size={16} />
                  </button>
                </div>
              )}
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => setViewMode("dia")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold transition-colors",
                    viewMode === "dia"
                      ? "bg-primary text-slate-900"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                >
                  Día
                </button>
                <button
                  onClick={() => setViewMode("semana")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold transition-colors",
                    viewMode === "semana"
                      ? "bg-primary text-slate-900"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                >
                  Semana
                </button>
              </div>
            </div>
          </div>

          {solicitudes.length > 0 && (
            <div className="mx-6 mt-4 rounded-xl border border-violet-200 dark:border-violet-900/40 bg-violet-50 dark:bg-violet-900/10 p-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-violet-600 mb-3">
                Solicitudes pendientes ({solicitudes.length})
              </h4>
              <div className="space-y-2">
                {solicitudes.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-violet-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-sm font-black truncate text-slate-900 dark:text-white">
                            {s.mascota.nombre}
                          </h5>
                          {s.mascota.especie?.nombre && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                              {s.mascota.especie.nombre}
                            </span>
                          )}
                          {s.tipo && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 font-black uppercase tracking-wider">
                              {s.tipo}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Icons.User size={12} />
                          {s.mascota.propietario?.nombre}
                          {s.mascota.propietario?.telefono
                            ? ` · 📞 ${s.mascota.propietario.telefono}`
                            : ""}
                        </p>
                        {s.mascota.propietario?.email && (
                          <p className="text-xs text-slate-400 truncate">
                            ✉ {s.mascota.propietario.email}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleUpdateEstado(s.id, "PROGRAMADA")}
                          className="px-3 py-1.5 rounded-lg bg-violet-500 text-white text-xs font-black uppercase tracking-widest hover:bg-violet-600"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => handleUpdateEstado(s.id, "CANCELADA")}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                          title="Rechazar"
                        >
                          <Icons.X size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1 capitalize">
                        <Icons.Agenda size={12} className="text-violet-500" />
                        {new Date(s.fecha_hora).toLocaleDateString("es-ES", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </span>
                      <span className="font-bold">
                        🕐{" "}
                        {new Date(s.fecha_hora).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {s.duracion_min ? <span>⏱ {s.duracion_min} min</span> : null}
                    </div>

                    {s.motivo && (
                      <p className="mt-1.5 text-xs italic text-slate-500">
                        📝 {s.motivo}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-400">
                      Solicitada el{" "}
                      {new Date(s.created_at).toLocaleString("es-ES", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Cargando agenda...
              </div>
            ) : viewMode === "semana" ? (
              <div className="overflow-x-auto">
                <div className="grid grid-cols-7 gap-2 min-w-[840px]">
                  {getSemana(selectedDate).map((dia) => {
                    const iso = fmtISO(dia);
                    const delDia = citas
                      .filter((c) => fmtISO(new Date(c.fecha_hora)) === iso)
                      .sort(
                        (a, b) =>
                          +new Date(a.fecha_hora) - +new Date(b.fecha_hora),
                      );
                    const esHoy = iso === fmtISO(new Date());
                    return (
                      <div key={iso} className="flex flex-col min-h-[120px]">
                        <button
                          onClick={() => {
                            setSelectedDate(iso);
                            setViewMode("dia");
                          }}
                          className={cn(
                            "mb-2 rounded-lg py-1.5 text-center transition-colors",
                            esHoy
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800",
                          )}
                          title="Ver el día"
                        >
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {dia.toLocaleDateString("es-ES", {
                              weekday: "short",
                            })}
                          </p>
                          <p className="text-sm font-black">{dia.getDate()}</p>
                        </button>
                        <div className="space-y-1.5">
                          {delDia.length === 0 ? (
                            <p className="text-center text-[10px] text-slate-300 dark:text-slate-700 py-2">
                              —
                            </p>
                          ) : (
                            delDia.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setSelectedDate(iso);
                                  setViewMode("dia");
                                }}
                                className={cn(
                                  "w-full text-left px-2 py-1.5 rounded-lg border-l-4 text-[11px] transition-all hover:shadow-sm",
                                  c.estado === "SOLICITADA"
                                    ? "border-violet-400 bg-violet-50 dark:bg-violet-900/10"
                                    : c.estado === "CONFIRMADA"
                                      ? "border-blue-400 bg-blue-50 dark:bg-blue-900/10"
                                      : c.estado === "COMPLETADA"
                                        ? "border-emerald-400 bg-slate-50 dark:bg-slate-800/40 opacity-60"
                                        : c.estado === "CANCELADA"
                                          ? "border-slate-300 bg-red-50/40 dark:bg-red-900/5 opacity-50 line-through"
                                          : c.estado === "NO_ASISTIO"
                                            ? "border-rose-300 bg-rose-50/50 dark:bg-rose-900/5 opacity-50 line-through"
                                            : "border-amber-400 bg-amber-50 dark:bg-amber-900/10",
                                )}
                              >
                                <span className="font-black">
                                  {new Date(c.fecha_hora).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>{" "}
                                <span className="font-bold">
                                  {c.mascota.nombre}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : citas.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <Icons.Agenda size={64} />
                <p className="font-bold">
                  No hay citas programadas para esta fecha.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {citas.map((cita) => (
                  <div
                    key={cita.id}
                    className={cn(
                      "group flex items-center gap-6 p-5 rounded-2xl border-2 transition-all hover:shadow-md",
                      cita.estado === "COMPLETADA"
                        ? "bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-60"
                        : cita.estado === "CANCELADA"
                          ? "bg-red-50 dark:bg-red-900/10 border-transparent opacity-40"
                          : cita.estado === "NO_ASISTIO"
                            ? "bg-rose-50 dark:bg-rose-900/10 border-transparent opacity-50"
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/30",
                    )}
                  >
                    <div className="flex flex-col items-center justify-center w-20 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-black">
                      <span className="text-lg leading-none">
                        {new Date(cita.fecha_hora).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-slate-900 dark:text-white uppercase truncate">
                          {cita.mascota.nombre}
                        </h4>
                        {cita.mascota.especie?.nombre && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                            {cita.mascota.especie.nombre}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-bold flex items-center gap-1">
                        <Icons.User size={12} />
                        {cita.mascota.propietario?.nombre}
                      </p>
                      <p className="text-xs text-slate-400 mt-2 italic truncate">
                        {cita.motivo}
                      </p>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Estado
                        </p>
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border",
                            cita.estado === "SOLICITADA"
                              ? "bg-violet-50 text-violet-600 border-violet-200"
                              : cita.estado === "PROGRAMADA"
                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                : cita.estado === "CONFIRMADA"
                                  ? "bg-blue-50 text-blue-600 border-blue-200"
                                  : cita.estado === "COMPLETADA"
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                    : cita.estado === "NO_ASISTIO"
                                      ? "bg-rose-50 text-rose-600 border-rose-200"
                                      : "bg-slate-100 text-slate-500 border-slate-200",
                          )}
                        >
                          {cita.estado.replace("_", " ")}
                        </span>
                      </div>

                      {(cita.estado === "PROGRAMADA" ||
                        cita.estado === "CONFIRMADA") && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCheckIn(cita)}
                            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"
                          >
                            Check-in
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateEstado(cita.id, "CANCELADA")
                            }
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Cancelar Cita"
                          >
                            <Icons.X size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL NUEVA CITA */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <header className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <h3 className="text-xl font-bold">Programar Nueva Cita</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <Icons.X size={24} />
                </button>
              </header>

              <form
                onSubmit={handleCreateCita}
                className="p-8 space-y-6 overflow-y-auto"
              >
                {/* Buscador de mascota */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Mascota *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nombre de mascota o dueño..."
                      value={searchMascota}
                      onChange={(e) => setSearchMascota(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleSearchMascota())
                      }
                      className="flex-1 h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={handleSearchMascota}
                      className="h-12 w-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"
                    >
                      <Icons.Search size={20} />
                    </button>
                  </div>
                  <select
                    value={form.mascota_id}
                    onChange={(e) =>
                      setForm({ ...form, mascota_id: e.target.value })
                    }
                    required
                    className="w-full h-12 px-4 rounded-xl bg-primary/5 border-2 border-primary/20 outline-none font-bold text-sm"
                  >
                    <option value="">— Seleccionar mascota —</option>
                    {mascotas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} ({m.propietario.nombre})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Fecha
                  </label>
                  <input
                    type="date"
                    min={fmtISO(new Date())}
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      Tipo de cita
                    </label>
                    <select
                      value={form.tipo}
                      onChange={(e) =>
                        setForm({ ...form, tipo: e.target.value })
                      }
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none"
                    >
                      <option value="CONSULTA">Consulta</option>
                      <option value="CONTROL">Control</option>
                      <option value="VACUNACION">Vacunación</option>
                      <option value="CIRUGIA">Cirugía</option>
                      <option value="PELUQUERIA">Peluquería</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      Duración
                    </label>
                    <select
                      value={form.duracion}
                      onChange={(e) =>
                        setForm({ ...form, duracion: e.target.value })
                      }
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none"
                    >
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Veterinario Asignado
                  </label>
                  <select
                    value={form.doctor_id}
                    onChange={(e) =>
                      setForm({ ...form, doctor_id: e.target.value })
                    }
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none"
                  >
                    <option value="">— Cualquier doctor disponible —</option>
                    {doctores.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {/^dra?\.?\s/i.test(doc.nombre)
                          ? doc.nombre
                          : `Dr. ${doc.nombre}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Consultorio (opcional)
                  </label>
                  <select
                    value={form.consultorio_id}
                    onChange={(e) =>
                      setForm({ ...form, consultorio_id: e.target.value })
                    }
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none"
                  >
                    <option value="">— Sin asignar —</option>
                    {consultorios.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Hora (elige un horario libre)
                  </label>
                  <SlotPicker
                    fecha={form.fecha}
                    doctorId={form.doctor_id || undefined}
                    duracion={Number(form.duracion) || 30}
                    value={form.hora}
                    onChange={(h) => setForm({ ...form, hora: h })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Motivo
                  </label>
                  <input
                    type="text"
                    value={form.motivo}
                    onChange={(e) =>
                      setForm({ ...form, motivo: e.target.value })
                    }
                    required
                    placeholder="Ej: Vacunación Séxtuple, Control post-operatorio..."
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-primary text-slate-900 font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  Programar Cita
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
