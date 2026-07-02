import React, { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { api } from "../utils/api";

const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/**
 * Modal de captura de solicitud (lead) para la landing. Se usa como respaldo
 * del pago de planes y para "Contactar Ventas" (Enterprise). Mensajes en línea
 * (la landing no monta el Toaster de la app).
 */
export const LeadModal: React.FC<{
  plan?: string;
  titulo?: string;
  subtitulo?: string;
  origen?: string;
  onClose: () => void;
}> = ({ plan, titulo, subtitulo, origen = "PLAN", onClose }) => {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
    mensaje: "",
    website: "", // honeypot
  });
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.nombre.trim().length < 2) {
      setError("Ingresa tu nombre.");
      return;
    }
    if (!validEmail(form.email)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    setEnviando(true);
    try {
      await api.crearLead({ ...form, plan, origen });
      setExito(true);
    } catch (err: any) {
      setError(err?.message ?? "No se pudo enviar. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl bg-bg border border-line text-sm outline-none focus:ring-2 focus:ring-brand transition-shadow text-ink";
  const labelCls =
    "text-xs font-bold text-muted uppercase tracking-wider mb-1 block";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md my-8 bg-surface rounded-card border border-line shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-ink"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        {exito ? (
          <div className="text-center py-8">
            <div className="h-14 w-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <Check size={28} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-ink">
              ¡Solicitud enviada!
            </h3>
            <p className="text-sm text-muted mt-2">
              Gracias por tu interés{plan ? ` en el plan ${plan}` : ""}. Nuestro
              equipo te contactará muy pronto.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-xl bg-brand text-white font-bold hover:bg-brand-strong transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-black text-ink pr-8">
              {titulo ?? (plan ? `Solicitar plan ${plan}` : "Solicita información")}
            </h3>
            {subtitulo && (
              <p className="text-sm text-muted mt-1">{subtitulo}</p>
            )}

            <form onSubmit={submit} className="space-y-3 mt-5" autoComplete="off">
              {/* Honeypot anti-spam (oculto) */}
              <input
                type="text"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <div>
                <label className={labelCls}>Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  className={inputCls}
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className={labelCls}>Correo *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputCls}
                  placeholder="correo@clinica.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Teléfono</label>
                  <input
                    value={form.telefono}
                    onChange={(e) => set("telefono", e.target.value)}
                    className={inputCls}
                    placeholder="+591..."
                  />
                </div>
                <div>
                  <label className={labelCls}>Clínica</label>
                  <input
                    value={form.empresa}
                    onChange={(e) => set("empresa", e.target.value)}
                    className={inputCls}
                    placeholder="Tu clínica"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Mensaje</label>
                <textarea
                  rows={2}
                  value={form.mensaje}
                  onChange={(e) => set("mensaje", e.target.value)}
                  className={inputCls + " resize-none"}
                  placeholder="¿En qué te podemos ayudar?"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="w-full py-3 rounded-xl bg-brand text-white font-bold hover:bg-brand-strong disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {enviando ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enviando…
                  </>
                ) : (
                  "Enviar solicitud"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
