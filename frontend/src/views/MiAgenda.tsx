import React, { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { Icons } from "../constants";
import { cn } from "../utils/cn";
import { api } from "../utils/api";
import { Cita } from "../types";
import { toast } from "sonner";
import { SlotPicker } from "../components/SlotPicker";

interface MascotaResumen {
  id: string;
  nombre: string;
  especie?: { nombre: string };
}

export const MiAgenda: React.FC = () => {
  const [mascotas, setMascotas] = useState<MascotaResumen[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const ahora = new Date();
  const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
  const [form, setForm] = useState({
    mascota_id: "",
    tipo: "CONSULTA",
    fecha: hoy,
    hora: "09:00",
    motivo: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ms, cs] = await Promise.all([
        api.getMisMascotas(),
        api.getMisCitas(),
      ]);
      setMascotas(ms);
      setCitas(cs);
    } catch (err: any) {
      toast.error(err?.message ?? "Error cargando tu agenda");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mascota_id) {
      toast.error("Selecciona una mascota");
      return;
    }
    setSaving(true);
    try {
      await api.solicitarCita({
        mascota_id: form.mascota_id,
        tipo: form.tipo,
        fecha_hora: `${form.fecha}T${form.hora}:00`,
        motivo: form.motivo,
      });
      toast.success("Solicitud enviada", {
        description: "Recepción confirmará tu cita pronto.",
      });
      setForm({ ...form, motivo: "" });
      load();
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo solicitar la cita");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full h-12 px-4 rounded-xl bg-bg border border-line outline-none focus:ring-2 focus:ring-brand text-ink";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8"
    >
      <header>
        <h2 className="text-2xl font-bold text-ink">Mis Citas</h2>
        <p className="text-muted">
          Solicita una cita para tus mascotas. Recepción la confirmará.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de solicitud */}
        <section className="lg:col-span-1 bg-surface rounded-card border border-line p-6 h-fit">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-ink">
            <Icons.Plus size={18} className="text-brand-ink" /> Solicitar cita
          </h3>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-muted uppercase tracking-widest">
                Mascota
              </label>
              <select
                value={form.mascota_id}
                onChange={(e) =>
                  setForm({ ...form, mascota_id: e.target.value })
                }
                required
                className={inputCls}
              >
                <option value="">— Selecciona —</option>
                {mascotas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                    {m.especie ? ` (${m.especie.nombre})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-muted uppercase tracking-widest">
                Tipo
              </label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className={inputCls}
              >
                <option value="CONSULTA">Consulta</option>
                <option value="CONTROL">Control</option>
                <option value="VACUNACION">Vacunación</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-muted uppercase tracking-widest">
                Fecha
              </label>
              <input
                type="date"
                min={hoy}
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                required
                className={inputCls}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-muted uppercase tracking-widest">
                Hora (elige un horario libre)
              </label>
              <SlotPicker
                fecha={form.fecha}
                duracion={30}
                value={form.hora}
                onChange={(h) => setForm({ ...form, hora: h })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-muted uppercase tracking-widest">
                Motivo (opcional)
              </label>
              <input
                type="text"
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                placeholder="Ej: control anual"
                className={inputCls}
              />
            </div>

            <p className="text-[11px] text-muted">
              Horario de atención: 08:00 a 20:00. No se pueden agendar fechas
              pasadas.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-brand text-white font-black uppercase tracking-widest disabled:opacity-50 hover:bg-brand-strong transition-colors"
            >
              {saving ? "Enviando…" : "Solicitar cita"}
            </button>
          </form>
        </section>

        {/* Historial */}
        <section className="lg:col-span-2 bg-surface rounded-card border border-line p-6">
          <h3 className="font-bold mb-4 text-ink">Historial de citas</h3>
          {loading ? (
            <p className="text-muted italic">Cargando…</p>
          ) : citas.length === 0 ? (
            <div className="text-center py-12 opacity-40">
              <Icons.Agenda size={48} className="mx-auto" />
              <p className="font-bold mt-2">Aún no tienes citas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {citas.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-line"
                >
                  <div className="flex flex-col items-center justify-center w-24 py-2 rounded-lg bg-surface-2 text-center">
                    <span className="text-xs font-bold text-ink">
                      {new Date(c.fecha_hora).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <span className="text-sm font-black text-ink">
                      {new Date(c.fecha_hora).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate text-ink">
                      {c.mascota.nombre}
                    </p>
                    <p className="text-xs text-muted truncate">{c.motivo}</p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border",
                      c.estado === "SOLICITADA"
                        ? "bg-violet-50 text-violet-600 border-violet-200"
                        : c.estado === "PROGRAMADA"
                          ? "bg-amber-50 text-amber-600 border-amber-200"
                          : c.estado === "CONFIRMADA"
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : c.estado === "COMPLETADA"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : c.estado === "NO_ASISTIO"
                                ? "bg-rose-50 text-rose-600 border-rose-200"
                                : "bg-surface-2 text-muted border-line",
                    )}
                  >
                    {c.estado.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
};
