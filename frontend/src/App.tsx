import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./views/Dashboard";
import { Patients } from "./views/Patients";
import { Inventory } from "./views/Inventory";
import { POS } from "./views/POS";
import { Consultorios } from "./views/Consultorios";
import { Services } from "./views/Services";
import { Financial } from "./views/Financial";
import { WaitingRoom } from "./views/WaitingRoom";
import { Agenda } from "./views/Agenda";
import { MiAgenda } from "./views/MiAgenda";
import { Users } from "./views/Users";
import Consultation from "./views/Consultation";
import { Bitacora } from "./views/Bitacora";
import { Catalogos } from "./views/Catalogos";
import { Horarios } from "./views/Horarios";
import { ForcePasswordChange } from "./components/ForcePasswordChange";
import { ChatAssistant } from "./components/ChatAssistant";
import { ViewType } from "./types";
import { Icons } from "./constants";
import { Toaster } from "sonner";
import { api } from "./utils/api";

import { Login } from "./views/Login";
import { Landing } from "./views/Landing";
import { Solicitudes } from "./views/Solicitudes";

// ── Panel de Notificaciones ─────────────────────────────────────────────
interface FichaEspera {
  id: string;
  cod_ficha: string;
  fecha_hora: string;
  mascota: { nombre: string };
  servicio: { nombre: string };
}
interface ProductoBajo {
  id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
}

interface NotiReal {
  id: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha_envio: string;
}

const NotificationsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [fichas, setFichas] = useState<FichaEspera[]>([]);
  const [stockBajo, setStockBajo] = useState<ProductoBajo[]>([]);
  const [notis, setNotis] = useState<NotiReal[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Notificaciones REALES persistidas + alertas operativas derivadas en vivo.
    Promise.allSettled([
      api.getFichas({ estado: "ESPERA" }),
      api.getProductos(),
      api.getNotificaciones(),
    ])
      .then(([f, p, n]) => {
        const now = Date.now();
        if (f.status === "fulfilled") {
          setFichas(
            (f.value as FichaEspera[])
              .filter(
                (fi) =>
                  Math.round(
                    (now - new Date(fi.fecha_hora).getTime()) / 60000,
                  ) >= 10,
              )
              .sort(
                (a, b) =>
                  new Date(a.fecha_hora).getTime() -
                  new Date(b.fecha_hora).getTime(),
              ),
          );
        }
        if (p.status === "fulfilled") {
          setStockBajo(
            (p.value as ProductoBajo[]).filter(
              (pr) => Number(pr.stock_actual) <= Number(pr.stock_minimo),
            ),
          );
        }
        if (n.status === "fulfilled") setNotis(n.value as NotiReal[]);
      })
      .finally(() => setLoading(false));
  }, []);

  const marcarLeida = async (id: string) => {
    try {
      await api.marcarNotificacionLeida(id);
      setNotis((ns) => ns.map((x) => (x.id === id ? { ...x, leida: true } : x)));
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const noLeidas = notis.filter((n) => !n.leida).length;
  const total = noLeidas + fichas.length + stockBajo.length;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
    >
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-black text-sm uppercase tracking-widest">
          Alertas del Sistema
        </h3>
        {total > 0 && (
          <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
            {total}
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          Cargando alertas...
        </div>
      ) : total === 0 ? (
        <div className="p-8 text-center opacity-40 space-y-2">
          <Icons.Check size={32} className="mx-auto text-emerald-500" />
          <p className="text-sm font-bold">Todo en orden</p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
          {notis.map((n) => (
            <button
              key={n.id}
              onClick={() => marcarLeida(n.id)}
              title={n.leida ? "Leída" : "Marcar como leída"}
              className={`w-full text-left p-4 flex items-start gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                n.leida ? "opacity-50" : ""
              }`}
            >
              <Icons.Bell
                size={16}
                className={`mt-0.5 flex-shrink-0 ${
                  n.leida ? "text-slate-400" : "text-primary"
                }`}
              />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{n.titulo}</p>
                <p className="text-xs text-slate-500">{n.mensaje}</p>
              </div>
              {!n.leida && (
                <span className="ml-auto mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              )}
            </button>
          ))}
          {fichas.map((f) => {
            const min = Math.round(
              (Date.now() - new Date(f.fecha_hora).getTime()) / 60000,
            );
            return (
              <div
                key={f.id}
                className="p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Icons.Clock
                  size={16}
                  className="text-amber-500 mt-0.5 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">
                    {f.mascota.nombre} · {f.cod_ficha}
                  </p>
                  <p className="text-xs text-slate-500">
                    {min} min esperando · {f.servicio.nombre}
                  </p>
                </div>
              </div>
            );
          })}
          {stockBajo.map((p) => (
            <div
              key={p.id}
              className="p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Icons.AlertTriangle
                size={16}
                className="text-red-500 mt-0.5 flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{p.nombre}</p>
                <p className="text-xs text-slate-500">
                  Stock: {p.stock_actual} / Mínimo: {p.stock_minimo}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Componente para la gestión del modo Kiosk público
const KioskManager: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "vet123") {
      // Contraseña simple para el Kiosk
      setIsAuthorized(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (isAuthorized) {
    return <WaitingRoom />;
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950 p-6 text-white font-sans">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-slate-900 shadow-[0_0_40px_rgba(163,230,53,0.3)]">
          <Icons.Patients size={48} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">
            Modo Kiosk Display
          </h1>
          <p className="mt-2 text-slate-400 font-bold uppercase tracking-widest text-xs">
            Acceso restringido a Pantalla de Espera
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              placeholder="Contraseña del sistema"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-xl bg-white/5 border-2 ${error ? "border-red-500" : "border-white/10"} p-4 text-center text-xl font-bold tracking-widest outline-none transition-all focus:border-primary/50`}
              autoFocus
            />
            {error && (
              <p className="absolute -bottom-6 left-0 right-0 text-xs font-bold text-red-500 uppercase tracking-widest">
                Contraseña incorrecta
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-primary p-4 text-sm font-black uppercase tracking-[0.2em] text-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            Activar Visualización
          </button>
        </form>

        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest pt-8">
          VET-ERP • Sistema Integral de Gestión Veterinaria
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isKiosk, setIsKiosk] = useState(
    () => window.location.pathname === "/kiosk",
  );
  const [isLanding, setIsLanding] = useState(
    () =>
      window.location.pathname === "/landing" ||
      window.location.pathname === "/",
  );
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("token"),
  );
  // Contraseña temporal pendiente de cambio (RF: forzar cambio en primer login).
  const readMustChange = () => {
    try {
      return !!JSON.parse(localStorage.getItem("user") || "{}")
        ?.debe_cambiar_password;
    } catch {
      return false;
    }
  };
  const [mustChangePassword, setMustChangePassword] = useState(readMustChange);
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Al cambiar de vista (incluido el menú móvil) cerramos el cajón lateral.
  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  // Cuenta de alertas REALES (fichas esperando >10 min + productos con stock
  // bajo) para mostrar el punto rojo solo cuando hay algo. Personal nada más;
  // se refresca cada minuto.
  useEffect(() => {
    const rol = JSON.parse(localStorage.getItem("user") || "{}")?.rol?.nombre;
    const esCliente = rol === "CLIENTE";
    let activo = true;
    const cargarAlertas = () => {
      // El CLIENTE solo ve sus notificaciones reales; el personal ve además las
      // alertas operativas (fichas esperando + stock bajo).
      const tareas: Promise<unknown>[] = esCliente
        ? [Promise.resolve([]), Promise.resolve([]), api.getNotificaciones()]
        : [
            api.getFichas({ estado: "ESPERA" }),
            api.getProductos(),
            api.getNotificaciones(),
          ];
      Promise.allSettled(tareas).then(([f, p, n]) => {
        if (!activo) return;
        const now = Date.now();
        const esperando =
          f.status === "fulfilled"
            ? (f.value as FichaEspera[]).filter(
                (fi) =>
                  Math.round(
                    (now - new Date(fi.fecha_hora).getTime()) / 60000,
                  ) >= 10,
              ).length
            : 0;
        const bajo =
          p.status === "fulfilled"
            ? (p.value as ProductoBajo[]).filter(
                (pr) => Number(pr.stock_actual) <= Number(pr.stock_minimo),
              ).length
            : 0;
        const noLeidas =
          n.status === "fulfilled"
            ? (n.value as { leida: boolean }[]).filter((x) => !x.leida).length
            : 0;
        setNotifCount(esperando + bajo + noLeidas);
      });
    };
    cargarAlertas();
    const id = setInterval(cargarAlertas, 60000);
    return () => {
      activo = false;
      clearInterval(id);
    };
  }, []);

  // Escuchar cambios en la URL (para el modo Kiosk y Landing)
  useEffect(() => {
    const handleLocationChange = () => {
      setIsKiosk(window.location.pathname === "/kiosk");
      setIsLanding(
        window.location.pathname === "/landing" ||
          window.location.pathname === "/",
      );
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = () => {
    // Deja constancia del cierre de sesión en la bitácora (fire-and-forget) antes
    // de descartar el token en el cliente.
    void api.logout().catch(() => {});
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
  };

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "clinical":
        return <Patients />;
      case "inventory":
        return <Inventory />;
      case "pos":
        return <POS />;
      case "consultorios":
        return <Consultorios />;
      case "servicios":
        return <Services />;
      case "financial":
        return <Financial />;
      case "agenda": {
        // El propietario (CLIENTE) ve su propia agenda de autoservicio.
        const rolActual = JSON.parse(localStorage.getItem("user") || "{}")?.rol
          ?.nombre;
        return rolActual === "CLIENTE" ? <MiAgenda /> : <Agenda />;
      }
      case "users":
        return <Users />;
      case "solicitudes":
        return <Solicitudes />;
      case "waiting-room":
        return <WaitingRoom onClose={() => setCurrentView("dashboard")} />;
      case "consultation":
        return <Consultation />;
      case "bitacora": {
        // Protección de la ruta: solo si el usuario tiene el permiso bitacora.ver.
        const permisos: string[] =
          JSON.parse(localStorage.getItem("user") || "{}")?.permisos ?? [];
        return permisos.includes("bitacora.ver") ? <Bitacora /> : <Dashboard />;
      }
      case "catalogos": {
        const permisos: string[] =
          JSON.parse(localStorage.getItem("user") || "{}")?.permisos ?? [];
        return permisos.includes("gestionar_catalogos") ? (
          <Catalogos />
        ) : (
          <Dashboard />
        );
      }
      case "horarios": {
        const permisos: string[] =
          JSON.parse(localStorage.getItem("user") || "{}")?.permisos ?? [];
        return permisos.includes("gestionar_horarios") ? (
          <Horarios />
        ) : (
          <Dashboard />
        );
      }
      case "settings":
        return (
          <div className="flex h-full items-center justify-center text-slate-500">
            <div className="text-center space-y-4">
              <Icons.Agenda size={64} className="mx-auto opacity-20" />
              <h2 className="text-xl font-bold">Módulo de Agenda</h2>
              <p>Próximamente: Gestión de citas y recordatorios.</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  // Prioridad para el modo Kiosk público
  if (isKiosk) {
    return <KioskManager />;
  }

  // Landing page pública
  if (!isAuthenticated && isLanding && !showLogin) {
    return <Landing onGoToLogin={() => setShowLogin(true)} />;
  }

  if (!isAuthenticated) {
    return (
      <Login
        onLogin={() => {
          setIsAuthenticated(true);
          setShowLogin(false);
          setIsLanding(false);
          setMustChangePassword(readMustChange());
        }}
      />
    );
  }

  // Contraseña temporal: bloquea el sistema hasta que el usuario la cambie.
  if (mustChangePassword) {
    return (
      <ForcePasswordChange onDone={() => setMustChangePassword(false)} />
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Toaster
        position="top-right"
        richColors
        closeButton
        theme={isDarkMode ? "dark" : "light"}
      />
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8 dark:border-slate-800 dark:bg-slate-900 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              title="Abrir menú"
              className="flex lg:hidden h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Icons.Menu size={22} />
            </button>
            <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
              <Icons.Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Buscar en el sistema..."
                className="bg-transparent text-sm outline-none text-slate-900 dark:text-slate-100 w-40 lg:w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Icons.Bell size={20} />
                {notifCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <NotificationsPanel
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </AnimatePresence>
            </div>
            <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex items-center gap-3 pl-0 sm:pl-2">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {JSON.parse(localStorage.getItem("user") || "{}").nombre ??
                    "Usuario"}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Sistema
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
              >
                <Icons.ArrowRight size={18} className="rotate-180" />
              </button>
            </div>
          </div>
        </header>

        {currentView === "waiting-room" ? (
          <div className="flex-1 min-h-0 bg-slate-950">{renderView()}</div>
        ) : (
          <div className="flex-1 overflow-y-auto">{renderView()}</div>
        )}
      </main>

      {/* Botón flotante de IA de Emergencias */}
      <ChatAssistant />
    </div>
  );
};

export default App;
