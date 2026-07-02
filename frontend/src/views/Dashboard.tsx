import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { Icons } from "../constants";
import { cn } from "../utils/cn";
import { api } from "../utils/api";
import { DashboardKpis, Consultorio } from "../types";
import { CalificacionFicha } from "../components/CalificacionFicha";

const estadoLabel: Record<Consultorio["estado"], string> = {
  LIBRE: "Libre",
  OCUPADO: "Ocupado",
  LIMPIEZA: "Limpieza",
};

function getRole(): string {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "";
    const user = JSON.parse(raw);
    return user?.rol?.nombre ?? "";
  } catch {
    return "";
  }
}

function getUserName(): string {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "";
    const user = JSON.parse(raw);
    return user?.nombre ?? user?.name ?? "";
  } catch {
    return "";
  }
}

function getUserId(): string {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "";
    return JSON.parse(raw)?.id ?? "";
  } catch {
    return "";
  }
}

function getPermisos(): string[] {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}")?.permisos ?? [];
  } catch {
    return [];
  }
}

type ClienteTab = "mascotas" | "historial" | "pagos";

interface MascotaCliente {
  id: string;
  nombre: string;
  especie: { nombre: string };
  raza?: { nombre: string } | null;
  sexo?: string;
  peso_actual?: number | null;
  fichas: {
    id: string;
    fecha_hora: string;
    estado: string;
    estado_cobro: string;
    servicio?: { id?: string; nombre: string; precio_base: string | number };
    doctor?: { nombre: string } | null;
    consultorio?: { nombre: string } | null;
    soap?: { diagnostico?: string | null; tratamiento?: string | null } | null;
    calificacion?: {
      id: string;
      puntaje: number;
      comentario?: string | null;
    } | null;
    recibo?: {
      id: string;
      num_recibo: string;
      total: string | number;
      metodo_pago: string;
      fecha_pago: string;
      estado: string;
    } | null;
  }[];
}

const speciesEmojis: Record<string, string> = {
  Perro: "🐕",
  Gato: "🐈",
  Ave: "🐦",
  Conejo: "🐇",
  Reptil: "🦎",
  Hamster: "🐹",
};

const METODO: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  QR: "QR",
};

