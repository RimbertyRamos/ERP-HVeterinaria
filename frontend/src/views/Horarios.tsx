import React, { useCallback, useEffect, useState } from "react";
import { Icons } from "../constants";
import { api } from "../utils/api";
import { toast } from "sonner";

interface SalaOpt {
  id: string;
  nombre: string;
}
interface DocOpt {
  id: string;
  nombre: string;
}
interface Horario {
  id: string;
  inicio: string;
  fin: string;
  nota: string | null;
  consultorio: { id: string; nombre: string };
  doctor: { id: string; nombre: string };
}

const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  });
const diaLabel = (isoDay: string) =>
  new Date(`${isoDay}T00:00:00`).toLocaleDateString("es-BO", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });

export const Horarios: React.FC = () => {
  const [salas, setSalas] = useState<SalaOpt[]>([]);
  const [doctores, setDoctores] = useState<DocOpt[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    consultorio_id: "",
    doctor_id: "",
    fecha: "",
    horaInicio: "",
    horaFin: "",
    nota: "",
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [s, d, h] = await Promise.all([
        api.getConsultorios(),
        api.getVeterinarios(),
        api.getHorarios(),
      ]);
      setSalas(s as SalaOpt[]);
      setDoctores(d as DocOpt[]);
      setHorarios(h as Horario[]);
    } catch (e: any) {
      toast.error(e.message ?? "Error al cargar la programación");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.consultorio_id ||
      !form.doctor_id ||
      !form.fecha ||
      !form.horaInicio ||
      !form.horaFin
    ) {
      toast.error("Completa consultorio, doctor, fecha y horas");
      return;
    }
    setSaving(true);
    try {
      await api.createHorario({
        consultorio_id: form.consultorio_id,
        doctor_id: form.doctor_id,
        inicio: `${form.fecha}T${form.horaInicio}:00`,
        fin: `${form.fecha}T${form.horaFin}:00`,
        nota: form.nota || undefined,
      });
      toast.success("Franja asignada");
      setForm((f) => ({ ...f, horaInicio: "", horaFin: "", nota: "" }));
      cargar();
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo asignar la franja");
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (h: Horario) => {
    if (
      !window.confirm(
        `¿Eliminar la franja de ${h.doctor.nombre} en ${h.consultorio.nombre}?`,
      )
    )
      return;
    try {
      await api.deleteHorario(h.id);
      toast.success("Franja eliminada");
      cargar();
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo eliminar");
    }
  };

  const porDia = horarios.reduce<Record<string, Horario[]>>((acc, h) => {
    const dia = new Date(h.inicio).toISOString().slice(0, 10);
    (acc[dia] ??= []).push(h);
    return acc;
  }, {});
  const dias = Object.keys(porDia).sort();

  const inputCls =
    "h-10 px-3 rounded-lg bg-bg border border-line text-sm text-ink outline-none focus:border-brand transition-colors";

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-ink">
          Programación de consultorios
        </h1>
        <p className="text-sm text-muted">
          Asigna doctores a consultorios por franjas horarias
        </p>
      </div>

      <form
        onSubmit={crear}
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 items-end bg-surface p-4 rounded-card border border-line"
      >
        <label className="flex flex-col gap-1 text-xs font-bold text-muted">
          Consultorio
          <select
            value={form.consultorio_id}
            onChange={(e) => set("consultorio_id", e.target.value)}
            className={inputCls}
          >
            <option value="">— Sala —</option>
            {salas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-muted">
          Doctor
          <select
            value={form.doctor_id}
            onChange={(e) => set("doctor_id", e.target.value)}
            className={inputCls}
          >
            <option value="">— Doctor —</option>
            {doctores.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-muted">
          Fecha
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => set("fecha", e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-muted">
          Desde
          <input
            type="time"
            value={form.horaInicio}
            onChange={(e) => set("horaInicio", e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-muted">
          Hasta
          <input
            type="time"
            value={form.horaFin}
            onChange={(e) => set("horaFin", e.target.value)}
            className={inputCls}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="h-10 px-4 rounded-lg bg-brand text-sm font-black text-white hover:bg-brand-strong disabled:opacity-50 transition-colors"
        >
          {saving ? "Guardando…" : "Asignar"}
        </button>
        <label className="flex flex-col gap-1 text-xs font-bold text-muted col-span-2 md:col-span-3 xl:col-span-6">
          Nota (opcional)
          <input
            type="text"
            value={form.nota}
            onChange={(e) => set("nota", e.target.value)}
            placeholder="p. ej. turno mañana"
            className={inputCls}
          />
        </label>
      </form>

      {loading ? (
        <p className="py-8 text-center text-muted">Cargando…</p>
      ) : dias.length === 0 ? (
        <p className="py-8 text-center text-muted">Sin franjas programadas.</p>
      ) : (
        <div className="space-y-5">
          {dias.map((dia) => (
            <section key={dia}>
              <h2 className="text-sm font-black uppercase tracking-widest text-muted mb-2 capitalize">
                {diaLabel(dia)}
              </h2>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {porDia[dia]
                  .sort(
                    (a, b) =>
                      new Date(a.inicio).getTime() -
                      new Date(b.inicio).getTime(),
                  )
                  .map((h) => (
                    <div
                      key={h.id}
                      className="flex items-start justify-between rounded-card border border-line bg-surface p-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-ink">
                          {hhmm(h.inicio)} – {hhmm(h.fin)}
                        </p>
                        <p className="text-xs text-muted">
                          {h.consultorio.nombre} · {h.doctor.nombre}
                        </p>
                        {h.nota && (
                          <p className="text-xs text-muted/70 italic mt-0.5">
                            {h.nota}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => eliminar(h)}
                        className="p-1.5 text-muted hover:text-red-500 transition-colors"
                        title="Eliminar franja"
                      >
                        <Icons.Trash2 size={16} />
                      </button>
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default Horarios;
