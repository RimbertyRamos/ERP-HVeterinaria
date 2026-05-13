import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './views/Dashboard';
import { Patients } from './views/Patients';
import { Inventory } from './views/Inventory';
import { POS } from './views/POS';
import { Consultorios } from './views/Consultorios';
import { Laboratory } from './views/Laboratory';
import { Financial } from './views/Financial';
import { WaitingRoom } from './views/WaitingRoom';
import { Agenda } from './views/Agenda';
import { Users } from './views/Users';
import Consultation from './views/Consultation';
import { ChatAssistant } from './components/ChatAssistant';
import { ViewType } from './types';
import { Icons } from './constants';
import { Toaster } from 'sonner';
import { api } from './utils/api';

import { Login } from './views/Login';

// ── Panel de Notificaciones ─────────────────────────────────────────────
interface FichaEspera { id: string; cod_ficha: string; fecha_hora: string; mascota: { nombre: string }; servicio: { nombre: string } }
interface ProductoBajo { id: string; nombre: string; stock_actual: number; stock_minimo: number }

const NotificationsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [fichas, setFichas] = useState<FichaEspera[]>([]);
  const [stockBajo, setStockBajo] = useState<ProductoBajo[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.getFichas({ estado: 'ESPERA' }),
      api.getProductos(),
    ]).then(([f, p]) => {
      const now = Date.now();
      const esperaFiltradas = (f as FichaEspera[])
        .filter(fi => Math.round((now - new Date(fi.fecha_hora).getTime()) / 60000) >= 10)
        .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime());
      setFichas(esperaFiltradas);
      setStockBajo((p as ProductoBajo[]).filter(pr => Number(pr.stock_actual) <= Number(pr.stock_minimo)));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const total = fichas.length + stockBajo.length;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
    >
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-black text-sm uppercase tracking-widest">Alertas del Sistema</h3>
        {total > 0 && (
          <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{total}</span>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando alertas...</div>
      ) : total === 0 ? (
        <div className="p-8 text-center opacity-40 space-y-2">
          <Icons.Check size={32} className="mx-auto text-emerald-500" />
          <p className="text-sm font-bold">Todo en orden</p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
          {fichas.map(f => {
            const min = Math.round((Date.now() - new Date(f.fecha_hora).getTime()) / 60000);
            return (
              <div key={f.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Icons.Clock size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{f.mascota.nombre} · {f.cod_ficha}</p>
                  <p className="text-xs text-slate-500">{min} min esperando · {f.servicio.nombre}</p>
                </div>
              </div>
            );
          })}
          {stockBajo.map(p => (
            <div key={p.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Icons.AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{p.nombre}</p>
                <p className="text-xs text-slate-500">Stock: {p.stock_actual} / Mínimo: {p.stock_minimo}</p>
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
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'vet123') { // Contraseña simple para el Kiosk
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
          <h1 className="text-3xl font-black tracking-tighter uppercase">Modo Kiosk Display</h1>
          <p className="mt-2 text-slate-400 font-bold uppercase tracking-widest text-xs">Acceso restringido a Pantalla de Espera</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              placeholder="Contraseña del sistema"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-xl bg-white/5 border-2 ${error ? 'border-red-500' : 'border-white/10'} p-4 text-center text-xl font-bold tracking-widest outline-none transition-all focus:border-primary/50`}
              autoFocus
            />
            {error && (
              <p className="absolute -bottom-6 left-0 right-0 text-xs font-bold text-red-500 uppercase tracking-widest">Contraseña incorrecta</p>
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
  const [isKiosk, setIsKiosk] = useState(() => window.location.pathname === '/kiosk');
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [showNotifications, setShowNotifications] = useState(false);

  // Escuchar cambios en la URL (para el modo Kiosk)
  useEffect(() => {
    const handleLocationChange = () => {
      setIsKiosk(window.location.pathname === '/kiosk');
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'clinical':
        return <Patients />;
      case 'inventory':
        return <Inventory />;
      case 'farmacia':
        return <Inventory />;
      case 'pos':
        return <POS />;
      case 'consultorios':
        return <Consultorios />;
      case 'laboratory':
        return <Laboratory />;
      case 'financial':
        return <Financial />;
      case 'agenda':
        return <Agenda />;
      case 'users':
        return <Users />;
      case 'waiting-room':
        return <WaitingRoom onClose={() => setCurrentView('dashboard')} />;
      case 'consultation':
        return <Consultation />;
      case 'settings':
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

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Toaster position="top-right" richColors closeButton theme={isDarkMode ? 'dark' : 'light'} />
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 dark:border-slate-800 dark:bg-slate-900 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
              <Icons.Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar en el sistema..." 
                className="bg-transparent text-sm outline-none text-slate-900 dark:text-slate-100 w-64"
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
                onClick={() => setShowNotifications(v => !v)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Icons.Bell size={20} />
                <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <NotificationsPanel onClose={() => setShowNotifications(false)} />
                )}
              </AnimatePresence>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="flex flex-col items-end">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {JSON.parse(localStorage.getItem('user') || '{}').nombre ?? 'Usuario'}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Sistema</p>
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
        
        <div className="flex-1 overflow-y-auto">
          {renderView()}
        </div>
      </main>
      
      {/* Botón flotante de IA de Emergencias */}
      <ChatAssistant />
    </div>
  );
};

export default App;
