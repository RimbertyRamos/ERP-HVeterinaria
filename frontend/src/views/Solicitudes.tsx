import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "../utils/cn";
import { api } from "../utils/api";

interface Suscripcion {
  id: string;
  plan: string;
  estado: string;
  monto: string | number;
  email?: string | null;
  nombre?: string | null;
  cuenta_provisionada?: boolean;
  created_at: string;
}
interface Lead {
  id: string;
  nombre: string;
  email: string;
  telefono?: string | null;
  empresa?: string | null;
  mensaje?: string | null;
  origen: string;
  created_at: string;
}

const money = (n: unknown) => `$${Number(n ?? 0).toFixed(2)}`;
const fecha = (s: string) =>
  new Date(s).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const estadoCls: Record<string, string> = {
  PAGADO:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PENDIENTE:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CANCELADO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export const Solicitudes: React.FC = () => {
  const [subs, setSubs] = useState<Suscripcion[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"subs" | "leads">("subs");

  useEffect(() => {
    let activo = true;
    Promise.all([api.getSuscripciones(), api.getLeads()])
      .then(([s, l]) => {
        if (!activo) return;
        setSubs(s as Suscripcion[]);
        setLeads(l as Lead[]);
      })
      .catch(() => {})
      .finally(() => {
        if (activo) setLoading(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const pagadas = subs.filter((s) => s.estado === "PAGADO").length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 md:p-8 h-full overflow-y-auto bg-bg"
    >
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-ink">
          Suscripciones y Solicitudes
        </h2>
        <p className="text-sm text-muted mt-1">
          Pagos de planes desde la landing y mensajes de contacto/demo.
        </p>
      </header>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab("subs")}
          className={cn(
            "px-4 py-2 text-sm font-bold rounded-lg transition-colors",
            tab === "subs"
              ? "bg-brand text-white"
              : "bg-surface text-muted border border-line",
          )}
        >
          Suscripciones ({subs.length})
        </button>
        <button
          onClick={() => setTab("leads")}
          className={cn(
            "px-4 py-2 text-sm font-bold rounded-lg transition-colors",
            tab === "leads"
              ? "bg-brand text-white"
              : "bg-surface text-muted border border-line",
          )}
        >
          Solicitudes ({leads.length})
        </button>
      </div>

      {loading ? (
        <p className="text-muted italic">Cargando…</p>
      ) : tab === "subs" ? (
        <>
          <p className="text-xs text-muted mb-3">
            {pagadas} pagada(s) de {subs.length} registrada(s).
          </p>
          <div className="overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted border-b border-line">
                  <th className="px-4 py-3 font-bold">Plan</th>
                  <th className="px-4 py-3 font-bold">Cliente</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 font-bold">Monto</th>
                  <th className="px-4 py-3 font-bold">Cuenta</th>
                  <th className="px-4 py-3 font-bold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {subs.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted italic"
                    >
                      Aún no hay suscripciones.
                    </td>
                  </tr>
                )}
                {subs.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-line/50 last:border-0"
                  >
                    <td className="px-4 py-3 font-bold text-ink">{s.plan}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{s.nombre || "—"}</p>
                      <p className="text-xs text-muted">
                        {s.email || "(sin correo)"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-bold",
                          estadoCls[s.estado] ?? "bg-surface-2 text-muted",
                        )}
                      >
                        {s.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-ink">
                      {money(s.monto)}
                    </td>
                    <td className="px-4 py-3">
                      {s.cuenta_provisionada ? (
                        <span className="text-emerald-600 text-xs font-bold">
                          ✓ creada
                        </span>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {fecha(s.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted border-b border-line">
                <th className="px-4 py-3 font-bold">Nombre</th>
                <th className="px-4 py-3 font-bold">Contacto</th>
                <th className="px-4 py-3 font-bold">Origen</th>
                <th className="px-4 py-3 font-bold">Mensaje</th>
                <th className="px-4 py-3 font-bold">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted italic"
                  >
                    Aún no hay solicitudes de contacto.
                  </td>
                </tr>
              )}
              {leads.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-line/50 last:border-0 align-top"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{l.nombre}</p>
                    {l.empresa && (
                      <p className="text-xs text-muted">{l.empresa}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-ink">{l.email}</p>
                    {l.telefono && (
                      <p className="text-xs text-muted">{l.telefono}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface-2 text-muted">
                      {l.origen}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs text-muted">
                    {l.mensaje || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {fecha(l.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};
