import React from 'react';
import { cn } from '../utils/cn';
import { Icons } from '../constants';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

interface StoredUser {
  nombre: string;
  email: string;
  rol?: { nombre: string };
}

// Lista maestra de navegación SIN DUPLICADOS
const ALL_NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',       icon: Icons.Dashboard },
  { id: 'clinical',     label: 'Clínica',          icon: Icons.Clinical },
  { id: 'consultation', label: 'Mi Consulta',     icon: Icons.Clinical },
  { id: 'agenda',       label: 'Agenda',            icon: Icons.Agenda },
  { id: 'inventory',    label: 'Inventario',        icon: Icons.Inventory },
  { id: 'farmacia',     label: 'Farmacia',          icon: Icons.Inventory },
  { id: 'pos',           label: 'Caja y POS',      icon: Icons.POS },
  { id: 'laboratory',   label: 'Laboratorio',     icon: Icons.Laboratory },
  { id: 'consultorios',  label: 'Consultorios',    icon: Icons.MeetingRoom },
  { id: 'users',         label: 'Personal y Roles', icon: Icons.User },
  { id: 'financial',     label: 'Finanzas',        icon: Icons.Financial },
  { id: 'waiting-room',  label: 'Pantalla Espera', icon: Icons.WaitingRoom },
];

const NAV_POR_ROL: Record<string, string[]> = {
  ADMIN:          ['dashboard', 'clinical', 'agenda', 'inventory', 'pos', 'consultorios', 'users', 'financial', 'waiting-room'],
  VETERINARIO:    ['dashboard', 'consultation', 'clinical', 'agenda', 'laboratory'],
  LABORATORISTA:  ['dashboard', 'consultation', 'laboratory', 'clinical'],
  CAJERO:         ['dashboard', 'pos'],
  FARMACEUTICO:   ['dashboard', 'farmacia'],
  RECEPCIONISTA:  ['dashboard', 'clinical', 'agenda', 'waiting-room'],
  CLIENTE:        ['dashboard'],
};

function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const user = getStoredUser();
  const roleName = user?.rol?.nombre ?? '';
  const allowedIds = NAV_POR_ROL[roleName] ?? [];
  
  // Filtramos y aseguramos que no haya duplicados por ID
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => allowedIds.includes(item.id));

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="flex items-center gap-3 p-6">
        <div className="h-10 w-10 overflow-hidden rounded-lg bg-primary/20 flex items-center justify-center text-primary">
          <Icons.Patients size={24} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">VET-ERP</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Hospital Veterinario</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 overflow-y-auto">
        {visibleNavItems.map((item) => (
          <button
            key={`nav-${item.id}`} // Clave única garantizada
            onClick={() => onViewChange(item.id as ViewType)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              currentView === item.id
                ? "bg-primary/10 text-primary font-bold"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            )}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-slate-900 font-bold text-sm">
            {user?.nombre ? user.nombre.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {user?.nombre ?? 'Usuario'}
            </p>
            <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">
              {roleName || 'Personal'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
