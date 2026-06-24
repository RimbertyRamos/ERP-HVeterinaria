import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Icons } from "../constants";
import { cn } from "../utils/cn";
import { api } from "../utils/api";

interface PorMetodo {
  cantidad: number;
  total: number;
}
interface Arqueo {
  por_metodo: Record<string, PorMetodo>;
  total_efectivo: number;
  total_tarjeta: number;
  total_qr: number;
  total_general: number;
  cantidad_recibos: number;
}
interface Cierre {
  id: string;
  cajero?: { nombre: string };
  total_general: string | number;
  cantidad_recibos: number;
  efectivo_contado?: string | number | null;
  diferencia?: string | number | null;
  observaciones?: string | null;
  created_at: string;
}

const money = (n: unknown) => `Bs. ${Number(n ?? 0).toFixed(2)}`;

/** Modal de Arqueo y Cierre de caja del cajero (resumen del día por método). */
export const ArqueoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [arqueo, setArqueo] = useState<Arqueo | null>(null);
  const [cierres, setCierres] = useState<Cierre[]>([]);
  const [loading, setLoading] = useState(true);
  const [contado, setContado] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([api.getArqueo(), api.getCierres()]);
      setArqueo(a);
      setCierres(c);
    } catch (err: any) {
      toast.error(err?.message ?? "Error cargando el arqueo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totalEfectivo = arqueo?.total_efectivo ?? 0;
  const diferencia = contado !== "" ? Number(contado) - totalEfectivo : null;

  const registrar = async () => {
    setSaving(true);
    try {
      await api.registrarCierre({
        efectivo_contado: contado !== "" ? Number(contado) : undefined,
        observaciones: obs || undefined,
      });
      toast.success("Cierre de caja registrado");
      setContado("");
      setObs("");
      cargar();
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo registrar el cierre");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full mt-1 h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:ring-2 focus:ring-primary";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-slate-900/80 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-8 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          title="Cerrar"
        >
          <Icons.X size={20} />
        </button>

        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Arqueo y cierre de caja
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Resumen de tus cobros de hoy, desglosado por método de pago.
        </p>

        {loading ? (
          <p className="text-slate-400 italic">Cargando…</p>
        ) : arqueo ? (
          <>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 text-sm overflow-hidden">
              {(["EFECTIVO", "TARJETA", "QR"] as const).map((m) => (
                <div
                  key={m}
                  className="grid grid-cols-3 items-center px-4 py-2.5"
                >
                  <span className="font-bold">{m}</span>
                  <span className="text-center text-xs text-slate-500">
                    {arqueo.por_metodo[m]?.cantidad ?? 0} cobros
                  </span>
                  <span className="text-right font-black">
                    {money(arqueo.por_metodo[m]?.total)}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-3 items-center px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50">
                <span className="font-black uppercase text-xs tracking-widest">
                  Total
                </span>
                <span className="text-center text-xs text-slate-500">
                  {arqueo.cantidad_recibos} recibos
                </span>
                <span className="text-right font-black text-emerald-600">
                  {money(arqueo.total_general)}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500">
                  Efectivo contado (Bs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={contado}
                  onChange={(e) => setContado(e.target.value)}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">
                  Diferencia
                </label>
                <div
                  className={cn(
                    "mt-1 h-10 flex items-center px-3 rounded-lg font-black text-sm",
                    diferencia == null
                      ? "text-slate-400 bg-slate-50 dark:bg-slate-950"
                      : Math.abs(diferencia) < 0.005
                        ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15"
                        : diferencia > 0
                          ? "text-blue-600 bg-blue-50 dark:bg-blue-900/15"
                          : "text-red-600 bg-red-50 dark:bg-red-900/15",
                  )}
                >
                  {diferencia == null
                    ? "—"
                    : `${diferencia > 0 ? "+" : ""}${money(diferencia)}`}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Compara lo contado con el efectivo esperado ({money(totalEfectivo)}
              ).
            </p>

            <div className="mt-3">
              <label className="text-xs font-bold text-slate-500">
                Observaciones (opcional)
              </label>
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                rows={2}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <button
              onClick={registrar}
              disabled={saving}
              className="w-full mt-3 py-2.5 rounded-lg bg-primary text-slate-900 font-bold disabled:opacity-50"
            >
              {saving ? "Registrando…" : "Registrar cierre de caja"}
            </button>

            {cierres.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                  Cierres recientes
                </h3>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {cierres.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between text-xs rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold">
                          {new Date(c.created_at).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-slate-400 truncate">
                          {c.cantidad_recibos} recibos · {c.cajero?.nombre}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black">{money(c.total_general)}</p>
                        {c.diferencia != null &&
                          Math.abs(Number(c.diferencia)) >= 0.005 && (
                            <p
                              className={
                                Number(c.diferencia) > 0
                                  ? "text-blue-600"
                                  : "text-red-600"
                              }
                            >
                              Dif: {money(c.diferencia)}
                            </p>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-slate-400 italic">No se pudo cargar el arqueo.</p>
        )}
      </div>
    </div>
  );
};
