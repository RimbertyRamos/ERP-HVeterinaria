import React, { useState } from "react";
import { Icons } from "../constants";

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("admin@vetcare.com");
  const [password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onLogin();
      } else {
        setError(
          data.error || "Credenciales incorrectas o error en el servidor",
        );
      }
    } catch (err) {
      setError(
        "Error al intentar conectar con el servidor. ¿Está el backend encendido?",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md bg-surface rounded-card shadow-xl overflow-hidden border border-line">
        <div className="bg-brand p-8 flex flex-col items-center justify-center">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-white ring-2 ring-white/40 shadow-lg mb-4 flex items-center justify-center">
            <img
              src="/logo-hev.png"
              alt="Hospital Escuela de Veterinaria — UAGRM"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
            VET-ERP
          </h1>
          <p className="text-[11px] font-medium uppercase tracking-widest text-white/55 mt-1">
            Hospital Veterinario · UAGRM
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Icons.Search size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-bg border border-line rounded-lg text-ink focus:ring-2 focus:ring-brand outline-none transition-shadow"
                  placeholder="admin@vetcare.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-ink">
                  Contraseña
                </label>
                <a href="#" className="text-xs text-brand-ink hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Icons.Clinical size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-bg border border-line rounded-lg text-ink focus:ring-2 focus:ring-brand outline-none transition-shadow"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand hover:bg-brand-strong text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
