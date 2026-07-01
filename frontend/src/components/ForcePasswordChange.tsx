import React, { useState } from "react";
import { toast } from "sonner";
import { api } from "../utils/api";

/**
 * Pantalla BLOQUEANTE que se muestra tras el login cuando el usuario tiene
 * `debe_cambiar_password = true` (contraseña temporal). No se puede cerrar ni
 * usar el sistema hasta cambiarla. Reutiliza el endpoint /perfil/password
 * (api.changePassword) y la misma política de seguridad (8+, mayús/minús/número).
 */
export const ForcePasswordChange: React.FC<{ onDone: () => void }> = ({
  onDone,
}) => {
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
      // Refleja el cambio en el usuario almacenado para no volver a pedirlo.
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        u.debe_cambiar_password = false;
        localStorage.setItem("user", JSON.stringify(u));
      } catch {
        /* noop */
      }
      toast.success("Contraseña actualizada. ¡Bienvenido!");
      onDone();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo cambiar la contraseña");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
          Cambia tu contraseña
        </h2>
        <p className="mt-1 mb-4 text-sm text-slate-500">
          Por seguridad, debes reemplazar la contraseña temporal antes de
          continuar.
        </p>

        <form onSubmit={submit} autoComplete="off" className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Contraseña actual (temporal)
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
            {saving ? "Guardando…" : "Guardar y continuar"}
          </button>
        </form>
      </div>
    </div>
  );
};
