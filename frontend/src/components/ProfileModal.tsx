import React, { useState } from "react";
import { toast } from "sonner";
import { Icons } from "../constants";
import { api } from "../utils/api";

interface StoredUser {
  nombre?: string;
  email?: string;
  rol?: { nombre: string };
}

function getStoredUser(): StoredUser {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}") as StoredUser;
  } catch {
    return {};
  }
}

export const ProfileModal: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const user = getStoredUser();

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [saving, setSaving] = useState(false);

  const reglas = [
    { ok: nueva.length >= 8, label: "Al menos 8 caracteres" },
    { ok: /[A-Z]/.test(nueva), label: "Una letra mayúscula (A-Z)" },
    { ok: /[a-z]/.test(nueva), label: "Una letra minúscula (a-z)" },
    { ok: /[0-9]/.test(nueva), label: "Un número (0-9)" },
  ];
  const todasOk = reglas.every((r) => r.ok);
  const coinciden = nueva.length > 0 && nueva === confirmar;
  const puedeEnviar = actual.length > 0 && todasOk && coinciden && !saving;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeEnviar) return;
    setSaving(true);
    try {
      await api.changePassword(actual, nueva);
      toast.success("Contraseña actualizada correctamente");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo cambiar la contraseña");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full bg-bg border border-line rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none text-ink";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-slate-900/80 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-10 w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-ink"
          title="Cerrar"
        >
          <Icons.X size={20} />
        </button>

        <h2 className="text-lg font-bold text-ink">Mi Perfil</h2>

        <div className="mt-3 mb-5 rounded-lg border border-line p-3 text-sm">
          <p className="font-bold text-ink">{user?.nombre || "Usuario"}</p>
          <p className="text-muted">{user?.email}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-muted">
            {user?.rol?.nombre || "Personal"}
          </p>
        </div>

        <h3 className="mb-2 text-sm font-bold text-ink">Cambiar contraseña</h3>

        <form onSubmit={submit} autoComplete="off" className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Contraseña actual
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Nueva contraseña
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Repetir nueva contraseña
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className={inputCls}
            />
          </div>

          <ul className="space-y-1 pt-1 text-xs">
            {reglas.map((r, i) => (
              <li
                key={i}
                className={
                  r.ok
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted"
                }
              >
                {r.ok ? "✓" : "○"} {r.label}
              </li>
            ))}
            <li
              className={
                coinciden
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted"
              }
            >
              {coinciden ? "✓" : "○"} Las contraseñas coinciden
            </li>
          </ul>

          <button
            type="submit"
            disabled={!puedeEnviar}
            className="mt-2 w-full rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-strong disabled:opacity-50 transition-colors"
          >
            {saving ? "Guardando…" : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
};
