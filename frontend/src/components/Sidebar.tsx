import React, { useState, useEffect } from "react";
import { cn } from "../utils/cn";
import { Icons } from "../constants";
import { ViewType } from "../types";
import { ProfileModal } from "./ProfileModal";

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

interface StoredUser {
  nombre: string;
  email: string;
  rol?: { nombre: string };
  permisos?: string[];
}

// Lista maestra de navegación SIN DUPLICADOS
const ALL_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Icons.Dashboard },
  { id: "clinical", label: "Clínica", icon: Icons.Clinical },
  { id: "consultation", label: "Mi Consulta", icon: Icons.Clinical },
  { id: "agenda", label: "Agenda", icon: Icons.Agenda },
  { id: "inventory", label: "Inventario", icon: Icons.Inventory },
  { id: "pos", label: "Caja y POS", icon: Icons.POS },
  { id: "consultorios", label: "Consultorios", icon: Icons.MeetingRoom },
  { id: "servicios", label: "Servicios", icon: Icons.FileText },
  { id: "users", label: "Personal y Roles", icon: Icons.User },
  { id: "financial", label: "Finanzas", icon: Icons.Financial },
  { id: "solicitudes", label: "Suscripciones", icon: Icons.Financial },
  { id: "waiting-room", label: "Pantalla Espera", icon: Icons.WaitingRoom },
  // Ítems mostrados por PERMISO (no por rol) — ver PERMISO_POR_ITEM abajo.
  { id: "horarios", label: "Horarios", icon: Icons.Agenda },
  { id: "catalogos", label: "Catálogos", icon: Icons.Settings },
  { id: "bitacora", label: "Bitácora", icon: Icons.FileText },
];

// Ítems de menú que se muestran según un permiso concreto (RBAC), no por rol.
const PERMISO_POR_ITEM: Record<string, string> = {
  bitacora: "bitacora.ver",
  catalogos: "gestionar_catalogos",
  horarios: "gestionar_horarios",
};

const NAV_POR_ROL: Record<string, string[]> = {
  ADMIN: [
    "dashboard",
    "clinical",
    "agenda",
    "inventory",
    "pos",
    "consultorios",
    "servicios",
    "users",
    "financial",
    "solicitudes",
    "waiting-room",
  ],
  VETERINARIO: ["dashboard", "consultation", "clinical", "agenda"],
  CAJERO: ["dashboard", "pos"],
  RECEPCIONISTA: ["dashboard", "clinical", "agenda", "waiting-room"],
  CLIENTE: ["dashboard", "agenda"],
};

function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  mobileOpen = false,
  onClose,
}) => {
  const user = getStoredUser();
  const roleName = user?.rol?.nombre ?? "";
  const allowedIds = NAV_POR_ROL[roleName] ?? [];
  const permisos = user?.permisos ?? [];

  // Los ítems de PERMISO_POR_ITEM se muestran por permiso; el resto, por rol.
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) =>
    PERMISO_POR_ITEM[item.id]
      ? permisos.includes(PERMISO_POR_ITEM[item.id])
      : allowedIds.includes(item.id),
  );

  // Menú colapsable (solo iconos) — la preferencia se recuerda entre sesiones.
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebarCollapsed") === "1",
  );
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebarCollapsed", next ? "1" : "0");
      return next;
    });

  const [profileOpen, setProfileOpen] = useState(false);

  // En escritorio el menú puede ir colapsado; en móvil siempre se ve completo
  // (es un cajón deslizable de ancho normal).
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  const colapsado = collapsed && isDesktop;

  return (
    <>
      {/* Fondo oscuro (solo móvil, cuando el cajón está abierto) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "flex flex-col border-r border-brand-strong bg-brand dark:bg-brand-strong text-white transition-all duration-300",
          // Cajón deslizable en móvil; fijo en su lugar en escritorio.
          "fixed inset-y-0 left-0 z-50 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          colapsado ? "w-20" : "w-64",
        )}
      >
        {/* Logo + botones (colapsar en escritorio / cerrar en móvil) */}
        <div
          className={cn(
            "flex items-center p-6",
            colapsado ? "justify-center" : "gap-3",
          )}
        >
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white flex items-center justify-center ring-1 ring-white/40">
            <img
              src="/logo-hev.png"
              alt="Hospital Escuela de Veterinaria — UAGRM"
              className="h-full w-full object-contain"
            />
          </div>
          {!colapsado && (
            <>
              <div className="flex flex-1 flex-col overflow-hidden">
                <h1 className="font-display text-lg font-extrabold tracking-tight text-white">
                  VET-ERP
                </h1>
                <p className="text-[11px] font-medium uppercase tracking-widest text-white/55">
                  Hospital Veterinario
                </p>
              </div>
              {/* Colapsar (solo escritorio) */}
              <button
                onClick={toggleCollapsed}
                title="Colapsar menú"
                className="hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Icons.ChevronRight size={18} className="rotate-180" />
              </button>
              {/* Cerrar (solo móvil) */}
              <button
                onClick={onClose}
                title="Cerrar menú"
                className="flex lg:hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Icons.X size={18} />
              </button>
            </>
          )}
        </div>

        {colapsado && (
          <button
            onClick={toggleCollapsed}
            title="Expandir menú"
            className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Icons.ChevronRight size={18} />
          </button>
        )}

        <nav className="flex flex-1 flex-col gap-1 px-3 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <button
              key={`nav-${item.id}`} // Clave única garantizada
              onClick={() => onViewChange(item.id as ViewType)}
              title={colapsado ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg py-2 text-sm font-medium transition-colors",
                colapsado ? "justify-center px-2" : "gap-3 px-3",
                currentView === item.id
                  ? "bg-white text-brand-strong font-bold shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <item.icon size={20} className="shrink-0" />
              {!colapsado && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className={cn("mt-auto", colapsado ? "p-2" : "p-4")}>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            title="Mi perfil — cambiar contraseña"
            className={cn(
              "flex w-full items-center rounded-card border border-white/15 p-3 text-left transition-colors hover:bg-white/10",
              colapsado ? "justify-center" : "gap-3",
            )}
          >
            <div
              title={
                colapsado ? `${user?.nombre ?? "Usuario"} · ${roleName}` : undefined
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 text-white font-bold text-sm"
            >
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : "?"}
            </div>
            {!colapsado && (
              <div className="flex flex-col overflow-hidden">
                <p className="truncate text-sm font-bold text-white">
                  {user?.nombre ?? "Usuario"}
                </p>
                <p className="truncate text-[10px] font-black uppercase tracking-widest text-white/55">
                  {roleName || "Personal"}
                </p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  );
};