export const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);

  // Cliente portal state
  const [clienteTab, setClienteTab] = useState<ClienteTab>("mascotas");
  const [misMascotas, setMisMascotas] = useState<MascotaCliente[]>([]);
  const [loadingCliente, setLoadingCliente] = useState(true);

  const role = getRole();
  const isCliente = role === "CLIENTE";
  const isAdmin = role === "ADMIN";
  const puedeCalificar = getPermisos().includes("calificar_servicio");

  const [descargandoFin, setDescargandoFin] = useState(false);
  const exportarFinanzas = async (formato: "csv" | "pdf") => {
    // Reporte de ingresos de los últimos 7 días (coincide con el KPI del panel).
    const desde = new Date(Date.now() - 7 * 86400000).toISOString();
    setDescargandoFin(true);
    try {
      await api.descargarReporteCaja(
        new URLSearchParams({ desde }).toString(),
        formato,
      );
      toast.success(`Reporte ${formato.toUpperCase()} generado`);
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo exportar el reporte");
    } finally {
      setDescargandoFin(false);
    }
  };

  useEffect(() => {
    if (isCliente) return;
    api
      .getKpis()
      .then(setKpis)
      .finally(() => setLoading(false));
    const iv = setInterval(() => api.getKpis().then(setKpis), 30_000);
    return () => clearInterval(iv);
  }, [isCliente]);

  useEffect(() => {
    if (!isCliente) return;
    const userId = getUserId();
    if (!userId) {
      setLoadingCliente(false);
      return;
    }
    api
      .getMascotas(undefined, userId)
      .then((data) => setMisMascotas(data as MascotaCliente[]))
      .finally(() => setLoadingCliente(false));
  }, [isCliente]);

  const stats = kpis
    ? [
        {
          label: "Fichas Hoy",
          value: String(kpis.fichas_hoy),
          icon: Icons.FileText,
          color: "purple",
          trend: "Total del día",
        },
        {
          label: "En Espera",
          value: String(kpis.en_espera),
          icon: Icons.Clock,
          color: "amber",
          trend: "En cola",
        },
        {
          label: "En Consulta",
          value: String(kpis.en_curso),
          icon: Icons.Clinical,
          color: "blue",
          trend: "Atendiendo",
        },
        {
          label: "Ingresos Hoy",
          value: `Bs.${Number(kpis.ingresos_hoy).toFixed(2)}`,
          icon: Icons.POS,
          color: "emerald",
          trend: "Cobrado hoy",
        },
      ]
    : [];

  // Cliente portal
  if (isCliente) {
    const nombre = getUserName();

    const renderMascotas = () => (
      <div className="space-y-4">
        {loadingCliente ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-surface-2 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : misMascotas.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {misMascotas.map((mascota) => (
              <div
                key={mascota.id}
                className="rounded-lg border border-line bg-surface p-4 transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {speciesEmojis[mascota.especie?.nombre] || "🐾"}
                      </span>
                      <h4 className="font-bold text-ink">
                        {mascota.nombre}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 ml-8">
                      {mascota.especie?.nombre}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  {mascota.raza && (
                    <p>
                      <span className="font-medium">Raza:</span>{" "}
                      {mascota.raza.nombre}
                    </p>
                  )}
                  {mascota.sexo && (
                    <p>
                      <span className="font-medium">Sexo:</span> {mascota.sexo}
                    </p>
                  )}
                  {mascota.peso_actual !== null &&
                    mascota.peso_actual !== undefined && (
                      <p>
                        <span className="font-medium">Peso:</span>{" "}
                        {mascota.peso_actual} kg
                      </p>
                    )}
                  <p className="text-xs pt-2">
                    <span className="font-medium">Fichas:</span>{" "}
                    {mascota.fichas?.length ?? 0} registros
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icons.Patients size={48} className="text-slate-300 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              No hay mascotas registradas
            </p>
          </div>
        )}
      </div>
    );

    const renderHistorial = () => {
      const todasLasFichas = misMascotas
        .flatMap((m) =>
          (m.fichas ?? []).map((f) => ({
            ...f,
            mascotaNombre: m.nombre,
            mascotaEspecie: m.especie?.nombre,
          })),
        )
        .sort(
          (a, b) =>
            new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime(),
        );

      return (
        <div className="space-y-4">
          {loadingCliente ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-surface-2 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : todasLasFichas.length > 0 ? (
            <div className="space-y-2">
              {todasLasFichas.map((ficha) => (
                <div
                  key={ficha.id}
                  className="rounded-lg border border-line bg-surface p-4 transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {speciesEmojis[ficha.mascotaEspecie] || "🐾"}
                        </span>
                        <h4 className="font-bold text-ink">
                          {ficha.mascotaNombre}
                        </h4>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            ficha.estado === "COMPLETADA" &&
                              "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                            ficha.estado === "EN_CURSO" &&
                              "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                            ficha.estado === "CANCELADA" &&
                              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                          )}
                        >
                          {ficha.estado === "COMPLETADA" && "Completada"}
                          {ficha.estado === "EN_CURSO" && "En Curso"}
                          {ficha.estado === "CANCELADA" && "Cancelada"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">
                        📅{" "}
                        {new Date(ficha.fecha_hora).toLocaleDateString(
                          "es-ES",
                          {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                      {ficha.servicio && (
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {ficha.servicio.nombre}
                        </p>
                      )}
                      {ficha.doctor && (
                        <p className="text-xs text-slate-500">
                          🩺 Dr. {ficha.doctor.nombre}
                        </p>
                      )}
                      {ficha.consultorio && (
                        <p className="text-xs text-slate-500">
                          📍 {ficha.consultorio.nombre}
                        </p>
                      )}
                      {ficha.soap?.diagnostico && (
                        <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">
                          <span className="font-medium">Diagnóstico:</span>{" "}
                          {ficha.soap.diagnostico}
                        </p>
                      )}
                      {ficha.soap?.tratamiento && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          <span className="font-medium">Tratamiento:</span>{" "}
                          {ficha.soap.tratamiento}
                        </p>
                      )}
                    </div>
                    {ficha.recibo && (
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-slate-500">
                          Recibo #{ficha.recibo.num_recibo}
                        </p>
                        <p className="font-bold text-emerald-600">
                          Bs.{Number(ficha.recibo.total).toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {METODO[ficha.recibo.metodo_pago] ||
                            ficha.recibo.metodo_pago}
                        </p>
                      </div>
                    )}
                  </div>
                  {ficha.estado === "COMPLETADA" && (
                    <CalificacionFicha
                      fichaId={ficha.id}
                      servicioId={ficha.servicio?.id}
                      yaCalificada={ficha.calificacion}
                      puedeCalificar={puedeCalificar}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icons.FileText size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                Sin fichas médicas
              </p>
            </div>
          )}
        </div>
      );
    };

    const renderPagos = () => {
      const todosLosRecibos = misMascotas
        .flatMap((m) =>
          (m.fichas ?? [])
            .filter((f) => f.recibo)
            .map((f) => ({
              ...f.recibo,
              mascotaNombre: m.nombre,
              mascotaEspecie: m.especie?.nombre,
            })),
        )
        .sort(
          (a, b) =>
            new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime(),
        );

      const pagados = todosLosRecibos
        .filter((r) => r.estado === "PAGADO")
        .reduce((s, r) => s + Number(r.total), 0);
      const pendientes = todosLosRecibos
        .filter((r) => r.estado === "PENDIENTE")
        .reduce((s, r) => s + Number(r.total), 0);

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20 p-4">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Total Pagado
              </p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                Bs.{pagados.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20 p-4">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Pendiente de Pago
              </p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                Bs.{pendientes.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {loadingCliente ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-surface-2 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : todosLosRecibos.length > 0 ? (
              todosLosRecibos.map((recibo: any) => (
                <div
                  key={recibo.id}
                  className="rounded-lg border border-line bg-surface p-4 flex items-center justify-between transition-shadow"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-ink">
                      Recibo #{recibo.num_recibo}
                    </h4>
                    <p className="text-sm text-slate-500">
                      🐾 {recibo.mascotaNombre}
                    </p>
                    <p className="text-xs text-slate-500">
                      📅{" "}
                      {new Date(recibo.fecha_pago).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ink">
                      Bs.{Number(recibo.total).toFixed(2)}
                    </p>
                    <span
                      className={cn(
                        "inline-block text-xs px-2 py-1 rounded-full font-medium",
                        recibo.estado === "PAGADO" &&
                          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                        recibo.estado === "PENDIENTE" &&
                          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                      )}
                    >
                      {recibo.estado === "PAGADO" ? "✓ Pagado" : "Pendiente"}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      {METODO[recibo.metodo_pago] || recibo.metodo_pago}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Icons.CreditCard size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  Sin recibos
                </p>
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 space-y-8"
      >
        <header className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              {nombre ? `Bienvenido, ${nombre}` : "Bienvenido"}
            </h2>
            <p className="text-muted">
              Portal del Propietario
            </p>
          </div>
        </header>

        <div className="flex gap-2 border-b border-line">
          {(["mascotas", "historial", "pagos"] as ClienteTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setClienteTab(tab)}
              className={cn(
                "px-4 py-2 font-medium text-sm transition-all border-b-2",
                clienteTab === tab
                  ? "border-brand text-brand-ink"
                  : "border-transparent text-muted hover:text-ink",
              )}
            >
              {tab === "mascotas" && "🐾 Mis Mascotas"}
              {tab === "historial" && "📋 Historial"}
              {tab === "pagos" && "💳 Pagos"}
            </button>
          ))}
        </div>

        {clienteTab === "mascotas" && renderMascotas()}
        {clienteTab === "historial" && renderHistorial()}
        {clienteTab === "pagos" && renderPagos()}
      </motion.div>
    );
  }

  // Non-admin simplified panel
  if (!isAdmin && !isCliente) {
    const nombre = getUserName();
    const roleDisplay =
      role === "VETERINARIO"
        ? "🩺 Veterinario"
        : role === "RECEPCIONISTA"
          ? "📋 Recepcionista"
          : role === "CAJERO"
            ? "💳 Cajero"
            : "👤 Usuario";

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 space-y-8"
      >
        <header className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              {nombre ? `Bienvenido, ${nombre}` : "Bienvenido"}
            </h2>
            <p className="text-muted">{roleDisplay}</p>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-card border border-line bg-surface-2 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.slice(0, 3).map((stat, i) => (
              <div
                key={i}
                className="flex flex-col rounded-card border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      stat.color === "purple" &&
                        "bg-surface-2 text-brand-ink",
                      stat.color === "amber" &&
                        "bg-surface-2 text-brand-ink",
                      stat.color === "blue" &&
                        "bg-surface-2 text-brand-ink",
                    )}
                  >
                    <stat.icon size={18} />
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-ink tnum">
                  {stat.value}
                </h3>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-card border border-line bg-surface p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-brand-ink">
                <Icons.Bell size={20} />
              </span>
              <h4 className="font-bold text-ink">
                Acceso Rápido
              </h4>
            </div>
            <p className="text-sm text-muted">
              Accede a tu módulo desde el menú lateral para continuar con tus
              tareas.
            </p>
          </div>

          <div className="rounded-card border border-line bg-surface p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-brand-ink">
                <Icons.CheckCircle2 size={20} />
              </span>
              <h4 className="font-bold text-ink">
                Estado del Sistema
              </h4>
            </div>
            <p className="text-sm text-muted">
              Todo está funcionando correctamente.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Admin dashboard (full)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
            Dashboard Administrativo
          </h2>
          <p className="text-muted">
            Resumen operacional de la clínica
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportarFinanzas("csv")}
              disabled={descargandoFin}
              className="h-9 px-3 rounded-lg bg-surface-2 border border-line text-xs font-bold text-ink hover:bg-line disabled:opacity-50 transition-colors"
            >
              Exportar CSV
            </button>
            <button
              onClick={() => exportarFinanzas("pdf")}
              disabled={descargandoFin}
              className="h-9 px-3 rounded-lg bg-brand text-xs font-bold text-white hover:bg-brand-strong disabled:opacity-50 transition-colors"
            >
              Exportar PDF
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Icons.Agenda size={18} />
            <span>
              Consultorios:{" "}
              <strong className="text-ink">
                {kpis?.consultorios.length ?? "—"}
              </strong>
            </span>
          </div>
          {kpis && kpis.stock_critico > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full">
              <Icons.AlertTriangle size={14} />
              {kpis.stock_critico} productos en stock crítico
            </span>
          )}
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-card border border-line bg-surface-2 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col rounded-card border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    stat.color === "emerald" &&
                      "bg-surface-2 text-brand-ink",
                    stat.color === "amber" &&
                      "bg-surface-2 text-brand-ink",
                    stat.color === "blue" &&
                      "bg-surface-2 text-brand-ink",
                    stat.color === "purple" &&
                      "bg-surface-2 text-brand-ink",
                  )}
                >
                  <stat.icon size={18} />
                </span>
              </div>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-bold text-ink tnum">
                  {stat.value}
                </h3>
                <span className="mb-1 text-xs font-medium text-slate-500">
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-card border border-line p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-ink">
                Ingresos — Últimos 7 días
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cobros registrados por día (Bs.)
              </p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-brand-ink">
              <Icons.TrendingUp size={16} />
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={kpis?.semana ?? []} barSize={28}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.15)"
                vertical={false}
              />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                formatter={(value: number) => [
                  `Bs.${value.toFixed(2)}`,
                  "Ingresos",
                ]}
                contentStyle={{
                  borderRadius: "0.5rem",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="ingresos"
                fill="var(--color-brand-ink)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex-1 bg-surface rounded-card border border-line p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink">
                Atenciones / día
              </h3>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-brand-ink">
                <Icons.Clinical size={16} />
              </span>
            </div>
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart data={kpis?.semana ?? []}>
                <defs>
                  <linearGradient id="fichasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand-ink)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-brand-ink)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="dia" hide />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  formatter={(value: number) => [value, "Fichas"]}
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="fichas"
                  stroke="var(--color-brand-ink)"
                  strokeWidth={2}
                  fill="url(#fichasGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-2xl font-bold text-ink tnum mt-2">
              {(kpis?.semana ?? []).reduce((s, d) => s + d.fichas, 0)}
              <span className="text-sm font-normal text-slate-500 ml-1">
                esta semana
              </span>
            </p>
          </div>

          <div className="bg-surface rounded-card border border-line p-6 flex items-center gap-4">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-surface-2 text-brand-ink">
              <Icons.Patients size={24} />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Pacientes Registrados
              </p>
              <p className="text-3xl font-bold text-ink tnum">
                {kpis?.total_mascotas ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-display text-xl font-bold tracking-tight text-ink">
          Estado de Consultorios
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(kpis?.consultorios ?? []).map((room) => (
            <div
              key={room.id}
              className="group relative flex flex-col overflow-hidden rounded-card border border-slate-200 bg-white transition-all dark:border-slate-700 dark:bg-slate-800"
            >
              <div
                className={cn(
                  "absolute right-0 top-0 rounded-bl-xl px-3 py-1 text-xs font-bold uppercase tracking-wider",
                  room.estado === "OCUPADO" &&
                    "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
                  room.estado === "LIBRE" &&
                    "bg-surface-2 text-brand-ink",
                  room.estado === "LIMPIEZA" &&
                    "bg-surface-2 text-brand-ink",
                )}
              >
                {estadoLabel[room.estado]}
              </div>

              <div
                className={cn(
                  "h-24 flex items-center justify-center",
                  room.estado === "OCUPADO" && "bg-red-50 dark:bg-red-900/10",
                  room.estado === "LIBRE" &&
                    "bg-emerald-50 dark:bg-emerald-900/10",
                  room.estado === "LIMPIEZA" &&
                    "bg-blue-50 dark:bg-blue-900/10",
                )}
              >
                <Icons.MeetingRoom
                  size={40}
                  className={cn(
                    room.estado === "OCUPADO" && "text-red-300",
                    room.estado === "LIBRE" && "text-emerald-300",
                    room.estado === "LIMPIEZA" && "text-blue-300",
                  )}
                />
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-3">
                  <h4 className="text-base font-bold text-ink">
                    {room.nombre}
                  </h4>
                  {room.especialidad && (
                    <p className="text-xs text-slate-500">
                      {room.especialidad}
                    </p>
                  )}
                </div>

                {room.estado === "LIBRE" ? (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 py-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <p className="text-sm text-slate-400">Disponible</p>
                  </div>
                ) : room.estado === "LIMPIEZA" ? (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-blue-50 py-3 dark:bg-blue-900/10">
                    <Icons.CleaningServices
                      className="text-blue-400 animate-pulse"
                      size={20}
                    />
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                      En limpieza
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-lg bg-red-50 py-3 dark:bg-red-900/10">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      En consulta
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {kpis && kpis.recibos_recientes.length > 0 && (
        <div className="rounded-card border border-line bg-surface overflow-hidden">
          <div className="px-6 py-4 border-b border-line">
            <h3 className="font-bold text-ink flex items-center gap-2">
              <Icons.History className="text-brand-ink" size={18} />
              Últimos Cobros
            </h3>
          </div>
          <div className="divide-y divide-line">
            {kpis.recibos_recientes.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-6 py-3 text-sm"
              >
                <div>
                  <span className="font-bold text-ink mr-2">
                    {r.num_recibo}
                  </span>
                  <span className="text-slate-500">
                    {r.ficha?.mascota?.nombre ?? "—"}
                  </span>
                </div>
                <span className="font-bold text-emerald-600">
                  Bs.{Number(r.total).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
