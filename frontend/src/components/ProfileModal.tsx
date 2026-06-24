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

/** Modal "Mi Perfil": muestra al usuario y permite cambiar su contraseña. */
export const ProfileModal: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const user = getStoredUser();

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [saving, setSaving] = useState(false);

  // Política de seguridad: 8+ con mayúscula, minúscula y número.
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
    "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-slate-900/80 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-10 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          title="Cerrar"
        >
          <Icons.X size={20} />
        </button>

        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Mi Perfil
        </h2>

        <div className="mt-3 mb-5 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm">
          <p className="font-bold text-slate-900 dark:text-slate-100">
            {user?.nombre || "Usuario"}
          </p>
          <p className="text-slate-500">{user?.email}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {user?.rol?.nombre || "Personal"}
          </p>
        </div>

        <h3 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
          Cambiar contraseña
        </h3>

        <form onSubmit={submit} autoComplete="off" className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
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
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
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
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
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
                    : "text-slate-400"
                }
              >
                {r.ok ? "✓" : "○"} {r.label}
              </li>
            ))}
            <li
              className={
                coinciden
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-400"
              }
            >
              {coinciden ? "✓" : "○"} Las contraseñas coinciden
            </li>
          </ul>

          <button
            type="submit"
            disabled={!puedeEnviar}
            className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-slate-900 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
};
