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
  PAGADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PENDIENTE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CANCELADO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

/** Panel de administración: suscripciones de planes (pagos) y leads de contacto. */
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
      className="p-6 md:p-8 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950"
    >
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Suscripciones y Solicitudes
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Pagos de planes desde la landing y mensajes de contacto/demo.
        </p>
      </header>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab("subs")}
          className={cn(
            "px-4 py-2 text-sm font-bold rounded-lg transition-colors",
            tab === "subs"
              ? "bg-primary text-slate-900"
              : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800",
          )}
        >
          Suscripciones ({subs.length})
        </button>
        <button
          onClick={() => setTab("leads")}
          className={cn(
            "px-4 py-2 text-sm font-bold rounded-lg transition-colors",
            tab === "leads"
              ? "bg-primary text-slate-900"
              : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800",
          )}
        >
          Solicitudes ({leads.length})
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400 italic">Cargando…</p>
      ) : tab === "subs" ? (
        <>
          <p className="text-xs text-slate-500 mb-3">
            {pagadas} pagada(s) de {subs.length} registrada(s).
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
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
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                      Aún no hay suscripciones.
                    </td>
                  </tr>
                )}
                {subs.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                  >
                    <td className="px-4 py-3 font-bold">{s.plan}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700 dark:text-slate-200">
                        {s.nombre || "—"}
                      </p>
                      <p className="text-xs text-slate-400">{s.email || "(sin correo)"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-bold",
                          estadoCls[s.estado] ?? "bg-slate-100 text-slate-600",
                        )}
                      >
                        {s.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">{money(s.monto)}</td>
                    <td className="px-4 py-3">
                      {s.cuenta_provisionada ? (
                        <span className="text-emerald-600 text-xs font-bold">✓ creada</span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {fecha(s.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
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
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                    Aún no hay solicitudes de contacto.
                  </td>
                </tr>
              )}
              {leads.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 align-top"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-700 dark:text-slate-200">{l.nombre}</p>
                    {l.empresa && <p className="text-xs text-slate-400">{l.empresa}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-600 dark:text-slate-300">{l.email}</p>
                    {l.telefono && <p className="text-xs text-slate-400">{l.telefono}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {l.origen}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs text-slate-500">{l.mensaje || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
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
